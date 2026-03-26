export const ONCHAIN_OS_PRECHECK_APIS = [
  {
    id: "wallet_api",
    label: "Wallet API",
    summary:
      "Checks signer control, payout readiness, and whether the agent can complete the task from an X Layer wallet."
  },
  {
    id: "market_api",
    label: "Market API",
    summary:
      "Checks whether a quoted onchain route can satisfy the request without leaving the agent workflow."
  },
  {
    id: "trade_api",
    label: "Trade API",
    summary: "Checks whether asset movement and settlement can stay autonomous on X Layer."
  }
];

export const CHAIN_NATIVE_FALLBACK_FRAMING =
  "Human fallback is the last-resort execution layer when onchain agents hit real-world constraints or compliance gates.";

function getFallbackReason(task) {
  const platform = task?.campaign?.platform;
  const action = task?.campaign?.action;

  if (platform === "x") {
    if (action === "repost" || action === "reply" || action === "quote" || action === "post") {
      return "a human-owned X identity, anti-bot checks, and a live public post are still required";
    }
    return "the task still depends on an off-agent identity or compliance gate";
  }

  return "the task still depends on an on-site check, signature, pickup, or physical proof collection";
}

export function getOnchainOsPrecheck(task, outcome = "fail") {
  const route = outcome === "success" ? "autonomous_onchain" : "human_fallback";
  const apiList = ONCHAIN_OS_PRECHECK_APIS.map((item) => item.label).join(", ");
  const reason = getFallbackReason(task);

  if (route === "autonomous_onchain") {
    return {
      route,
      apis: ONCHAIN_OS_PRECHECK_APIS,
      heading: "Planner kept the task on the autonomous onchain path.",
      precheckMessage: `Queried ${apiList} on X Layer and cleared the task for autonomous execution.`,
      plannerMessage:
        "Kept the task on the autonomous onchain path after Wallet API, Market API, and Trade API checks cleared.",
      handoffMessage: "No human fallback required."
    };
  }

  return {
    route,
    apis: ONCHAIN_OS_PRECHECK_APIS,
    heading: "Planner escalated to last-resort human fallback.",
    precheckMessage: `Queried ${apiList} on X Layer, but ${reason}.`,
    plannerMessage:
      "Escalated to the dispatcher after Wallet API, Market API, and Trade API checks still hit a real-world or compliance blocker.",
    handoffMessage: CHAIN_NATIVE_FALLBACK_FRAMING
  };
}
