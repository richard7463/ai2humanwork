import test from "node:test";
import assert from "node:assert/strict";
import { appendEvidence, appendTransitionEvidence } from "./taskEvidence.js";

function makeTask() {
  return {
    evidence: []
  };
}

test("appendEvidence writes actor, content and timestamp", () => {
  const task = makeTask();
  appendEvidence(task, {
    by: "system",
    type: "note",
    content: "Task created",
    createdAt: "2026-02-24T00:00:00.000Z"
  });

  assert.equal(task.evidence.length, 1);
  assert.equal(task.evidence[0].by, "system");
  assert.equal(task.evidence[0].content, "Task created");
  assert.equal(task.evidence[0].createdAt, "2026-02-24T00:00:00.000Z");
});

test("appendTransitionEvidence writes structured transition log", () => {
  const task = makeTask();
  appendTransitionEvidence(task, {
    by: "ai",
    from: "created",
    to: "ai_failed",
    action: "AI execution failed"
  });

  assert.equal(task.evidence.length, 1);
  assert.equal(task.evidence[0].type, "log");
  assert.equal(task.evidence[0].content, "AI execution failed: created -> ai_failed");
  assert.ok(task.evidence[0].createdAt);
});

