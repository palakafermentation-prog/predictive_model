import type { PredictionRequest, PredictionResponse } from "@pferm/shared-schemas";
import { pythonWorkerPool } from "./python-worker-pool";

/**
 * Dispatch a prediction request to the Python worker pool.
 * The requestId allows the caller to poll /api/queue/status while waiting.
 */
export function dispatchAiRequest(requestId: string, request: PredictionRequest): Promise<PredictionResponse> {
  return pythonWorkerPool.dispatch(requestId, request);
}
