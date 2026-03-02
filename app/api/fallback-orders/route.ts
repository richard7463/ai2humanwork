import { NextResponse } from "next/server";
import { readDb, updateDb, type FallbackOrder } from "../../lib/store";
import { appendEvidence } from "../../lib/taskEvidence";
import crypto from "crypto";
import { notifyFallbackSubscribers } from "../../lib/fallbackNotifications";
import { sendFallbackAlertEmails } from "../../lib/fallbackEmail";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const db = await readDb();
  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") || "").trim();
  const limitRaw = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 50;

  let rows = [...db.fallbackOrders].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
  );
  if (status) {
    rows = rows.filter((item) => item.status === status);
  }
  rows = rows.slice(0, limit);

  return NextResponse.json({ total: rows.length, rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const serviceId = String(body.serviceId || "").trim();
  const agentName = String(body.agentName || "AI Agent").trim();
  const location = String(body.location || "").trim();
  const deadline = String(body.deadline || "").trim();
  const budget = String(body.budget || "").trim();
  const callbackUrl = String(body.callbackUrl || "").trim();
  const proofRequirementsRaw = body.proofRequirements;
  const proofRequirements = Array.isArray(proofRequirementsRaw)
    ? proofRequirementsRaw.map((item) => String(item)).filter(Boolean)
    : [];

  if (!serviceId || !location || !deadline || !budget) {
    return NextResponse.json(
      { error: "serviceId, location, deadline and budget are required." },
      { status: 400 }
    );
  }

  let created: FallbackOrder | null = null;
  let serviceSummary = "";
  await updateDb((db) => {
    const service = db.services.find((item) => item.id === serviceId);
    if (!service) return;
    const provider = db.humans.find((human) => human.id === service.providerId);
    if (!provider) return;
    serviceSummary = `${service.title} ${service.shortDescription} ${service.category}`;

    const now = new Date().toISOString();
    const order = {
      id: crypto.randomUUID(),
      serviceId: service.id,
      providerId: provider.id,
      agentName,
      location,
      deadline,
      budget,
      callbackUrl: callbackUrl || undefined,
      proofRequirements,
      status: "created" as const,
      createdAt: now,
      updatedAt: now,
      evidence: []
    };
    appendEvidence(order, {
      by: "system",
      type: "log",
      content: `Fallback order created by ${agentName}`
    });
    db.fallbackOrders.unshift(order);
    created = order;
  });

  if (!created) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }
  const createdOrder = created as FallbackOrder;

  const notification = await notifyFallbackSubscribers(
    {
      id: createdOrder.id,
      location: createdOrder.location,
      proofRequirements: createdOrder.proofRequirements
    },
    serviceSummary
  );

  const emailResult = await sendFallbackAlertEmails({
    emails: notification.emails,
    orderId: createdOrder.id,
    serviceSummary,
    location: createdOrder.location,
    budget: createdOrder.budget,
    deadline: createdOrder.deadline
  });

  const refreshed = await updateDb((db) => {
    const order = db.fallbackOrders.find((item) => item.id === createdOrder.id);
    if (order) {
      appendEvidence(order, {
        by: "system",
        type: "log",
        content: emailResult.attempted
          ? `Email notifications sent: ${emailResult.sent} success / ${emailResult.failed} failed.`
          : `Email notifications queued in ${emailResult.provider} mode (${notification.matched} recipients).`
      });
    }
    return order || createdOrder;
  });

  return NextResponse.json(
    {
      order: refreshed,
      notifications: {
        ...notification,
        email: emailResult
      }
    },
    { status: 201 }
  );
}
