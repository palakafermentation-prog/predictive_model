import { apiFetch, isApiError } from "@/lib/api-client";
import { NEXT_PUBLIC_API_BASE_URL } from "@/lib/env";
import type {
  BatchSaveRequest,
  BatchListItem,
  BatchDetail,
  CsvUploadRequest,
} from "@pferm/shared-schemas";

const baseUrl = NEXT_PUBLIC_API_BASE_URL;

export async function getBatches(): Promise<BatchListItem[]> {
  const response = await apiFetch<{ batches: BatchListItem[] }>(`${baseUrl}/batches`);
  if (isApiError(response)) throw new Error(response.error.message);
  return response.data.batches;
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

export async function uploadCsv(rows: CsvUploadRequest["rows"]): Promise<BatchListItem[]> {
  const response = await apiFetch<{ batches: BatchListItem[] }>(`${baseUrl}/batches/csv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (isApiError(response)) throw new Error(response.error.message);
  return response.data.batches;
}
