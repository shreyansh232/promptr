import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const data = await backendFetch("/agent-missions/completed", {
      method: "POST",
      body,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backend service is unavailable";
    const status = error instanceof BackendError ? error.status : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(_request: Request) {
  try {
    const data = await backendFetch("/agent-missions/completed", {
      method: "GET",
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backend service is unavailable";
    const status = error instanceof BackendError ? error.status : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
