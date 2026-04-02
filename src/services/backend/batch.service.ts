import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { generateBatchId } from "./db.service";
import { predict } from "./prediction.service";
import type { UserSession } from "./permissions";
import type { BatchSaveRequest, PredictionRequest } from "@pferm/shared-schemas";

const batchListSelect = {
  id: true,
  batchId: true,
  qualityScore: true,
  qcStatus: true,
  updatedAt: true,
} as const;

const batchDetailSelect = {
  id: true,
  batchId: true,
  parameters: true,
  predictions: true,
  qualityScore: true,
  qcStatus: true,
  qcFlags: true,
  modelVersion: true,
  schemaVersion: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * List batches for the authenticated user, newest first (paginated).
 */
export async function getBatches(
  user: UserSession,
  pagination: { page: number; perPage: number } = { page: 1, perPage: 50 }
) {
  const where = { userId: user.id };
  const skip = (pagination.page - 1) * pagination.perPage;

  const [items, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      select: batchListSelect,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pagination.perPage,
    }),
    prisma.batch.count({ where }),
  ]);

  return { items, total, page: pagination.page, perPage: pagination.perPage };
}

/**
 * Get a single batch by database ID.
 * Returns 404 for both missing and non-owned batches (no existence leaking).
 */
export async function getBatch(user: UserSession, id: string) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    select: { userId: true, ...batchDetailSelect },
  });

  if (!batch || batch.userId !== user.id) {
    throw new NotFoundError("Batch not found");
  }

  const { userId: _, ...rest } = batch;
  return rest;
}

/**
 * Save (upsert) a batch for the authenticated user.
 * Same batchId for the same user overwrites existing data.
 */
export async function saveBatch(user: UserSession, data: BatchSaveRequest) {
  return prisma.batch.upsert({
    where: {
      userId_batchId: { userId: user.id, batchId: data.batchId },
    },
    update: {
      parameters: data.parameters,
      predictions: data.predictions,
      qualityScore: data.predictions.predicted_quality_score,
      qcStatus: data.qcStatus,
      qcFlags: data.qcFlags,
      modelVersion: data.modelVersion,
      schemaVersion: data.schemaVersion,
    },
    create: {
      id: generateBatchId(),
      userId: user.id,
      batchId: data.batchId,
      parameters: data.parameters,
      predictions: data.predictions,
      qualityScore: data.predictions.predicted_quality_score,
      qcStatus: data.qcStatus,
      qcFlags: data.qcFlags,
      modelVersion: data.modelVersion,
      schemaVersion: data.schemaVersion,
    },
    select: batchListSelect,
  });
}

export interface CsvRowError {
  row: number;
  batchId: string;
  message: string;
}

export interface CsvUploadResult {
  saved: Awaited<ReturnType<typeof saveBatch>>[];
  errors: CsvRowError[];
}

/**
 * Process CSV upload: run each row through predict, then save as a batch.
 * Continues on per-row failures and reports partial results.
 */
export async function processCsvUpload(user: UserSession, rows: PredictionRequest[]): Promise<CsvUploadResult> {
  const saved: CsvUploadResult["saved"] = [];
  const errors: CsvRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const { batch_id, ...parameters } = row;
      const response = await predict(row, crypto.randomUUID());
      const batch = await saveBatch(user, {
        batchId: batch_id,
        parameters,
        predictions: response.predictions,
        qcStatus: response.qc_status,
        qcFlags: response.qc_flags,
        modelVersion: response.model_version,
        schemaVersion: response.schema_version,
      });
      saved.push(batch);
    } catch (error) {
      errors.push({
        row: i + 1,
        batchId: row.batch_id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { saved, errors };
}

/**
 * Delete a batch by database ID.
 * Returns 404 for both missing and non-owned batches (no existence leaking).
 */
export async function deleteBatch(user: UserSession, id: string) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!batch || batch.userId !== user.id) {
    throw new NotFoundError("Batch not found");
  }

  await prisma.batch.delete({ where: { id } });
}
