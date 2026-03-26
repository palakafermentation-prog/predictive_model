import { NextResponse } from "next/server";
import { getSession } from "@/services/backend/auth.service";
import { getBatches, saveBatch } from "@/services/backend/batch.service";
import { handleApiError } from "@/lib/api-error";
import { BatchSaveRequestSchema } from "@pferm/shared-schemas";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("perPage") ?? "50", 10);

    const result = await getBatches(session.user, { page, perPage });
    return NextResponse.json({ data: result, requestId });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/batches", userId: session?.user?.id, requestId });
  }
}

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
    const data = BatchSaveRequestSchema.parse(body);
    const batch = await saveBatch(session.user, data);

    return NextResponse.json({ data: { batch }, requestId }, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/batches", userId: session?.user?.id, requestId });
  }
}
