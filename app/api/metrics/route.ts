import { NextResponse } from "next/server";
import { readDb } from "../../lib/store";
import { computeTaskMetrics } from "../../lib/metrics";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(computeTaskMetrics(db.tasks));
}

