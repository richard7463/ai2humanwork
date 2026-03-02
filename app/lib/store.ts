import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import {
  seedHumans,
  seedServices,
  type Human,
  type HumanService
} from "./humanMarketplace";

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

export type PaymentEntry = {
  id: string;
  taskId?: string;
  fallbackOrderId?: string;
  idempotencyKey?: string;
  amount: string;
  receiver: string;
  method: "mock_x402";
  status: "paid";
  source?: "task" | "fallback_order";
  createdAt: string;
};

export type FallbackOrderStatus =
  | "created"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "callback_sent"
  | "callback_failed"
  | "verified"
  | "paid";

export type FallbackSubscription = {
  id: string;
  email: string;
  skills: string[];
  cities: string[];
  active: boolean;
  createdAt: string;
  lastNotifiedAt?: string;
};

export type FallbackOrder = {
  id: string;
  serviceId: string;
  providerId: string;
  agentName: string;
  location: string;
  deadline: string;
  budget: string;
  callbackUrl?: string;
  proofRequirements: string[];
  status: FallbackOrderStatus;
  humanId?: string;
  humanName?: string;
  createdAt: string;
  updatedAt: string;
  evidence: EvidenceItem[];
  callback?: {
    attemptedAt?: string;
    status?: "sent" | "failed";
    code?: number;
    message?: string;
  };
};

export type UserAccount = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  humanId?: string;
  authProvider?: "local" | "privy";
  privyUserId?: string;
  walletAddress?: string;
};

export type AuthSession = {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
};

type Db = {
  tasks: Task[];
  waitlist: WaitlistEntry[];
  payments: PaymentEntry[];
  humans: Human[];
  services: HumanService[];
  fallbackOrders: FallbackOrder[];
  fallbackSubscriptions: FallbackSubscription[];
  users: UserAccount[];
  sessions: AuthSession[];
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

export function makeSeedFallbackOrders(count: number): FallbackOrder[] {
  const now = Date.now();
  const statuses: FallbackOrderStatus[] = [
    "created",
    "accepted",
    "delivered",
    "callback_sent",
    "callback_failed",
    "verified",
    "paid"
  ];
  const budgets = ["$55", "$75", "$120", "$150", "$220"];
  const deadlines = ["1h", "2h", "4h", "6h", "12h"];
  const locations = ["Shanghai", "Austin", "Berlin", "Singapore", "Tokyo"];

  const serviceByIndex = seedServices.slice(0, Math.max(1, Math.min(seedServices.length, count)));
  const humansById = new Map(seedHumans.map((human) => [human.id, human] as const));
  const orders: FallbackOrder[] = [];

  for (let i = 0; i < count; i += 1) {
    const service = serviceByIndex[i % serviceByIndex.length];
    const provider = humansById.get(service.providerId);
    if (!provider) continue;

    const status = statuses[i % statuses.length];
    const createdAt = new Date(now - i * 1000 * 60 * 13).toISOString();
    const updatedAt = new Date(now - i * 1000 * 60 * 4).toISOString();
    const order: FallbackOrder = {
      id: crypto.randomUUID(),
      serviceId: service.id,
      providerId: provider.id,
      agentName: `Agent-${(i % 5) + 1}`,
      location: locations[i % locations.length],
      deadline: deadlines[i % deadlines.length],
      budget: budgets[i % budgets.length],
      proofRequirements: ["photo", "timestamp"],
      status,
      humanId: status === "created" ? undefined : provider.id,
      humanName: status === "created" ? undefined : provider.name,
      createdAt,
      updatedAt,
      evidence: []
    };

    if (status !== "created") {
      order.evidence.push({
        id: crypto.randomUUID(),
        by: "human",
        type: "log",
        content: `Order accepted by ${provider.name}`,
        createdAt: updatedAt
      });
    }
    if (status === "delivered" || status === "callback_sent" || status === "callback_failed") {
      order.evidence.push({
        id: crypto.randomUUID(),
        by: "human",
        type: "photo",
        content: "https://example.com/proof.jpg",
        createdAt: updatedAt
      });
    }
    if (
      status === "callback_sent" ||
      status === "callback_failed" ||
      status === "verified" ||
      status === "paid"
    ) {
      order.callback = {
        attemptedAt: updatedAt,
        status: status === "callback_failed" ? "failed" : "sent",
        code: status === "callback_failed" ? 500 : 200,
        message: status === "callback_failed" ? "Callback failed." : "Callback sent."
      };
    }

    orders.push(order);
  }

  return orders;
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
    const initial: Db = {
      tasks: makeSeedTasks(60),
      waitlist: [],
      payments: [],
      humans: seedHumans,
      services: seedServices,
      fallbackOrders: makeSeedFallbackOrders(12),
      fallbackSubscriptions: [],
      users: [],
      sessions: []
    };
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<Db> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Db;

  const tasks = Array.isArray(parsed.tasks) && parsed.tasks.length > 0
    ? parsed.tasks
    : makeSeedTasks(60);
  const humans = Array.isArray(parsed.humans) && parsed.humans.length > 0
    ? parsed.humans
    : seedHumans.map((human) => ({ ...human }));
  const services = Array.isArray(parsed.services) && parsed.services.length > 0
    ? parsed.services
    : seedServices.map((service) => ({ ...service }));
  const fallbackOrders =
    Array.isArray(parsed.fallbackOrders) && parsed.fallbackOrders.length > 0
      ? parsed.fallbackOrders
      : makeSeedFallbackOrders(12);

  return {
    tasks,
    waitlist: parsed.waitlist ?? [],
    payments: parsed.payments ?? [],
    humans,
    services,
    fallbackOrders,
    fallbackSubscriptions: parsed.fallbackSubscriptions ?? [],
    users: parsed.users ?? [],
    sessions: parsed.sessions ?? []
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
