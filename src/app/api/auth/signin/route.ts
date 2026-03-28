import { NextResponse } from "next/server";
import { signin } from "@/services/backend/auth.service";
import { handleApiError } from "@/lib/api-error";
import { SigninFormSchema } from "@pferm/shared-schemas";
import { IS_PRODUCTION } from "@/lib/env";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const { email, password } = SigninFormSchema.parse(body);

    const result = await signin(email, password);

    const response = NextResponse.json({ data: { user: result.user }, requestId });
    response.cookies.set("pferm-auth.session_token", result.token!, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error, { route: "POST /api/auth/signin", requestId });
  }
}
