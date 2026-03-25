import { NextResponse } from "next/server";
import { getSession } from "@/services/backend/auth.service";
import { saveBatch } from "@/services/backend/batch.service";
import { predict } from "@/services/backend/prediction.service";
import { handleApiError } from "@/lib/api-error";
import { CsvUploadRequestSchema } from "@pferm/shared-schemas";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" }, requestId },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rows } = CsvUploadRequestSchema.parse(body);

    const saved = [];
    for (const row of rows) {
      const { batch_id, ...parameters } = row;
      const response = await predict(row);
      const batch = await saveBatch(session.user, {
        batchId: batch_id,
        parameters,
        predictions: response.predictions,
        qcStatus: response.qc_status,
        qcFlags: response.qc_flags,
      });
      saved.push(batch);
    }

    return NextResponse.json({ data: { batches: saved }, requestId }, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/batches/csv", userId: session?.user?.id, requestId });
  }
}
