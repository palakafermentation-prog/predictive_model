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
}

const progressMap = new Map<string, CsvProgress>();

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

/** Remove tracking entry. Call after processing completes (success or error). */
export function complete(requestId: string): void {
  progressMap.delete(requestId);
}

/** Get current progress, or null if not tracked. */
export function get(requestId: string): CsvProgress | null {
  return progressMap.get(requestId) ?? null;
}
