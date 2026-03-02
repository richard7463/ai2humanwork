import { NextResponse } from "next/server";
import { readDb, updateDb } from "../../../../lib/store";
import {
  canTransitionFallback,
  explainInvalidFallbackTransition
} from "../../../../lib/fallbackOrderState";
import { appendEvidence } from "../../../../lib/taskEvidence";
import { sendFallbackCallback } from "../../../../lib/fallbackCallback";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const note = String(body.note || "Delivered").trim();
  const proofUrls = Array.isArray(body.proofUrls)
    ? body.proofUrls.map((item: unknown) => String(item)).filter(Boolean)
    : [];

  let updated = null;
  let transitionError = "";

  await updateDb((db) => {
    const order = db.fallbackOrders.find((item) => item.id === params.id);
    if (!order) return;

    if (!canTransitionFallback(order.status, "delivered")) {
      transitionError = explainInvalidFallbackTransition(order.status, "delivered");
      return;
    }

    order.status = "delivered";
    order.updatedAt = new Date().toISOString();
    appendEvidence(order, {
      by: "human",
      type: "note",
      content: note || "Delivered"
    });
    for (const url of proofUrls) {
      appendEvidence(order, {
        by: "human",
        type: "photo",
        content: url
      });
    }
    updated = order;
  });

  if (transitionError) {
    return NextResponse.json({ error: transitionError }, { status: 400 });
  }

  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const latestDb = await readDb();
  const latest = latestDb.fallbackOrders.find((item) => item.id === params.id);
  const callbackResult = latest ? await sendFallbackCallback(latest) : { attempted: false };

  await updateDb((db) => {
    const order = db.fallbackOrders.find((item) => item.id === params.id);
    if (!order || !callbackResult.attempted) return;

    const nextStatus = callbackResult.ok ? "callback_sent" : "callback_failed";
    if (canTransitionFallback(order.status, nextStatus)) {
      order.status = nextStatus;
    }
    order.updatedAt = new Date().toISOString();
    order.callback = {
      attemptedAt: order.updatedAt,
      status: callbackResult.ok ? "sent" : "failed",
      code: callbackResult.code,
      message: callbackResult.ok ? "Callback sent." : callbackResult.message || "Callback failed."
    };
    appendEvidence(order, {
      by: "system",
      type: "log",
      content: callbackResult.ok
        ? `Callback sent (${callbackResult.code})`
        : `Callback failed (${callbackResult.code}): ${callbackResult.message || "unknown error"}`
    });
    updated = order;
  });

  return NextResponse.json(updated);
}
