import { NextResponse } from "next/server";
import { forgotPassword } from "@/services/backend/auth.service";
import { handleApiError } from "@/lib/api-error";
import { ForgotPasswordFormSchema } from "@pferm/shared-schemas";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const validated = ForgotPasswordFormSchema.parse(body);
    const { email } = validated;

    const result = await forgotPassword(email);

    return NextResponse.json({
      data: { message: result.message, emailFailed: result.emailFailed },
      requestId,
    });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/auth/forgot-password", requestId });
  }
}
