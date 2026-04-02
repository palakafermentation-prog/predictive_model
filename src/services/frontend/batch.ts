import { apiFetch, isApiError } from "@/lib/api-client";
import { NEXT_PUBLIC_API_BASE_URL } from "@/lib/env";
import type {
  BatchSaveRequest,
  BatchListItem,
  BatchDetail,
  CsvUploadRequest,
} from "@pferm/shared-schemas";

const baseUrl = NEXT_PUBLIC_API_BASE_URL;

export async function getBatches(
  pagination?: { page?: number; perPage?: number }
): Promise<{ items: BatchListItem[]; total: number; page: number; perPage: number }> {
  const params = new URLSearchParams();
  if (pagination?.page) params.set("page", String(pagination.page));
  if (pagination?.perPage) params.set("perPage", String(pagination.perPage));
  const qs = params.toString();
  const url = qs ? `${baseUrl}/batches?${qs}` : `${baseUrl}/batches`;

  const response = await apiFetch<{ items: BatchListItem[]; total: number; page: number; perPage: number }>(url);
  if (isApiError(response)) throw new Error(response.error.message);
  return response.data;
}

export async function getBatch(id: string): Promise<BatchDetail> {
  const response = await apiFetch<{ batch: BatchDetail }>(`${baseUrl}/batches/${id}`);
  if (isApiError(response)) throw new Error(response.error.message);
  return response.data.batch;
}

export async function saveBatch(data: BatchSaveRequest): Promise<BatchListItem> {
  const response = await apiFetch<{ batch: BatchListItem }>(`${baseUrl}/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (isApiError(response)) throw new Error(response.error.message);
  return response.data.batch;
}

export async function deleteBatch(id: string): Promise<void> {
  const response = await apiFetch<{ success: boolean }>(`${baseUrl}/batches/${id}`, {
    method: "DELETE",
  });
  if (isApiError(response)) throw new Error(response.error.message);
}

export interface CsvUploadRowError {
  row: number;
  batchId: string;
  message: string;
}

export interface CsvUploadResult {
  batches: BatchListItem[];
  errors: CsvUploadRowError[];
}

export async function uploadCsv(rows: CsvUploadRequest["rows"], requestId?: string): Promise<CsvUploadResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (requestId) headers["x-request-id"] = requestId;

  const response = await apiFetch<CsvUploadResult>(`${baseUrl}/batches/csv`, {
    method: "POST",
    headers,
    body: JSON.stringify({ rows }),
  });
  if (isApiError(response)) throw new Error(response.error.message);
  return response.data;
}
