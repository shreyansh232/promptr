import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/backend";

export async function GET() {
  try {
    const data = await backendFetch<{ customScenarios: unknown[] }>(
      "/custom-scenarios",
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backend service is unavailable";
    const status = error instanceof BackendError ? error.status : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const data = await backendFetch<{ customScenario: unknown }>(
      "/custom-scenarios",
      {
        method: "POST",
        body,
      },
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backend service is unavailable";
    const status = error instanceof BackendError ? error.status : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing scenario ID" },
        { status: 400 },
      );
    }
    const data = await backendFetch<{ success: boolean }>(
      `/custom-scenarios?id=${id}`,
      {
        method: "DELETE",
      },
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backend service is unavailable";
    const status = error instanceof BackendError ? error.status : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
