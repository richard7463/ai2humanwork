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
  _request: Request,
  { params }: { params: { id: string } }
) {
  const db = await readDb();
  const order = db.fallbackOrders.find((item) => item.id === params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "delivered" && order.status !== "callback_failed") {
    return NextResponse.json(
      { error: "Only delivered/callback_failed orders can retry callback." },
      { status: 400 }
    );
  }

  const callbackResult = await sendFallbackCallback(order);
  if (!callbackResult.attempted) {
    return NextResponse.json({ error: "No callback URL configured." }, { status: 400 });
  }

  let updated = null;
  let transitionError = "";

  await updateDb((nextDb) => {
    const current = nextDb.fallbackOrders.find((item) => item.id === params.id);
    if (!current) return;

    const nextStatus = callbackResult.ok ? "callback_sent" : "callback_failed";
    if (current.status !== nextStatus && !canTransitionFallback(current.status, nextStatus)) {
      transitionError = explainInvalidFallbackTransition(current.status, nextStatus);
      return;
    }

    current.status = nextStatus;
    current.updatedAt = new Date().toISOString();
    current.callback = {
      attemptedAt: current.updatedAt,
      status: callbackResult.ok ? "sent" : "failed",
      code: callbackResult.code,
      message: callbackResult.message
    };
    appendEvidence(current, {
      by: "system",
      type: "log",
      content: callbackResult.ok
        ? `Callback retry sent (${callbackResult.code})`
        : `Callback retry failed (${callbackResult.code}): ${callbackResult.message || "unknown error"}`
    });
    updated = current;
  });

  if (transitionError) {
    return NextResponse.json({ error: transitionError }, { status: 400 });
  }

  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
