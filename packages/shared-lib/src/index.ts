export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "Expected value to be defined");
  }
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export {
  generateId,
  ID_PREFIXES,
  generateAuthUserId,
  generateSessionId,
  generateAccountId,
  generateVerificationId,
  generateUserId,
  generateMediaFileId,
  generateBatchId,
} from "./id.js";
