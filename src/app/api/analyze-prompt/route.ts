import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(request: Request) {
  try {
    const response = await fetch(`${env.BACKEND_URL}/analyze-prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: await request.text(),
      cache: "no-store",
    });

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Backend service is unavailable" },
      { status: 502 },
    );
  }
}
