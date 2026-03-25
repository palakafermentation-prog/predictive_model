import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { generateBatchId } from "./db.service";
import type { UserSession } from "./permissions";
import type { BatchSaveRequest } from "@pferm/shared-schemas";

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
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * List all batches for the authenticated user, newest first.
 */
export async function getBatches(user: UserSession) {
  return prisma.batch.findMany({
    where: { userId: user.id },
    select: batchListSelect,
    orderBy: { updatedAt: "desc" },
  });
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
      qualityScore: data.predictions.quality_score,
      qcStatus: data.qcStatus,
      qcFlags: data.qcFlags,
    },
    create: {
      id: generateBatchId(),
      userId: user.id,
      batchId: data.batchId,
      parameters: data.parameters,
      predictions: data.predictions,
      qualityScore: data.predictions.quality_score,
      qcStatus: data.qcStatus,
      qcFlags: data.qcFlags,
    },
    select: batchListSelect,
  });
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
