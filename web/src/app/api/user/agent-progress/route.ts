import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const data = await backendFetch("/agent-missions/completed", {
      method: "POST",
      body,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Backend service is unavailable" },
      { status: error.status || 502 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const data = await backendFetch("/agent-missions/completed", {
      method: "GET",
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Backend service is unavailable" },
      { status: error.status || 502 },
    );
  }
}
