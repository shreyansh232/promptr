import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { submissionId, reason } = await request.json();

    if (!submissionId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const report = await db.aiEvaluationReport.create({
      data: {
        userId: user.id,
        submissionId: submissionId,
        reason: reason,
      },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
