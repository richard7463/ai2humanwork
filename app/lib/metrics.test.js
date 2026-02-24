import test from "node:test";
import assert from "node:assert/strict";
import { computeTaskMetrics } from "./metrics.js";

test("computes task metrics and fail rate", () => {
  const tasks = [
    { status: "created" },
    { status: "ai_running" },
    { status: "ai_failed" },
    { status: "human_done" },
    { status: "verified" },
    { status: "paid" }
  ];

  const metrics = computeTaskMetrics(tasks);
  assert.equal(metrics.total, 6);
  assert.equal(metrics.created, 1);
  assert.equal(metrics.inProgress, 3);
  assert.equal(metrics.verified, 1);
  assert.equal(metrics.paid, 1);
  assert.equal(metrics.failed, 1);
  assert.equal(metrics.failRate, 16.7);
});

