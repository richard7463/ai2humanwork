import test from "node:test";
import assert from "node:assert/strict";
import { signRequestPayload, verifyRequestSignature } from "./requestSignature.js";

const SECRET = "test_secret";

function headersFrom(values) {
  return {
    get(name) {
      return values[name.toLowerCase()] || null;
    }
  };
}

test("verifies valid signature", () => {
  const rawBody = JSON.stringify({ hello: "world" });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signRequestPayload({ secret: SECRET, timestamp, rawBody });

  const result = verifyRequestSignature({
    secret: SECRET,
    rawBody,
    headers: headersFrom({
      "x-ai2h-signature": signature,
      "x-ai2h-timestamp": timestamp
    })
  });

  assert.equal(result.ok, true);
});

test("rejects invalid signature", () => {
  const rawBody = JSON.stringify({ hello: "world" });
  const timestamp = String(Math.floor(Date.now() / 1000));

  const result = verifyRequestSignature({
    secret: SECRET,
    rawBody,
    headers: headersFrom({
      "x-ai2h-signature": "v1=bad",
      "x-ai2h-timestamp": timestamp
    })
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.includes("Invalid signature"), true);
});

test("rejects expired timestamp", () => {
  const rawBody = JSON.stringify({ hello: "world" });
  const timestamp = String(Math.floor(Date.now() / 1000) - 1000);
  const signature = signRequestPayload({ secret: SECRET, timestamp, rawBody });

  const result = verifyRequestSignature({
    secret: SECRET,
    rawBody,
    headers: headersFrom({
      "x-ai2h-signature": signature,
      "x-ai2h-timestamp": timestamp
    }),
    maxAgeSeconds: 60
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Signature expired.");
});
