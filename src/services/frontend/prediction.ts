import {
  type PredictionRequest,
  type PredictionResponse,
} from "@pferm/shared-schemas";
import { NEXT_PUBLIC_API_BASE_URL } from "@/lib/env";
import { apiFetch, isApiError } from "@/lib/api-client";

const baseUrl = NEXT_PUBLIC_API_BASE_URL;

export async function predict(input: PredictionRequest): Promise<PredictionResponse> {
  const response = await apiFetch<PredictionResponse>(`${baseUrl}/predictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (isApiError(response)) {
    // Surface field-level errors if present
    if (response.error.fieldErrors) {
      const firstField = Object.keys(response.error.fieldErrors)[0];
      const firstMessage = response.error.fieldErrors[firstField]?.[0];
      if (firstField && firstMessage) {
        throw new Error(`${firstField}: ${firstMessage}`);
      }
    }
    throw new Error(response.error.message);
  }

  return response.data;
}
