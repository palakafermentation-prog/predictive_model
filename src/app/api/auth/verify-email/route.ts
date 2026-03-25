import { NextResponse } from "next/server";
import { verifyEmail } from "@/services/backend/auth.service";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") ?? "";

    const result = await verifyEmail(token);

    return NextResponse.json({ data: result, requestId });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/auth/verify-email", requestId });
  }
}
