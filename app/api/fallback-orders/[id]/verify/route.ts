import { NextResponse } from "next/server";
import { updateDb } from "../../../../lib/store";
import { checkAdminAuth } from "../../../../lib/adminAuth";
import {
  canTransitionFallback,
  explainInvalidFallbackTransition
} from "../../../../lib/fallbackOrderState";
import { appendEvidence } from "../../../../lib/taskEvidence";
import { verifyRequestSignature } from "../../../../lib/requestSignature.js";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const rawBody = await request.text();
  let body: Record<string, unknown> = {};
  if (rawBody) {
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
  }

  const adminAuth = checkAdminAuth(request);
  const verifySecret = process.env.AGENT_VERIFY_SECRET || process.env.FALLBACK_CALLBACK_SIGNING_SECRET || "";
  const signedAuth = verifyRequestSignature({
    secret: verifySecret,
    rawBody,
    headers: request.headers,
    maxAgeSeconds: 600
  });

  const actor = adminAuth.ok ? "admin" : signedAuth.ok ? "agent" : "";
  if (!actor) {
    const message = signedAuth.error || adminAuth.error || "Unauthorized.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const note = String(body.note || "Agent verified completion").trim();

  let updated = null;
  let transitionError = "";

  await updateDb((db) => {
    const order = db.fallbackOrders.find((item) => item.id === params.id);
    if (!order) return;

    if (!canTransitionFallback(order.status, "verified")) {
      transitionError = explainInvalidFallbackTransition(order.status, "verified");
      return;
    }

    order.status = "verified";
    order.updatedAt = new Date().toISOString();
    appendEvidence(order, {
      by: "system",
      type: "log",
      content: `${note || "Agent verified completion"} (${actor})`
    });
    updated = order;
  });

  if (transitionError) {
    return NextResponse.json({ error: transitionError }, { status: 400 });
  }

  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
