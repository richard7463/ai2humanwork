import { type FallbackOrder } from "./store";
import { signRequestPayload } from "./requestSignature.js";

type CallbackResult = {
  attempted: boolean;
  ok?: boolean;
  code?: number;
  message?: string;
};

export async function sendFallbackCallback(order: FallbackOrder): Promise<CallbackResult> {
  if (!order.callbackUrl) {
    return { attempted: false };
  }

  const payload = {
    event: "fallback_order.completed",
    orderId: order.id,
    serviceId: order.serviceId,
    status: order.status,
    humanId: order.humanId,
    humanName: order.humanName,
    location: order.location,
    deadline: order.deadline,
    budget: order.budget,
    evidence: order.evidence,
    updatedAt: order.updatedAt
  };

  const rawBody = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signingSecret = process.env.FALLBACK_CALLBACK_SIGNING_SECRET || "";
  const signature = signingSecret
    ? signRequestPayload({ secret: signingSecret, timestamp, rawBody })
    : "";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-ai2h-event": "fallback_order.completed",
      "x-ai2h-timestamp": timestamp
    };
    if (signature) {
      headers["x-ai2h-signature"] = signature;
    }

    const response = await fetch(order.callbackUrl, {
      method: "POST",
      headers,
      body: rawBody
    });

    return {
      attempted: true,
      ok: response.ok,
      code: response.status,
      message: response.ok
        ? signature
          ? "Signed callback sent."
          : "Unsigned callback sent (no secret configured)."
        : "Callback returned non-2xx status."
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      code: 0,
      message: error instanceof Error ? error.message : "Callback request failed"
    };
  }
}
