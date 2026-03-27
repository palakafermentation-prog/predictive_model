import { NextResponse } from "next/server";
import { getSession } from "@/services/backend/auth.service";
import { processCsvUpload } from "@/services/backend/batch.service";
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
    const result = await processCsvUpload(session.user, rows);

    return NextResponse.json({
      data: { batches: result.saved, errors: result.errors },
      requestId,
    }, { status: result.errors.length > 0 ? 207 : 201 });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/batches/csv", userId: session?.user?.id, requestId });
  }
}
