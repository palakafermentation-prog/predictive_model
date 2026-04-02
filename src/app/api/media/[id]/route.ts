import { NextResponse } from "next/server";
import { getSession } from "@/services/backend/auth.service";
import { getFileBuffer, deleteMediaFile } from "@/services/backend/media.service";
import { handleApiError } from "@/lib/api-error";
import { MEDIA_CACHE_MAX_AGE_SECONDS } from "@/lib/env";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const forceDownload = url.searchParams.get("download") === "true";

    const result = await getFileBuffer(id);
    if (!result) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const headers: HeadersInit = {
      "Content-Type": result.mimeType,
      "Cache-Control": `public, max-age=${MEDIA_CACHE_MAX_AGE_SECONDS}, immutable`,
    };

    if (forceDownload && result.originalFilename) {
      // Sanitize filename: strip control chars and quotes to prevent header injection
      const safeName = result.originalFilename
        .replace(/["\\\r\n]/g, "")
        .replace(/[^\x20-\x7E]/g, "_");
      headers["Content-Disposition"] = `attachment; filename="${safeName}"`;
    }

    return new NextResponse(new Uint8Array(result.buffer), { headers });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/media/[id]", requestId });
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
    await deleteMediaFile(id, session.user.id);

    return NextResponse.json({ data: { success: true }, requestId });
  } catch (error) {
    return handleApiError(error, { route: "DELETE /api/media/[id]", userId: session?.user?.id, requestId });
  }
}
