/**
 * Frontend Media Service
 * Uses XMLHttpRequest for uploads (progress events) and apiFetch for other operations
 */

import { apiFetch, isApiError } from "@/lib/api-client";
import { isAllowedFileType } from "@/lib/file-types";
import type { MediaFileResponse } from "@pferm/shared-schemas";

export type { MediaFileResponse };

export interface UploadOptions {
  file: File;
  replaceFileId?: string;
  filePrefix?: string;
  onProgress?: (percent: number) => void;
  maxFileSize?: number;
}

export interface UploadResult {
  id: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string | null;
  width: number | null;
  height: number | null;
}

/**
 * Upload a file with progress tracking via XHR
 */
export function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const {
    file,
    replaceFileId,
    filePrefix,
    onProgress,
    maxFileSize,
  } = options;

  // Client-side validation
  if (maxFileSize && file.size > maxFileSize) {
    const maxMB = maxFileSize / (1024 * 1024);
    return Promise.reject(new Error(`File too large (max ${maxMB}MB)`));
  }

  if (!isAllowedFileType(file.type)) {
    return Promise.reject(new Error("File type not supported"));
  }

  const formData = new FormData();
  formData.append("file", file);
  if (replaceFileId) formData.append("replaceFileId", replaceFileId);
  if (filePrefix) formData.append("filePrefix", filePrefix);

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          // Backend wraps in { data, requestId } envelope
          resolve((response.data ?? response) as UploadResult);
        } else {
          // Backend wraps errors in { error: { code, message } } envelope
          const message = response.error?.message ?? response.error ?? "Upload failed";
          reject(new Error(message));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", "/api/media/upload");
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}

/**
 * Delete a media file
 */
export async function deleteMediaFile(mediaFileId: string): Promise<void> {
  const response = await apiFetch<{ success: boolean }>(`/api/media/${mediaFileId}`, {
    method: "DELETE",
  });

  if (isApiError(response)) {
    throw new Error(response.error.message);
  }
}

/**
 * Get media file URL by ID
 */
export function getMediaUrl(mediaFileId: string): string {
  return `/api/media/${mediaFileId}`;
}

/**
 * Get media file download URL
 */
export function getMediaDownloadUrl(mediaFileId: string): string {
  return `/api/media/${mediaFileId}?download=true`;
}
