import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionFallback,
  explainInvalidFallbackTransition
} from "./fallbackOrderState.js";

test("allows expected fallback transitions", () => {
  assert.equal(canTransitionFallback("created", "accepted"), true);
  assert.equal(canTransitionFallback("accepted", "in_progress"), true);
  assert.equal(canTransitionFallback("in_progress", "delivered"), true);
  assert.equal(canTransitionFallback("delivered", "callback_sent"), true);
  assert.equal(canTransitionFallback("delivered", "verified"), true);
  assert.equal(canTransitionFallback("callback_sent", "verified"), true);
  assert.equal(canTransitionFallback("verified", "paid"), true);
});

test("blocks invalid fallback transitions", () => {
  assert.equal(canTransitionFallback("created", "delivered"), false);
  assert.equal(canTransitionFallback("callback_sent", "accepted"), false);
  assert.equal(canTransitionFallback("paid", "verified"), false);
});

test("includes allowed states in invalid fallback transition message", () => {
  const message = explainInvalidFallbackTransition("created", "delivered");
  assert.equal(message.includes("created -> delivered"), true);
  assert.equal(message.includes("accepted"), true);
});
