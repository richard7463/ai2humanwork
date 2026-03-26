import Link from "next/link";
import {
  SUBMISSION_CHAIN_NATIVE_FRAMING,
  SUBMISSION_CORE_LOOP,
  SUBMISSION_ONCHAIN_OS_PRECHECK,
  SUBMISSION_PROJECT,
  SUBMISSION_REAL_SETTLEMENT,
  SUBMISSION_X402_STATUS
} from "../lib/submissionProof.js";

export const metadata = {
  title: "ai2human Submission Proof",
  description:
    "Hackathon submission surface for ai2human, including the real X Layer settlement transaction, proof post, and live product routes."
};

const scenarios = [
  "Storefront open / closed verification",
  "Shelf and product availability checks",
  "Front-desk signature pickup",
  "Locker or counter pickup confirmation",
  "Menu and live price verification",
  "Venue queue and entrance-status checks"
];

const checks = [
  "Public GitHub repository",
  "Live demo showing the closed loop",
  "Planner path starts with an OnchainOS precheck",
  "Reviewer console with proof and settlement history",
  "A real X Layer settlement transaction hash",
  "Structured proof tied to one completed task"
];

const collaborationRoles = [
  {
    label: "Planner agent",
    description: "Owns route selection after the OnchainOS precheck completes."
  },
  {
    label: "Dispatcher agent",
    description: "Only takes over when the planner explicitly escalates to last-resort human fallback."
  },
  {
    label: "Verifier agent",
    description: "Checks proof integrity and settlement conditions before money moves."
  },
  {
    label: "Settlement agent",
    description: "Releases payment on X Layer only after verification clears."
  }
];

const sectionStyle = {
  display: "grid",
  gap: "24px"
} as const;

const cardGridStyle = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
} as const;

const linkRowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
  marginTop: "18px"
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(9, 10, 15, 0.7)"
} as const;

export default function SubmissionPage() {
  const settledAt = new Date(SUBMISSION_REAL_SETTLEMENT.settledAt).toLocaleString("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return (
    <div className="page">
      <main style={{ maxWidth: 1160, margin: "0 auto", ...sectionStyle }}>
        <section className="market-card">
          <div className="block-header">
            <div>
              <p className="mvp-muted">X Layer AI Hackathon Submission</p>
              <h1 style={{ margin: "0 0 10px", fontSize: "clamp(34px, 6vw, 56px)" }}>
                ai2human keeps blocked agent work inside one auditable line.
              </h1>
              <p className="mvp-muted" style={{ maxWidth: 820, fontSize: 16, lineHeight: 1.7 }}>
                {SUBMISSION_PROJECT.oneLiner}
              </p>
            </div>
            <span className="status-pill status-paid">Proven Onchain</span>
          </div>

          <div className="reviewer-metric-grid">
            <div>
              <span>Category</span>
              <strong>Human fallback infra</strong>
            </div>
            <div>
              <span>Network</span>
              <strong>X Layer mainnet</strong>
            </div>
            <div>
              <span>Settlement asset</span>
              <strong>{SUBMISSION_REAL_SETTLEMENT.tokenDisplayName}</strong>
            </div>
            <div>
              <span>Proof status</span>
              <strong>1 real tx hash</strong>
            </div>
          </div>

          <div style={linkRowStyle}>
            <Link href={SUBMISSION_PROJECT.demoPath} style={buttonStyle}>
              Open live demo
            </Link>
            <Link href={SUBMISSION_PROJECT.reviewerPath} style={buttonStyle}>
              Open reviewer console
            </Link>
            <Link href={SUBMISSION_REAL_SETTLEMENT.taskPath} style={buttonStyle}>
              Open settled task
            </Link>
            <a href={SUBMISSION_PROJECT.githubUrl} target="_blank" rel="noreferrer" style={buttonStyle}>
              Open GitHub
            </a>
            <a
              href={SUBMISSION_REAL_SETTLEMENT.explorerUrl}
              target="_blank"
              rel="noreferrer"
              style={buttonStyle}
            >
              Open explorer tx
            </a>
          </div>
        </section>

        <section style={cardGridStyle}>
          <div className="market-card">
            <div className="block-header">
              <div>
                <h2>Core Loop</h2>
                <p className="mvp-muted">The product story stays narrow and verifiable.</p>
              </div>
            </div>
            <div className="mvp-evidence" style={{ borderTop: "none", paddingTop: 0 }}>
              {SUBMISSION_CORE_LOOP.map((item, index) => (
                <div key={item} className="mvp-evidence-item">
                  <div className="evidence-meta">
                    <span>step {index + 1}</span>
                  </div>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="market-card">
            <div className="block-header">
              <div>
                <h2>Judging Surface</h2>
                <p className="mvp-muted">What a judge can verify in under a minute.</p>
              </div>
            </div>
            <div className="mvp-evidence" style={{ borderTop: "none", paddingTop: 0 }}>
              {checks.map((item) => (
                <div key={item} className="mvp-evidence-item">
                  <div className="evidence-meta">
                    <span>check</span>
                    <span>live</span>
                  </div>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={cardGridStyle}>
          <div className="market-card">
            <div className="block-header">
              <div>
                <h2>OnchainOS Main Path</h2>
                <p className="mvp-muted">
                  X Layer is part of route selection, not only the payout layer.
                </p>
              </div>
            </div>
            <div className="mvp-evidence" style={{ borderTop: "none", paddingTop: 0 }}>
              <div className="mvp-evidence-item">
                <div className="evidence-meta">
                  <span>framing</span>
                  <span>main path</span>
                </div>
                <p>{SUBMISSION_CHAIN_NATIVE_FRAMING}</p>
              </div>
              {SUBMISSION_ONCHAIN_OS_PRECHECK.map((item) => (
                <div key={item.label} className="mvp-evidence-item">
                  <div className="evidence-meta">
                    <span>precheck</span>
                    <span>{item.label}</span>
                  </div>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="market-card">
            <div className="block-header">
              <div>
                <h2>Agent Collaboration</h2>
                <p className="mvp-muted">
                  Planner, dispatcher, verifier, and settlement are presented as one decision chain.
                </p>
              </div>
            </div>
            <div className="mvp-evidence" style={{ borderTop: "none", paddingTop: 0 }}>
              {collaborationRoles.map((item) => (
                <div key={item.label} className="mvp-evidence-item">
                  <div className="evidence-meta">
                    <span>role</span>
                    <span>active</span>
                  </div>
                  <p>{item.label}</p>
                  <p className="mvp-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="market-card">
          <div className="block-header">
            <div>
              <h2>Proven X Layer Settlement</h2>
              <p className="mvp-muted">
                This is the submission-grade proof that the loop closes onchain after verification.
              </p>
            </div>
            <span className="status-pill status-verified">{SUBMISSION_REAL_SETTLEMENT.network}</span>
          </div>

          <div className="reviewer-metric-grid">
            <div>
              <span>Task</span>
              <strong>{SUBMISSION_REAL_SETTLEMENT.taskId.slice(0, 8)}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>
                {SUBMISSION_REAL_SETTLEMENT.amount} {SUBMISSION_REAL_SETTLEMENT.tokenSymbol}
              </strong>
            </div>
            <div>
              <span>Chain ID</span>
              <strong>{SUBMISSION_REAL_SETTLEMENT.chainId}</strong>
            </div>
            <div>
              <span>Settled at</span>
              <strong>{settledAt} UTC+8</strong>
            </div>
          </div>

          <div style={cardGridStyle}>
            <div className="mvp-evidence">
              <h4>Task proof</h4>
              <div className="mvp-evidence-item">
                <div className="evidence-meta">
                  <span>task</span>
                  <span>paid</span>
                </div>
                <p>{SUBMISSION_REAL_SETTLEMENT.taskTitle}</p>
                <p className="mvp-muted">
                  <a href={SUBMISSION_REAL_SETTLEMENT.proofPostUrl} target="_blank" rel="noreferrer">
                    Proof post URL
                  </a>
                </p>
                <p className="mvp-muted">
                  <Link href={SUBMISSION_REAL_SETTLEMENT.taskPath}>Open task detail</Link>
                </p>
              </div>
            </div>

            <div className="mvp-evidence">
              <h4>Onchain receipt</h4>
              <div className="mvp-evidence-item">
                <div className="evidence-meta">
                  <span>tx hash</span>
                  <span>accepted on l2</span>
                </div>
                <p style={{ wordBreak: "break-all" }}>{SUBMISSION_REAL_SETTLEMENT.txHash}</p>
                <p className="mvp-muted">
                  payer: {SUBMISSION_REAL_SETTLEMENT.payerAddress}
                </p>
                <p className="mvp-muted">
                  operator: {SUBMISSION_REAL_SETTLEMENT.operatorAddress}
                </p>
                <p className="mvp-muted">
                  <a href={SUBMISSION_REAL_SETTLEMENT.explorerUrl} target="_blank" rel="noreferrer">
                    View on OKLink
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section style={cardGridStyle}>
          <div className="market-card">
            <div className="block-header">
              <div>
                <h2>Why This Matters</h2>
                <p className="mvp-muted">
                  Agents can do online work, but many still fail when reality is involved.
                </p>
              </div>
            </div>
            <div className="mvp-evidence" style={{ borderTop: "none", paddingTop: 0 }}>
              <div className="mvp-evidence-item">
                <div className="evidence-meta">
                  <span>chain-native framing</span>
                </div>
                <p>{SUBMISSION_CHAIN_NATIVE_FRAMING}</p>
              </div>
              {scenarios.map((scenario) => (
                <div key={scenario} className="mvp-evidence-item">
                  <div className="evidence-meta">
                    <span>real-world blocker</span>
                  </div>
                  <p>{scenario}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="market-card">
            <div className="block-header">
              <div>
                <h2>x402 Status</h2>
                <p className="mvp-muted">Bonus capability, framed honestly.</p>
              </div>
              <span className={`status-pill ${SUBMISSION_X402_STATUS.integrated ? "status-verified" : "status-created"}`}>
                {SUBMISSION_X402_STATUS.integrated ? "Integrated" : "Pending"}
              </span>
            </div>
            <div className="mvp-evidence" style={{ borderTop: "none", paddingTop: 0 }}>
              <div className="mvp-evidence-item">
                <div className="evidence-meta">
                  <span>x402</span>
                  <span>{SUBMISSION_X402_STATUS.provenOnchain ? "proven" : "bonus"}</span>
                </div>
                <p>{SUBMISSION_X402_STATUS.summary}</p>
              </div>
              <div className="mvp-evidence-item">
                <div className="evidence-meta">
                  <span>focus</span>
                </div>
                <p>The primary submission proof remains the verified task settlement transaction above.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
