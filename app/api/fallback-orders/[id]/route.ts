import { NextResponse } from "next/server";
import { readDb } from "../../../lib/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const db = await readDb();
  const order = db.fallbackOrders.find((item) => item.id === params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const service = db.services.find((item) => item.id === order.serviceId) || null;
  const provider = db.humans.find((human) => human.id === order.providerId) || null;
  return NextResponse.json({ order, service, provider });
}

