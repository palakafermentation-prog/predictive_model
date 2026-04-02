import { NextResponse } from "next/server"

export async function GET() {
  const requestId = crypto.randomUUID();
  return NextResponse.json({ data: { status: "ok" }, requestId })
}
