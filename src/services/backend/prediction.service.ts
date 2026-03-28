import { PredictionRequestSchema } from "@pferm/shared-schemas";
import type { PredictionRequest, PredictionResponse } from "@pferm/shared-schemas";
import { callAiService } from "@/lib/ai-client";
import { generateMockPrediction } from "./prediction-mock";

export async function predict(input: PredictionRequest): Promise<PredictionResponse> {
  const validated = PredictionRequestSchema.parse(input);
  const mockResponse = generateMockPrediction(validated);

  return callAiService<PredictionResponse>(
    "/api/v1/predict",
    validated,
    mockResponse,
  );
}
