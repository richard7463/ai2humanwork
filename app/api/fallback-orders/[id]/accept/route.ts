import { NextResponse } from "next/server";
import { updateDb } from "../../../../lib/store";
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
  const body = await request.json().catch(() => ({}));
  const humanId = String(body.humanId || "").trim();
  const humanName = String(body.humanName || "").trim();

  let updated = null;
  let transitionError = "";

  await updateDb((db) => {
    const order = db.fallbackOrders.find((item) => item.id === params.id);
    if (!order) return;

    if (!canTransitionFallback(order.status, "accepted")) {
      transitionError = explainInvalidFallbackTransition(order.status, "accepted");
      return;
    }

    let resolvedHumanId = humanId;
    let resolvedHumanName = humanName;
    if (humanId) {
      const found = db.humans.find((human) => human.id === humanId);
      if (found) {
        resolvedHumanId = found.id;
        resolvedHumanName = found.name;
      }
    }

    order.status = "accepted";
    order.humanId = resolvedHumanId || undefined;
    order.humanName = resolvedHumanName || "Human Operator";
    order.updatedAt = new Date().toISOString();
    appendEvidence(order, {
      by: "human",
      type: "log",
      content: `Order accepted by ${order.humanName}`
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

