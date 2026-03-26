import { NextResponse } from "next/server";
import { getSession } from "@/services/backend/auth.service";
import { getBatch, deleteBatch } from "@/services/backend/batch.service";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const batch = await getBatch(session.user, id);
    return NextResponse.json({ data: { batch }, requestId });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/batches/[id]", userId: session?.user?.id, requestId });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await deleteBatch(session.user, id);
    return NextResponse.json({ data: { success: true }, requestId });
  } catch (error) {
    return handleApiError(error, { route: "DELETE /api/batches/[id]", userId: session?.user?.id, requestId });
  }
}
