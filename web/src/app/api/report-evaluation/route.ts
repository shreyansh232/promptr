import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backendFetch } from "@/lib/backend";

/**
 * Forward an AI evaluation report to the FastAPI backend.
 * The backend persists the report and exposes it for moderation tooling.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      submissionId?: string;
      reason?: string;
    };

    if (!body.submissionId || !body.reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await backendFetch<{ reportId: string }>(
      "/reports/evaluation",
      {
        method: "POST",
        body: JSON.stringify({
          userId: session.user.id,
          submissionId: body.submissionId,
          reason: body.reason,
        }),
      },
    );

    return NextResponse.json({ success: true, reportId: result.reportId });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
