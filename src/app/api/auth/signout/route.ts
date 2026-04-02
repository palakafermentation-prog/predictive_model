import { NextResponse } from "next/server";
import { signout } from "@/services/backend/auth.service";
import { handleApiError } from "@/lib/api-error";
import { IS_PRODUCTION } from "@/lib/env";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    await signout(request);

    const response = NextResponse.json({ data: { success: true }, requestId });
    response.cookies.set("pferm-auth.session_token", "", {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error, { route: "POST /api/auth/signout", requestId });
  }
}
