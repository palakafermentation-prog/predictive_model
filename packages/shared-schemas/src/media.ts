import { z } from "zod/v4";

// ========================================
// MEDIA FILE SCHEMAS
// ========================================

/** Response schema for a media file record */
export const MediaFileSchema = z.object({
  id: z.string(),
  relativePath: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  width: z.number().nullish(),
  height: z.number().nullish(),
  originalFilename: z.string().nullish(),
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type MediaFile = z.infer<typeof MediaFileSchema>;

/** Media file with computed URL (returned from API) */
export const MediaFileResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  width: z.number().nullish(),
  height: z.number().nullish(),
  originalFilename: z.string().nullish(),
});

export type MediaFileResponse = z.infer<typeof MediaFileResponseSchema>;

// ========================================
// UPLOAD SCHEMAS
// ========================================

/** Metadata sent alongside a file upload (form fields, not the file itself) */
export const UploadMediaMetadataSchema = z.object({
  replaceFileId: z.string().optional(),
  filePrefix: z.string().optional(),
});

export type UploadMediaMetadata = z.infer<typeof UploadMediaMetadataSchema>;
