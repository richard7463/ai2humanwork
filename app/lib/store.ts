import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type TaskStatus =
  | "created"
  | "ai_running"
  | "ai_failed"
  | "ai_done"
  | "human_assigned"
  | "human_done"
  | "verified"
  | "paid";

export type EvidenceItem = {
  id: string;
  by: "ai" | "human" | "system";
  type: "log" | "note" | "photo";
  content: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  budget: string;
  deadline: string;
  acceptance: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    type: "ai" | "human";
    name: string;
  };
  evidence: EvidenceItem[];
};

export type WaitlistEntry = {
  id: string;
  email: string;
  source: string;
  createdAt: string;
};

type Db = {
  tasks: Task[];
  waitlist: WaitlistEntry[];
};

export function makeSeedTasks(count: number): Task[] {
  const titles = [
    "Scrape Upwork gigs (Next.js) + daily report",
    "Monitor Amazon price + alert when drops",
    "On-site check: inventory + timestamped photos",
    "Competitor launch monitor: scrape + dedupe + email summary",
    "Captcha-heavy signup flow: needs human fallback",
    "Cross-app sync: Notion → Sheets → Slack",
    "Find 50 leads + evidence links",
    "Local courier: pickup + handoff (same city)",
    "Compliance scan: infringing links + screenshots",
    "Compare 20 vendor quotes + structured table"
  ];

  const acceptances = [
    "Provide evidence/logs",
    "Screenshots + links + key fields table",
    "Store photos + timestamp + address",
    "CSV + report + reproducible steps"
  ];

  const budgets = ["$35", "$49", "$80", "$120", "$220", "$399", "$750", "$999"];
  const deadlines = ["30m", "2h", "4h", "6h", "12h", "24h", "3d"];

  const statuses: TaskStatus[] = [
    "created",
    "created",
    "created",
    "ai_running",
    "ai_failed",
    "ai_done",
    "human_assigned",
    "human_done",
    "verified",
    "paid"
  ];

  const now = Date.now();
  const tasks: Task[] = [];

  for (let i = 0; i < count; i += 1) {
    const status = statuses[i % statuses.length];
    const createdAt = new Date(now - i * 1000 * 60 * 17).toISOString();
    const updatedAt = new Date(now - i * 1000 * 60 * 5).toISOString();
    const id = crypto.randomUUID();

    const evidence: EvidenceItem[] = [];
    const addEvidence = (by: EvidenceItem["by"], type: EvidenceItem["type"], content: string) => {
      evidence.push({
        id: crypto.randomUUID(),
        by,
        type,
        content,
        createdAt: updatedAt
      });
    };

    if (status === "ai_running") addEvidence("ai", "log", "AI running: marketplace scan + bid");
    if (status === "ai_failed") addEvidence("ai", "log", "AI failed: anti-bot / requires physical verification");
    if (status === "ai_done") addEvidence("ai", "note", "AI delivered: report + links");
    if (status === "human_assigned") addEvidence("system", "log", "Human assigned: Demo Human");
    if (status === "human_done") addEvidence("human", "photo", "Uploaded photos + timestamp");
    if (status === "verified") addEvidence("system", "log", "Verified by reviewer");
    if (status === "paid") {
      addEvidence("system", "log", "Verified by reviewer");
      addEvidence("system", "log", "Payment settled (mock)");
    }

    const assignee =
      status === "human_assigned" || status === "human_done"
        ? { type: "human" as const, name: "Demo Human" }
        : status === "ai_running" || status === "ai_done" || status === "ai_failed"
          ? { type: "ai" as const, name: "Demo Agent" }
          : undefined;

    tasks.push({
      id,
      title: titles[i % titles.length],
      budget: budgets[i % budgets.length],
      deadline: deadlines[i % deadlines.length],
      acceptance: acceptances[i % acceptances.length],
      status,
      createdAt,
      updatedAt,
      assignee,
      evidence
    });
  }

  return tasks;
}

function getDbPath(): string {
  // Vercel/serverless environments generally don't allow writing to the repo
  // filesystem; /tmp is writable but ephemeral. For a real deployment, replace
  // this with a durable store (Vercel KV/Postgres, etc.).
  if (process.env.TRUSTNET_DB_PATH) {
    return process.env.TRUSTNET_DB_PATH;
  }
  if (process.env.VERCEL) {
    return path.join("/tmp", "trustnet-db.json");
  }
  return path.join(process.cwd(), "data", "db.json");
}

const DB_PATH = getDbPath();

async function ensureDb(): Promise<void> {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const initial: Db = { tasks: makeSeedTasks(60), waitlist: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<Db> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Db;
  return {
    tasks: parsed.tasks ?? [],
    waitlist: parsed.waitlist ?? []
  };
}

export async function writeDb(db: Db): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export async function updateDb<T>(
  updater: (db: Db) => T | Promise<T>
): Promise<T> {
  const db = await readDb();
  const result = await updater(db);
  await writeDb(db);
  return result;
}
