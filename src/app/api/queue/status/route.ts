import { NextResponse } from "next/server";
import { pythonWorkerPool } from "@/lib/python-worker-pool";
import { handleApiError } from "@/lib/api-error";
import * as csvProgress from "@/lib/csv-progress-tracker";

/**
 * GET /api/queue/status?id=<requestId>
 *
 * Returns queue position and progress for a pending request.
 *
 * For predictions:
 *   { position: 0, estimatedWaitMs: 0 }           → being processed
 *   { position: N, estimatedWaitMs: N }            → queued
 *
 * For CSV uploads:
 *   { position: 0, estimatedWaitMs: 0, processedRows: N, totalRows: M } → in progress
 *
 * 404 → requestId not found (completed, expired, or never existed)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: { code: "MISSING_PARAM", message: "Missing required query param: id" } },
        { status: 400 }
      );
    }

    // Check CSV progress first (CSV uploads are tracked here, not in the pool)
    const csv = csvProgress.get(id);
    if (csv) {
      if (csv.completedAt) {
        return NextResponse.json({
          data: { position: 0, estimatedWaitMs: 0, complete: true },
        });
      }
      return NextResponse.json({
        data: {
          position: 0,
          estimatedWaitMs: 0,
          processedRows: csv.processedRows,
          totalRows: csv.totalRows,
        },
      });
    }

    // Check worker pool queue (single predictions)
    const status = pythonWorkerPool.getQueueStatus(id);
    if (!status) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Request not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: status });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/queue/status" });
  }
}
