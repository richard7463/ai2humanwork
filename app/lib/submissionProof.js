export const SUBMISSION_PROJECT = {
  name: "ai2human",
  tagline: "Human fallback infrastructure for agents on X Layer",
  oneLiner:
    "ai2human inserts an OnchainOS precheck before fallback: the planner queries Wallet API, Market API, and Trade API on X Layer, keeps work autonomous when possible, and dispatches a human operator only when reality or compliance still blocks the task.",
  githubUrl: "https://github.com/richard7463/ai2humanwork",
  demoPath: "/livedemo",
  reviewerPath: "/reviewer",
  tasksPath: "/tasks",
  submissionPath: "/submission"
};

export const SUBMISSION_CORE_LOOP = [
  "Task posted with proof requirements",
  "Planner queries Wallet API, Market API, and Trade API on X Layer",
  "If the task is still blocked, the planner escalates to dispatcher-led human fallback",
  "Human operator claims and executes the last-resort real-world step",
  "Structured proof is submitted and verified",
  "Settlement is released on X Layer"
];

export const SUBMISSION_ONCHAIN_OS_PRECHECK = [
  {
    label: "Wallet API",
    description:
      "Checks signer control, payout readiness, and whether the agent can keep execution inside an X Layer wallet."
  },
  {
    label: "Market API",
    description:
      "Checks whether a quoted onchain route can satisfy the request before escalating out of software."
  },
  {
    label: "Trade API",
    description: "Checks whether settlement and asset movement can stay autonomous on X Layer."
  }
];

export const SUBMISSION_CHAIN_NATIVE_FRAMING =
  "Human fallback is the last-resort execution layer when onchain agents hit real-world constraints or compliance gates.";

export const SUBMISSION_REAL_SETTLEMENT = {
  taskId: "7bde6365-9e4a-4fa9-a2f4-e79657b354b3",
  taskPath: "/tasks/7bde6365-9e4a-4fa9-a2f4-e79657b354b3",
  taskTitle: "Reply to the official thread with a localized summary and CTA",
  proofPostUrl: "https://x.com/Richard_buildai/status/2036393335326380458",
  payerAddress: "0x3f665386b41Fa15c5ccCeE983050a236E6a10108",
  operatorAddress: "0x81009cc711e5e0285dd8f703aab1af69fa4a4390",
  amount: "0.01",
  tokenSymbol: "USDT0",
  tokenDisplayName: "USD₮0",
  network: "xlayer-mainnet",
  chainId: 196,
  txHash: "0x9c01ad8dac5f2fa1d77da8e9b3f2a3afbfe539ea68af7f3929d7bf9a5f3f5d67",
  explorerUrl:
    "https://www.oklink.com/xlayer/tx/0x9c01ad8dac5f2fa1d77da8e9b3f2a3afbfe539ea68af7f3929d7bf9a5f3f5d67",
  settledAt: "2026-03-24T10:57:41.334Z"
};

export const SUBMISSION_X402_STATUS = {
  integrated: true,
  provenOnchain: false,
  summary:
    "An x402-gated verification bundle flow is integrated as a bonus proof-access layer, but the submission centers on the proven task settlement transaction above."
};
