import { NextResponse } from "next/server";
import { readDb } from "../../../lib/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const db = await readDb();
  const task = db.tasks.find((item) => item.id === params.id);
  const payment =
    db.payments.find((item) => item.taskId === params.id && item.source === "task") ||
    db.payments.find((item) => item.taskId === params.id && item.source !== "x402_access") ||
    null;

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task, payment });
}
