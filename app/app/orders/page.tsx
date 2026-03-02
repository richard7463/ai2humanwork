"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "../market-v2.module.css";

type ServiceRow = {
  service: {
    id: string;
    providerId: string;
    title: string;
  };
  provider: {
    id: string;
    name: string;
  };
};

type HumanRow = {
  human: {
    id: string;
    name: string;
  };
};

type FallbackOrder = {
  id: string;
  serviceId: string;
  providerId: string;
  agentName: string;
  location: string;
  deadline: string;
  budget: string;
  callbackUrl?: string;
  proofRequirements: string[];
  status:
    | "created"
    | "accepted"
    | "in_progress"
    | "delivered"
    | "callback_sent"
    | "callback_failed"
    | "verified"
    | "paid";
  humanId?: string;
  humanName?: string;
  evidence: Array<{ id: string }>;
  createdAt: string;
  updatedAt: string;
};

type TimelineState = "done" | "active" | "pending" | "failed";

const FLOW_STEPS = ["Posted", "Claimed", "Delivered", "Notified", "Verified", "Paid"] as const;

function statusBadge(status: FallbackOrder["status"]) {
  if (status === "callback_failed") return `${styles.badge} ${styles.badgeBad}`;
  if (status === "paid") return `${styles.badge} ${styles.badgeOk}`;
  if (status === "accepted" || status === "in_progress") {
    return `${styles.badge} ${styles.badgeWarn}`;
  }
  if (status === "callback_sent" || status === "delivered" || status === "verified") {
    return `${styles.badge} ${styles.badgeOk}`;
  }
  return styles.badge;
}

function currentFlowIndex(status: FallbackOrder["status"]) {
  switch (status) {
    case "created":
      return 0;
    case "accepted":
    case "in_progress":
      return 1;
    case "delivered":
      return 2;
    case "callback_sent":
    case "callback_failed":
      return 3;
    case "verified":
      return 4;
    case "paid":
      return 5;
    default:
      return 0;
  }
}

function buildTimeline(status: FallbackOrder["status"]) {
  const current = currentFlowIndex(status);
  const failed = status === "callback_failed";

  return FLOW_STEPS.map((label, index) => {
    let state: TimelineState = "pending";
    if (index < current) state = "done";
    if (index === current) state = failed ? "failed" : "active";
    return { label, state };
  });
}

export default function AppOrdersPage() {
  const [rows, setRows] = useState<FallbackOrder[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [humans, setHumans] = useState<HumanRow[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [location, setLocation] = useState("Shanghai");
  const [deadline, setDeadline] = useState("4h");
  const [budget, setBudget] = useState("$120");
  const [agentName, setAgentName] = useState("Demo Agent");
  const [proofRequirements, setProofRequirements] = useState("photo,timestamp");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberSkills, setSubscriberSkills] = useState("");
  const [subscriberCities, setSubscriberCities] = useState("");
  const [subscriberMsg, setSubscriberMsg] = useState("");

  const load = async () => {
    setError("");
    try {
      const [ordersRes, servicesRes, humansRes] = await Promise.all([
        fetch("/api/fallback-orders?limit=60", { cache: "no-store" }),
        fetch("/api/services?sort=top_rated", { cache: "no-store" }),
        fetch("/api/humans?sort=top_rated", { cache: "no-store" })
      ]);

      if (!ordersRes.ok || !servicesRes.ok || !humansRes.ok) {
        throw new Error("Failed to load fallback data.");
      }

      const ordersData = (await ordersRes.json()) as { rows?: FallbackOrder[] };
      const servicesData = (await servicesRes.json()) as { rows?: ServiceRow[] };
      const humansData = (await humansRes.json()) as { rows?: HumanRow[] };

      const nextServices = Array.isArray(servicesData.rows) ? servicesData.rows : [];
      setRows(Array.isArray(ordersData.rows) ? ordersData.rows : []);
      setServices(nextServices);
      setHumans(Array.isArray(humansData.rows) ? humansData.rows : []);

      if (!serviceId && nextServices[0]?.service?.id) {
        setServiceId(nextServices[0].service.id);
      }
    } catch {
      setError("Failed to load orders.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromQuery = new URLSearchParams(window.location.search).get("serviceId");
    if (fromQuery) setServiceId(fromQuery);
  }, []);

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceRow>();
    for (const item of services) {
      map.set(item.service.id, item);
    }
    return map;
  }, [services]);

  const humanMap = useMemo(() => {
    const map = new Map<string, HumanRow["human"]>();
    for (const row of humans) {
      map.set(row.human.id, row.human);
    }
    return map;
  }, [humans]);

  const createOrder = async () => {
    if (!serviceId) {
      setError("Please select a service first.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/fallback-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          location,
          deadline,
          budget,
          agentName,
          callbackUrl: callbackUrl || undefined,
          proofRequirements: proofRequirements
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      });

      const payload = (await res.json()) as {
        error?: string;
        order?: { id: string };
        notifications?: { matched?: number };
      };
      if (!res.ok) {
        setError(payload.error || "Failed to create order.");
        return;
      }

      setMessage(
        `Order created: ${payload.order?.id?.slice(0, 8) || "ok"} · notified ${
          payload.notifications?.matched || 0
        } subscriber(s)`
      );
      await load();
    } catch {
      setError("Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  const acceptOrder = async (order: FallbackOrder) => {
    const preferred = humanMap.get(order.providerId) || humans[0]?.human;
    if (!preferred) {
      setError("No human profiles available for assignment.");
      return;
    }

    const res = await fetch(`/api/fallback-orders/${order.id}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ humanId: preferred.id, humanName: preferred.name })
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error || "Failed to accept order.");
      return;
    }

    await load();
  };

  const deliverOrder = async (orderId: string) => {
    const res = await fetch(`/api/fallback-orders/${orderId}/deliver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: "Completed with photo and timestamp proof.",
        proofUrls: ["https://example.com/proof.jpg"]
      })
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error || "Failed to deliver order.");
      return;
    }

    await load();
  };

  const retryCallback = async (orderId: string) => {
    const res = await fetch(`/api/fallback-orders/${orderId}/notify`, {
      method: "POST"
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error || "Failed to notify agent callback.");
      return;
    }

    await load();
  };

  const verifyOrder = async (orderId: string) => {
    const res = await fetch(`/api/fallback-orders/${orderId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Agent verified completion." })
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error || "Failed to verify order.");
      return;
    }

    await load();
  };

  const settleOrder = async (orderId: string) => {
    setMessage("");
    setError("");

    const res = await fetch(`/api/fallback-orders/${orderId}/settle`, {
      method: "POST",
      headers: {
        "idempotency-key": `fallback-settle:${orderId}`
      }
    });

    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      idempotentReplay?: boolean;
    };

    if (!res.ok) {
      setError(payload.error || "Failed to settle order.");
      return;
    }

    setMessage(payload.idempotentReplay ? "Payment already settled (idempotent replay)." : "Payment settled.");
    await load();
  };

  const subscribeEmailAlerts = async () => {
    setSubscriberMsg("");
    setError("");
    const res = await fetch("/api/fallback-orders/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: subscriberEmail,
        skills: subscriberSkills,
        cities: subscriberCities
      })
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string; email?: string };
    if (!res.ok) {
      setError(payload.error || "Failed to subscribe.");
      return;
    }

    setSubscriberMsg(`Subscription active for ${payload.email || subscriberEmail}.`);
    setSubscriberEmail("");
    setSubscriberSkills("");
    setSubscriberCities("");
  };

  const settledCount = rows.filter((item) => item.status === "paid").length;
  const verifiedCount = rows.filter((item) => item.status === "verified").length;
  const openCount = rows.filter((item) => item.status === "created").length;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroKicker}>Orders</p>
          <h1>Agent task loop: post → claim → deliver → verify → pay</h1>
          <p>
            Agents post reality tasks. Subscribers get notified by email. Humans accept and submit
            proof. Agent verification unlocks settlement.
          </p>
        </div>
        <Link className={styles.heroAction} href="/app/services">
          Browse services
        </Link>
      </header>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <p>Total orders</p>
          <strong>{rows.length}</strong>
        </article>
        <article className={styles.kpiCard}>
          <p>Open</p>
          <strong>{openCount}</strong>
        </article>
        <article className={styles.kpiCard}>
          <p>Verified</p>
          <strong>{verifiedCount}</strong>
        </article>
        <article className={styles.kpiCard}>
          <p>Paid</p>
          <strong>{settledCount}</strong>
        </article>
      </div>

      {message && <div className={styles.meta}>{message}</div>}
      {subscriberMsg && <div className={styles.meta}>{subscriberMsg}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.dualCol}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Create fallback order</h2>
              <p>Step 1: Agent posts a task into the human market.</p>
            </div>
            <Link className={styles.ghostButton} href="/app/profile">
              Sign In / Register
            </Link>
          </div>

          <div className={styles.form}>
            <h3 style={{ margin: 0 }}>Email subscriptions</h3>
            <p style={{ margin: "4px 0 0", color: "rgba(190,205,230,.85)", fontSize: 13 }}>
              Step 2: Talent subscribes to new tasks by city/skill.
            </p>
            <div className={styles.formGrid2}>
              <label className={styles.label}>
                Email
                <input
                  className={styles.input}
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
                  placeholder="operator@email.com"
                />
              </label>
              <label className={styles.label}>
                Skills (comma)
                <input
                  className={styles.input}
                  value={subscriberSkills}
                  onChange={(e) => setSubscriberSkills(e.target.value)}
                  placeholder="verification,photo,captcha"
                />
              </label>
            </div>
            <div className={styles.formGrid2}>
              <label className={styles.label}>
                Cities (comma)
                <input
                  className={styles.input}
                  value={subscriberCities}
                  onChange={(e) => setSubscriberCities(e.target.value)}
                  placeholder="shanghai,austin,tokyo"
                />
              </label>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button className={styles.linkButton} onClick={subscribeEmailAlerts}>
                  Subscribe alerts
                </button>
              </div>
            </div>
          </div>

          <div className={styles.form}>
            <label className={styles.label}>
              Service
              <select className={styles.select} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Select a service</option>
                {services.map((row) => (
                  <option key={row.service.id} value={row.service.id}>
                    {row.service.title} ({row.provider.name})
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.formGrid3}>
              <label className={styles.label}>
                Location
                <input className={styles.input} value={location} onChange={(e) => setLocation(e.target.value)} />
              </label>
              <label className={styles.label}>
                Deadline
                <input className={styles.input} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </label>
              <label className={styles.label}>
                Budget
                <input className={styles.input} value={budget} onChange={(e) => setBudget(e.target.value)} />
              </label>
            </div>

            <div className={styles.formGrid2}>
              <label className={styles.label}>
                Agent name
                <input className={styles.input} value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              </label>
              <label className={styles.label}>
                Callback URL (optional)
                <input className={styles.input} value={callbackUrl} onChange={(e) => setCallbackUrl(e.target.value)} />
              </label>
            </div>

            <label className={styles.label}>
              Proof requirements
              <input
                className={styles.input}
                value={proofRequirements}
                onChange={(e) => setProofRequirements(e.target.value)}
                placeholder="photo,timestamp,receipt"
              />
            </label>

            <button className={styles.primaryButton} onClick={createOrder} disabled={submitting}>
              {submitting ? "Creating..." : "Create order"}
            </button>
          </div>
        </article>

        <aside className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Order queue</h2>
              <p>Created → Accepted → Delivered → Callback → Verified → Paid.</p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className={styles.empty}>No orders yet.</div>
          ) : (
            <div className={styles.panelList}>
              {rows.map((item) => {
                const service = serviceMap.get(item.serviceId);
                const timeline = buildTimeline(item.status);
                const currentStep =
                  timeline.find((step) => step.state === "active" || step.state === "failed")?.label ||
                  "Paid";
                return (
                  <article key={item.id} className={styles.queueItem}>
                    <div className={styles.cardHeader}>
                      <div>
                        <p className={styles.title}>{service?.service.title || "Unknown service"}</p>
                        <p className={styles.sub}>
                          {item.location} · {item.deadline} · {item.budget}
                        </p>
                      </div>
                      <span className={statusBadge(item.status)}>{item.status}</span>
                    </div>

                    <div className={styles.badges}>
                      <span className={styles.badge}>agent {item.agentName}</span>
                      <span className={styles.badge}>human {item.humanName || "unassigned"}</span>
                      <span className={styles.badge}>proof {item.evidence.length}</span>
                      <span className={styles.badge}>#{item.id.slice(0, 6)}</span>
                    </div>

                    <div className={styles.timeline}>
                      {timeline.map((step, index) => (
                        <div key={step.label} className={styles.timelineStep}>
                          <span
                            className={`${styles.timelineDot} ${
                              step.state === "done"
                                ? styles.timelineDotDone
                                : step.state === "active"
                                  ? styles.timelineDotActive
                                  : step.state === "failed"
                                    ? styles.timelineDotFailed
                                    : styles.timelineDotPending
                            }`}
                          />
                          {index < timeline.length - 1 ? <span className={styles.timelineLine} /> : null}
                          <span className={styles.timelineLabel}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className={styles.timelineHint}>Current step: {currentStep}</p>

                    <div className={styles.actions}>
                      {item.status === "created" && (
                        <button className={styles.linkButton} onClick={() => acceptOrder(item)}>
                          Step 3: Accept
                        </button>
                      )}
                      {(item.status === "accepted" || item.status === "in_progress") && (
                        <button className={styles.primaryButton} onClick={() => deliverOrder(item.id)}>
                          Step 4-5: Deliver + notify agent
                        </button>
                      )}
                      {item.status === "callback_failed" && (
                        <button className={styles.linkButton} onClick={() => retryCallback(item.id)}>
                          Retry callback
                        </button>
                      )}
                      {(item.status === "callback_sent" ||
                        item.status === "delivered" ||
                        item.status === "callback_failed") && (
                        <button className={styles.linkButton} onClick={() => verifyOrder(item.id)}>
                          Step 6: Verify
                        </button>
                      )}
                      {item.status === "verified" && (
                        <button className={styles.primaryButton} onClick={() => settleOrder(item.id)}>
                          Step 7: Pay
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
