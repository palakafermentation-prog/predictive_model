import { NextResponse } from "next/server";
import { getSession } from "@/services/backend/auth.service";
import { handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No active session" }, requestId },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: { user: session.user, expiresAt: session.expiresAt },
      requestId,
    });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/auth/session", userId: session?.user?.id, requestId });
  }
}
