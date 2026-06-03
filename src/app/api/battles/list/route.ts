import { NextResponse } from "next/server";
import {
  backendFetch,
  type Battle,
  type SubmitPromptRequest,
} from "@/lib/backend";

export const dynamic = "force-dynamic";

interface ListBattlesResponse {
  battles: Battle[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const queryString = status ? `?status=${encodeURIComponent(status)}` : "";
    const result = await backendFetch<ListBattlesResponse>(
      `/battles/list${queryString}`,
    );

    return NextResponse.json({ battles: result.battles });
  } catch (error) {
    console.error("Battle list error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  // Submit prompt — kept here to match the existing route file structure
  try {
    const body = (await request.json()) as SubmitPromptRequest;
    const result = await backendFetch<{ status: string; battle?: Battle }>(
      "/battles/submit",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Battle submit error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
