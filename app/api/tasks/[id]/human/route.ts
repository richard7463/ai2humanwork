import { NextResponse } from "next/server";
import { updateDb } from "../../../../lib/store";
import { checkAdminAuth } from "../../../../lib/adminAuth";
import { canTransition, explainInvalidTransition } from "../../../../lib/taskStateMachine";
import { appendTransitionEvidence } from "../../../../lib/taskEvidence";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = checkAdminAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const name = String(body.name || "Human").trim() || "Human";

  let updated: unknown = null;
  let transitionError = "";

  await updateDb((db) => {
    const task = db.tasks.find((item) => item.id === params.id);
    if (!task) {
      return;
    }

    if (!canTransition(task.status, "human_assigned")) {
      transitionError = explainInvalidTransition(task.status, "human_assigned");
      return;
    }

    const previousStatus = task.status;
    task.assignee = { type: "human", name };
    task.status = "human_assigned";
    task.updatedAt = new Date().toISOString();
    appendTransitionEvidence(task, {
      by: "system",
      from: previousStatus,
      to: "human_assigned",
      action: `Human assigned (${name})`
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
