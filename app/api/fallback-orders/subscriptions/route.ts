import { NextResponse } from "next/server";
import { readDb, updateDb } from "../../../lib/store";
import crypto from "crypto";

export const runtime = "nodejs";

function normalizeList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET() {
  const db = await readDb();
  const rows = db.fallbackSubscriptions
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return NextResponse.json({ total: rows.length, rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const skills = normalizeList(body.skills);
  const cities = normalizeList(body.cities);

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const result = await updateDb((db) => {
    const existing = db.fallbackSubscriptions.find((item) => item.email === email);
    if (existing) {
      existing.active = true;
      existing.skills = skills;
      existing.cities = cities;
      return existing;
    }

    const row = {
      id: crypto.randomUUID(),
      email,
      skills,
      cities,
      active: true,
      createdAt: new Date().toISOString()
    };

    db.fallbackSubscriptions.unshift(row);
    return row;
  });

  return NextResponse.json(result, { status: 201 });
}
