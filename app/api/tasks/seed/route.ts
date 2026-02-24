import { NextResponse } from "next/server";
import { makeSeedTasks, readDb, updateDb } from "../../../lib/store";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const countRaw = Number(body.count ?? 60);
  const count = Number.isFinite(countRaw) ? Math.max(1, Math.min(120, countRaw)) : 60;
  const mode = String(body.mode || "").trim();

  const before = await readDb();
  const next = makeSeedTasks(count).map((task) => {
    if (mode !== "created_only") return task;
    const now = new Date().toISOString();
    return {
      ...task,
      status: "created" as const,
      assignee: undefined,
      updatedAt: now,
      evidence: [
        {
          id: crypto.randomUUID(),
          by: "system" as const,
          type: "log" as const,
          content: "Task seeded: none -> created",
          createdAt: now
        }
      ]
    };
  });

  await updateDb((db) => {
    // Put seeded tasks at the top so you immediately see a full feed.
    db.tasks = [...next, ...db.tasks].slice(0, 240);
  });

  const after = await readDb();
  return NextResponse.json({
    ok: true,
    before: before.tasks.length,
    added: count,
    after: after.tasks.length
  });
}
