import { NextResponse } from "next/server";
import { updateDb } from "../../../../lib/store";
import { canTransition, explainInvalidTransition } from "../../../../lib/taskStateMachine";
import { appendEvidence, appendTransitionEvidence } from "../../../../lib/taskEvidence";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const note = String(body.note || "Evidence submitted").trim();
  const url = String(body.url || "").trim();
  const by = body.by === "human" ? "human" : "system";
  const type = body.type === "photo" ? "photo" : "note";

  let updated: unknown = null;
  let transitionError = "";

  await updateDb((db) => {
    const task = db.tasks.find((item) => item.id === params.id);
    if (!task) {
      return;
    }

    appendEvidence(task, {
      by,
      type,
      content: type === "photo" ? url || "Photo evidence" : note || "Evidence submitted"
    });

    if (task.status === "human_assigned") {
      if (!canTransition(task.status, "human_done")) {
        transitionError = explainInvalidTransition(task.status, "human_done");
        return;
      }
      const previousStatus = task.status;
      task.status = "human_done";
      appendTransitionEvidence(task, {
        by: "system",
        from: previousStatus,
        to: "human_done",
        action: "Human evidence accepted"
      });
    }

    task.updatedAt = new Date().toISOString();
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
