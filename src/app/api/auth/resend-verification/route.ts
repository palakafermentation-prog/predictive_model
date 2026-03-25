import { NextResponse } from "next/server";
import { resendVerification } from "@/services/backend/auth.service";
import { handleApiError } from "@/lib/api-error";
import { ResendVerificationSchema } from "@pferm/shared-schemas";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const { email } = ResendVerificationSchema.parse(body);

    const result = await resendVerification(email);

    return NextResponse.json({ data: result, requestId });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/auth/resend-verification", requestId });
  }
}
