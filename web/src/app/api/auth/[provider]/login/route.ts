import { NextResponse } from "next/server";
import { env } from "@/env";

export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  const provider = params.provider;
  if (provider !== "google" && provider !== "github") {
    return new Response("Unsupported provider", { status: 404 });
  }

  const backendUrl = env.BACKEND_URL;
  return NextResponse.redirect(`${backendUrl}/api/auth/${provider}/login`);
}
