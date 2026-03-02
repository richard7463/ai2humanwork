import crypto from "crypto";

function hmacDigest(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function signRequestPayload({ secret, timestamp, rawBody }) {
  const payload = `${timestamp}.${rawBody}`;
  return `v1=${hmacDigest(secret, payload)}`;
}

function parseTimestamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.floor(number);
}

export function verifyRequestSignature({
  secret,
  rawBody,
  headers,
  maxAgeSeconds = 300,
  signatureHeader = "x-ai2h-signature",
  timestampHeader = "x-ai2h-timestamp"
}) {
  if (!secret) {
    return { ok: false, error: "Signing secret not configured." };
  }

  const signature = (headers.get(signatureHeader) || "").trim();
  const timestampRaw = (headers.get(timestampHeader) || "").trim();

  if (!signature || !timestampRaw) {
    return { ok: false, error: "Missing signature headers." };
  }

  const timestamp = parseTimestamp(timestampRaw);
  if (!timestamp) {
    return { ok: false, error: "Invalid signature timestamp." };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > maxAgeSeconds) {
    return { ok: false, error: "Signature expired." };
  }

  const expected = signRequestPayload({ secret, timestamp: String(timestamp), rawBody });

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) {
    return { ok: false, error: "Invalid signature." };
  }

  const valid = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  if (!valid) {
    return { ok: false, error: "Invalid signature." };
  }

  return { ok: true, error: "" };
}
