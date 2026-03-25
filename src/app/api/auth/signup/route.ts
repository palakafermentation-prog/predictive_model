import { NextResponse } from "next/server";
import { signup } from "@/services/backend/auth.service";
import { handleApiError } from "@/lib/api-error";
import { SignupFormSchema } from "@pferm/shared-schemas";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = SignupFormSchema.parse(body);

    const result = await signup(email, password, firstName, lastName);

    return NextResponse.json({ data: result, requestId }, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/auth/signup", requestId });
  }
}
