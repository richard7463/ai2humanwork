import { NextResponse } from "next/server";
import { updateDb } from "../../../../lib/store";
import { checkAdminAuth } from "../../../../lib/adminAuth";
import { canTransition, explainInvalidTransition } from "../../../../lib/taskStateMachine";
import { appendTransitionEvidence } from "../../../../lib/taskEvidence";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = checkAdminAuth(_request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let updated: unknown = null;
  let transitionError = "";

  await updateDb((db) => {
    const task = db.tasks.find((item) => item.id === params.id);
    if (!task) {
      return;
    }

    if (!canTransition(task.status, "paid")) {
      transitionError = explainInvalidTransition(task.status, "paid");
      return;
    }

    const previousStatus = task.status;
    task.status = "paid";
    task.updatedAt = new Date().toISOString();
    appendTransitionEvidence(task, {
      by: "system",
      from: previousStatus,
      to: "paid",
      action: "Payment settled (mock)"
    });
    const amount = task.budget?.trim() || "TBD";
    const receiver =
      task.assignee?.name || (previousStatus === "verified" ? "Verified Executor" : "Unknown");
    db.payments.unshift({
      id: crypto.randomUUID(),
      taskId: task.id,
      amount,
      receiver,
      method: "mock_x402",
      status: "paid",
      createdAt: task.updatedAt
    });
    updated = task;
  });

  if (transitionError) {
    return NextResponse.json({ error: transitionError }, { status: 400 });
  }

  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
