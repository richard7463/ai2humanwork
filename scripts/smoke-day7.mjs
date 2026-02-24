import { execFileSync } from "node:child_process";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3001";
const ADMIN_TOKEN = process.env.SMOKE_ADMIN_TOKEN || process.env.ADMIN_API_TOKEN || "";
const TARGET = 20;

function requestJson(path, { method = "GET", body, admin = false } = {}) {
  const args = ["-sS", "-X", method];
  args.push("-H", "Content-Type: application/json");
  if (admin && ADMIN_TOKEN.trim()) {
    args.push("-H", `x-admin-token: ${ADMIN_TOKEN.trim()}`);
  }
  if (body !== undefined) {
    args.push("-d", JSON.stringify(body));
  }
  args.push(`${BASE_URL}${path}`);

  const output = execFileSync("curl", args, { encoding: "utf-8" });
  let payload = {};
  try {
    payload = output ? JSON.parse(output) : {};
  } catch {
    throw new Error(`${method} ${path} returned non-JSON response`);
  }
  if (payload && typeof payload === "object" && "error" in payload) {
    throw new Error(`${method} ${path} failed: ${payload.error}`);
  }
  return payload;
}

function run() {
  console.log(`[smoke] base=${BASE_URL}`);
  requestJson("/api/tasks/seed", {
    method: "POST",
    body: { count: TARGET, mode: "created_only" }
  });

  const tasks = requestJson("/api/tasks");
  const targetTasks = tasks.filter((task) => task.status === "created").slice(0, TARGET);

  if (targetTasks.length < TARGET) {
    throw new Error(`Expected at least ${TARGET} created tasks, got ${targetTasks.length}`);
  }

  const taskIds = [];
  for (const task of targetTasks) {
    taskIds.push(task.id);
    requestJson(`/api/tasks/${task.id}/ai`, {
      method: "POST",
      body: { outcome: "fail", note: "Smoke run" }
    });
    requestJson(`/api/tasks/${task.id}/human`, {
      method: "POST",
      admin: true,
      body: { name: "Smoke Human" }
    });
    requestJson(`/api/tasks/${task.id}/evidence`, {
      method: "POST",
      body: { by: "human", type: "note", note: "Smoke evidence + timestamp" }
    });
    requestJson(`/api/tasks/${task.id}/verify`, {
      method: "POST",
      admin: true
    });
    requestJson(`/api/tasks/${task.id}/settle`, {
      method: "POST",
      admin: true
    });
  }

  const afterTasks = requestJson("/api/tasks");
  const paidCount = afterTasks.filter(
    (task) => taskIds.includes(task.id) && task.status === "paid"
  ).length;

  if (paidCount !== TARGET) {
    throw new Error(`Expected ${TARGET} paid tasks after smoke run, got ${paidCount}`);
  }

  const payments = requestJson("/api/payments?limit=300");
  const settledTaskIds = new Set(payments.map((payment) => payment.taskId));
  const paymentCoverage = taskIds.filter((taskId) => settledTaskIds.has(taskId)).length;
  if (paymentCoverage !== TARGET) {
    throw new Error(
      `Expected ${TARGET} payment ledger records, got coverage for ${paymentCoverage}`
    );
  }

  const metrics = requestJson("/api/metrics");
  console.log(`[smoke] completed=${TARGET} paid=${paidCount} ledgerCoverage=${paymentCoverage}`);
  console.log(
    `[smoke] metrics: created=${metrics.created} inProgress=${metrics.inProgress} verified=${metrics.verified} paid=${metrics.paid} failRate=${metrics.failRate}%`
  );
  console.log("[smoke] PASS");
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[smoke] FAIL", message);
  process.exit(1);
}
