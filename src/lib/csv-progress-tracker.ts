/**
 * In-memory progress tracker for CSV upload operations.
 *
 * Keyed by requestId. Entries are registered at the start of a CSV upload,
 * updated as each row is processed, and removed on completion.
 *
 * The queue status endpoint reads from this tracker to return row-level
 * progress (row N of M) for CSV requests.
 */

export interface CsvProgress {
  totalRows: number;
  processedRows: number;
  completedAt?: number;
}

const globalWithCsvProgress = globalThis as unknown as { csvProgressMap: Map<string, CsvProgress> | undefined };
const progressMap = globalWithCsvProgress.csvProgressMap ?? new Map<string, CsvProgress>();
globalWithCsvProgress.csvProgressMap = progressMap;

/** Register a CSV upload. Call before processing starts. */
export function register(requestId: string, totalRows: number): void {
  progressMap.set(requestId, { totalRows, processedRows: 0 });
}

/** Update processed row count. */
export function update(requestId: string, processedRows: number): void {
  const entry = progressMap.get(requestId);
  if (entry) {
    entry.processedRows = processedRows;
  }
}

const COMPLETED_TTL_MS = 30_000;

/** Mark upload as complete. Entry is retained briefly for status polling. */
export function complete(requestId: string): void {
  const entry = progressMap.get(requestId);
  if (entry) {
    entry.completedAt = Date.now();
  }
  // Prune stale completed entries
  const cutoff = Date.now() - COMPLETED_TTL_MS;
  for (const [id, e] of progressMap) {
    if (e.completedAt && e.completedAt < cutoff) progressMap.delete(id);
  }
}

/** Get current progress, or null if not tracked (or expired). */
export function get(requestId: string): CsvProgress | null {
  return progressMap.get(requestId) ?? null;
}
