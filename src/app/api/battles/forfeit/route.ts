import { NextResponse } from "next/server";
import { auth } from "auth";

/**
 * Forfeit a battle. The FastAPI backend does not currently expose a
 * dedicated forfeit endpoint — battle termination is handled in-band
 * by the submit endpoint. This stub returns 501 so the frontend can
 * detect the missing feature and surface a friendly message.
 */
export async function POST(_request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "Forfeit is not yet supported by the backend",
      },
      { status: 501 },
    );
  } catch (error) {
    console.error("Battle forfeit error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
