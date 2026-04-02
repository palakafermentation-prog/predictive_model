/**
 * Media Service
 * Handles file upload, processing, storage, and retrieval
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import {
  FILE_UPLOADS_PATH,
  MEDIA_MAX_WIDTH_PX,
  MEDIA_MAX_HEIGHT_PX,
  MEDIA_QUALITY_PERCENT,
} from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateMediaFileId } from "@pferm/shared-lib";
import { isAllowedFileType, isImageType } from "@/lib/file-types";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { MediaFile } from "@prisma/client";

/**
 * Sanitize a string for safe use as a single path segment.
 * Strips path separators and traversal sequences to prevent directory escape.
 */
function sanitizePathSegment(value: string): string {
  // Remove path separators and null bytes
  const sanitized = value.replace(/[/\\:\0]/g, "").replace(/\.\./g, "");
  if (!sanitized || sanitized === "." || sanitized === "..") {
    throw new BadRequestError("Invalid path segment");
  }
  return sanitized;
}

export interface UploadOptions {
  userId: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  replaceFileId?: string;
  filePrefix?: string;
}

export interface MediaFileWithUrl extends MediaFile {
  url: string;
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  };
  return map[mimeType] || ".bin";
}

async function processImageUpload(opts: {
  file: Buffer;
  baseFilename: string;
  ext: string;
  storageDir: string;
  storagePath: string;
  mediaFileId: string;
  filename: string;
  userId: string;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  replaceFileId?: string;
}): Promise<MediaFileWithUrl> {
  const originalFilename = `${opts.baseFilename}_original${opts.ext}`;
  const webFilename = `${opts.baseFilename}_web.webp`;
  const originalPath = path.join(opts.storageDir, originalFilename);
  const webPath = path.join(opts.storageDir, webFilename);

  // Save original
  await fs.writeFile(originalPath, opts.file);

  // Create web-optimized WebP version
  const image = sharp(opts.file);
  const webBuffer = await image
    .resize(opts.maxWidth, opts.maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: opts.quality })
    .toBuffer();

  await fs.writeFile(webPath, webBuffer);

  const webStats = await fs.stat(webPath);
  const webMetadata = await sharp(webBuffer).metadata();

  const mediaFile = await prisma.mediaFile.create({
    data: {
      id: opts.mediaFileId,
      relativePath: path.join(opts.storagePath, webFilename),
      mimeType: "image/webp",
      sizeBytes: webStats.size,
      width: webMetadata.width,
      height: webMetadata.height,
      originalFilename: opts.filename,
      createdBy: opts.userId,
      updatedBy: opts.userId,
    },
  });

  if (opts.replaceFileId) {
    await deleteMediaFile(opts.replaceFileId, opts.userId).catch(() => {});
  }

  return { ...mediaFile, url: `/api/media/${mediaFile.id}` };
}

async function processDocumentUpload(opts: {
  file: Buffer;
  baseFilename: string;
  ext: string;
  storageDir: string;
  storagePath: string;
  mediaFileId: string;
  mimeType: string;
  filename: string;
  userId: string;
  replaceFileId?: string;
}): Promise<MediaFileWithUrl> {
  const documentFilename = `${opts.baseFilename}_original${opts.ext}`;
  const documentPath = path.join(opts.storageDir, documentFilename);

  await fs.writeFile(documentPath, opts.file);

  const fileStats = await fs.stat(documentPath);

  const mediaFile = await prisma.mediaFile.create({
    data: {
      id: opts.mediaFileId,
      relativePath: path.join(opts.storagePath, documentFilename),
      mimeType: opts.mimeType,
      sizeBytes: fileStats.size,
      originalFilename: opts.filename,
      createdBy: opts.userId,
      updatedBy: opts.userId,
    },
  });

  if (opts.replaceFileId) {
    await deleteMediaFile(opts.replaceFileId, opts.userId).catch(() => {});
  }

  return { ...mediaFile, url: `/api/media/${mediaFile.id}` };
}

async function deleteFilesFromDisk(mediaFile: MediaFile): Promise<void> {
  const directoryPath = path.join(FILE_UPLOADS_PATH!, path.dirname(mediaFile.relativePath));

  // Find all versions by matching the mediaFileId in the filename
  const mediaIdPattern = `_${mediaFile.id}_`;

  try {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      if (file.includes(mediaIdPattern)) {
        await fs.unlink(path.join(directoryPath, file));
      }
    }
  } catch {
    // Directory may not exist if files were already cleaned up
  }
}

/**
 * Upload and process a file
 * Images get an original + web-optimized WebP version
 * Documents are saved as-is
 */
export async function uploadFile(options: UploadOptions): Promise<MediaFileWithUrl> {
  const {
    userId,
    file,
    filename,
    mimeType,
    maxWidth = MEDIA_MAX_WIDTH_PX,
    maxHeight = MEDIA_MAX_HEIGHT_PX,
    quality = MEDIA_QUALITY_PERCENT,
    replaceFileId,
    filePrefix,
  } = options;

  if (!isAllowedFileType(mimeType)) {
    throw new BadRequestError("File type not supported");
  }

  const mediaFileId = generateMediaFileId();
  const safeUserId = sanitizePathSegment(userId);
  const storagePath = `users/${safeUserId}`;

  const ext = getExtensionFromMimeType(mimeType);
  const safeFilePrefix = filePrefix ? sanitizePathSegment(filePrefix) + "-" : "";
  const baseFilename = `${safeFilePrefix}${safeUserId}_${mediaFileId}`;

  const storageDir = path.resolve(FILE_UPLOADS_PATH!, storagePath);

  // Final guard: ensure resolved path is within the uploads root
  if (!storageDir.startsWith(path.resolve(FILE_UPLOADS_PATH!))) {
    throw new BadRequestError("Invalid storage path");
  }

  await fs.mkdir(storageDir, { recursive: true });

  if (isImageType(mimeType)) {
    return processImageUpload({
      file,
      baseFilename,
      ext,
      storageDir,
      storagePath,
      mediaFileId,
      filename,
      userId,
      maxWidth,
      maxHeight,
      quality,
      replaceFileId,
    });
  }

  return processDocumentUpload({
    file,
    baseFilename,
    ext,
    storageDir,
    storagePath,
    mediaFileId,
    mimeType,
    filename,
    userId,
    replaceFileId,
  });
}

/**
 * Get a media file by ID with computed URL
 */
export async function getMediaFile(mediaFileId: string): Promise<MediaFileWithUrl | null> {
  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id: mediaFileId },
  });

  if (!mediaFile) return null;

  return { ...mediaFile, url: `/api/media/${mediaFile.id}` };
}

/**
 * Get file buffer for serving
 */
export async function getFileBuffer(
  mediaFileId: string
): Promise<{
  buffer: Buffer;
  mimeType: string;
  originalFilename: string | null;
} | null> {
  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id: mediaFileId },
  });

  if (!mediaFile) return null;

  const fullPath = path.resolve(FILE_UPLOADS_PATH!, mediaFile.relativePath);

  // Ensure resolved path is within the uploads root
  if (!fullPath.startsWith(path.resolve(FILE_UPLOADS_PATH!))) {
    return null;
  }

  try {
    const buffer = await fs.readFile(fullPath);
    return {
      buffer,
      mimeType: mediaFile.mimeType,
      originalFilename: mediaFile.originalFilename,
    };
  } catch {
    return null;
  }
}

/**
 * Delete a media file (database record + files on disk)
 */
export async function deleteMediaFile(
  mediaFileId: string,
  userId: string,
  skipPermissionCheck = false
): Promise<boolean> {
  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id: mediaFileId },
  });

  if (!mediaFile) throw new NotFoundError("Media file not found");

  if (!skipPermissionCheck && mediaFile.createdBy !== userId) {
    throw new ForbiddenError("Unauthorized to delete this file");
  }

  // Delete all file versions from disk (original + web)
  await deleteFilesFromDisk(mediaFile);

  await prisma.mediaFile.delete({ where: { id: mediaFileId } });

  return true;
}
