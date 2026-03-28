import { NextResponse } from "next/server";
import { resetPassword } from "@/services/backend/auth.service";
import { handleApiError } from "@/lib/api-error";
import { ResetPasswordFormSchema } from "@pferm/shared-schemas";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const { token, password } = ResetPasswordFormSchema.parse(body);

    const result = await resetPassword(token, password);

    return NextResponse.json({ data: result, requestId });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/auth/reset-password", requestId });
  }
}
