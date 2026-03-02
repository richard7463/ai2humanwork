export const ALLOWED_FALLBACK_TRANSITIONS = Object.freeze({
  created: Object.freeze(["accepted"]),
  accepted: Object.freeze(["in_progress", "delivered"]),
  in_progress: Object.freeze(["delivered"]),
  delivered: Object.freeze(["callback_sent", "callback_failed", "verified"]),
  callback_sent: Object.freeze(["verified"]),
  callback_failed: Object.freeze(["callback_sent", "verified"]),
  verified: Object.freeze(["paid"]),
  paid: Object.freeze([])
});

export function canTransitionFallback(from, to) {
  const allowed = ALLOWED_FALLBACK_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function explainInvalidFallbackTransition(from, to) {
  const allowed = ALLOWED_FALLBACK_TRANSITIONS[from] || [];
  if (!allowed.length) {
    return `Invalid fallback transition: ${from} -> ${to}. ${from} is terminal.`;
  }
  return `Invalid fallback transition: ${from} -> ${to}. Allowed: ${allowed.join(", ")}.`;
}
