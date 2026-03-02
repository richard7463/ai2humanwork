import { NextResponse } from "next/server";
import crypto from "crypto";
import { updateDb, type PaymentEntry } from "../../../../lib/store";
import { checkAdminAuth } from "../../../../lib/adminAuth";
import {
  canTransitionFallback,
  explainInvalidFallbackTransition
} from "../../../../lib/fallbackOrderState";
import { appendEvidence } from "../../../../lib/taskEvidence";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = checkAdminAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const idempotencyHeader = request.headers.get("idempotency-key");
  const idempotencyKey =
    String(idempotencyHeader || "").trim() || `fallback-settle:${params.id}`;

  let updated: unknown = null;
  let payment: unknown = null;
  let transitionError = "";
  let conflictError = "";
  let idempotentReplay = false;

  await updateDb((db) => {
    const order = db.fallbackOrders.find((item) => item.id === params.id);
    if (!order) return;

    const existingByKey = db.payments.find(
      (entry) =>
        entry.fallbackOrderId === order.id &&
        entry.source === "fallback_order" &&
        entry.idempotencyKey === idempotencyKey
    );
    if (existingByKey) {
      idempotentReplay = true;
      updated = order;
      payment = existingByKey;
      return;
    }

    if (order.status === "paid") {
      const existingPayment = db.payments.find(
        (entry) => entry.fallbackOrderId === order.id && entry.source === "fallback_order"
      );
      conflictError =
        existingPayment?.idempotencyKey
          ? "Order is already settled with a different idempotency key."
          : "Order is already settled.";
      return;
    }

    if (!canTransitionFallback(order.status, "paid")) {
      transitionError = explainInvalidFallbackTransition(order.status, "paid");
      return;
    }

    order.status = "paid";
    order.updatedAt = new Date().toISOString();

    appendEvidence(order, {
      by: "system",
      type: "log",
      content: "Payment settled (mock_x402)."
    });

    const nextPayment: PaymentEntry = {
      id: crypto.randomUUID(),
      taskId: order.id,
      fallbackOrderId: order.id,
      idempotencyKey,
      amount: order.budget,
      receiver: order.humanName || "Human Operator",
      method: "mock_x402",
      status: "paid",
      source: "fallback_order",
      createdAt: order.updatedAt
    };
    db.payments.unshift(nextPayment);

    updated = order;
    payment = nextPayment;
  });

  if (conflictError) {
    return NextResponse.json({ error: conflictError }, { status: 409 });
  }

  if (transitionError) {
    return NextResponse.json({ error: transitionError }, { status: 400 });
  }

  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: updated,
    payment,
    idempotentReplay
  });
}
