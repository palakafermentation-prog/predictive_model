import { z } from "zod/v4";
import {
  PredictionRequestSchema,
  PredictionPredictionsSchema,
} from "./prediction";

// --- Request schemas ---

// Parameters without the batch_id field (stored separately)
export const BatchParametersSchema = PredictionRequestSchema.omit({
  batch_id: true,
});

export const BatchSaveRequestSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required").max(100, "Batch ID too long"),
  parameters: BatchParametersSchema,
  predictions: PredictionPredictionsSchema,
  qcStatus: z.string(),
  qcFlags: z.array(z.string()),
  modelVersion: z.string().optional(),
  schemaVersion: z.string().optional(),
});

// CSV upload — rows are the full PredictionRequest (includes batch_id per row)
export const CsvUploadRequestSchema = z.object({
  rows: z
    .array(PredictionRequestSchema)
    .min(1, "At least one row is required")
    .max(100, "Maximum 100 rows per upload"),
});

// --- Response schemas ---

export const BatchListItemSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  qualityScore: z.number(),
  qcStatus: z.string(),
  updatedAt: z.coerce.date(),
});

export const BatchDetailSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  parameters: BatchParametersSchema,
  predictions: PredictionPredictionsSchema,
  qualityScore: z.number(),
  qcStatus: z.string(),
  qcFlags: z.array(z.string()),
  modelVersion: z.string().nullable().optional(),
  schemaVersion: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const BatchListResponseSchema = z.object({
  batches: z.array(BatchListItemSchema),
});

// --- Types ---

export type BatchParameters = z.infer<typeof BatchParametersSchema>;
export type BatchSaveRequest = z.infer<typeof BatchSaveRequestSchema>;
export type CsvUploadRequest = z.infer<typeof CsvUploadRequestSchema>;
export type BatchListItem = z.infer<typeof BatchListItemSchema>;
export type BatchDetail = z.infer<typeof BatchDetailSchema>;
export type BatchListResponse = z.infer<typeof BatchListResponseSchema>;
