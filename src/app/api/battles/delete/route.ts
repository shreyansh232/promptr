import { NextResponse } from "next/server";
import { auth } from "auth";

/**
 * Delete a battle. The FastAPI backend does not currently expose a
 * dedicated delete endpoint. Returns 501 so the frontend can detect
 * the missing feature and surface a friendly message.
 */
export async function DELETE(_request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "Delete is not yet supported by the backend",
      },
      { status: 501 },
    );
  } catch (error) {
    console.error("Battle delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
