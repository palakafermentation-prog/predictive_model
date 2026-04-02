import { NextResponse } from "next/server";
import { pythonWorkerPool } from "@/lib/python-worker-pool";

/**
 * GET /api/queue/status?id=<requestId>
 *
 * Returns the queue position and estimated wait time for a pending request.
 * Used by the frontend to display queue progress while a prediction is being processed.
 *
 * Response:
 *   200 { position: number; estimatedWaitMs: number }
 *     position = 0  → request is currently being processed
 *     position >= 1 → request is queued at this 1-based position
 *   404             → requestId not found (completed, expired, or never existed)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: { code: "MISSING_PARAM", message: "Missing required query param: id" } },
      { status: 400 }
    );
  }

  const status = pythonWorkerPool.getQueueStatus(id);

  if (!status) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Request not found or already completed" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: status });
}
