import { NextResponse } from "next/server";
import { predict } from "@/services/backend/prediction.service";
import { handleApiError } from "@/lib/api-error";
import { PredictionRequestSchema } from "@pferm/shared-schemas";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const input = PredictionRequestSchema.parse(body);
    const result = await predict(input);

    return NextResponse.json({ data: result, requestId });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/predictions", requestId });
  }
}
