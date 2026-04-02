import { NextResponse } from "next/server";
import { getSession } from "@/services/backend/auth.service";
import { updateProfile } from "@/services/backend/profile.service";
import { handleApiError } from "@/lib/api-error";
import { ProfileUpdateSchema } from "@pferm/shared-schemas";

export async function PATCH(request: Request) {
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
    const data = ProfileUpdateSchema.parse(body);
    const user = await updateProfile(session.user, data);

    return NextResponse.json({ data: { user }, requestId });
  } catch (error) {
    return handleApiError(error, { route: "PATCH /api/profile", userId: session?.user?.id, requestId });
  }
}
