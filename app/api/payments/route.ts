import { NextResponse } from "next/server";
import { readDb } from "../../lib/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") || 20);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 20;

  const db = await readDb();
  return NextResponse.json(db.payments.slice(0, limit));
}

