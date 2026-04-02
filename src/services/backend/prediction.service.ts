import { PredictionRequestSchema } from "@pferm/shared-schemas";
import type { PredictionRequest, PredictionResponse } from "@pferm/shared-schemas";
import { dispatchAiRequest } from "@/lib/ai-client";

export async function predict(input: PredictionRequest, requestId: string): Promise<PredictionResponse> {
  const validated = PredictionRequestSchema.parse(input);
  return dispatchAiRequest(requestId, validated);
}
