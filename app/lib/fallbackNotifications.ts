import { updateDb, type FallbackOrder } from "./store";
import { appendEvidence } from "./taskEvidence";

type NotificationResult = {
  matched: number;
  emails: string[];
};

function includesAnyKeyword(text: string, keywords: string[]) {
  if (!keywords.length) return true;
  const normalized = text.toLowerCase();
  return keywords.some((item) => normalized.includes(item.toLowerCase()));
}

export async function notifyFallbackSubscribers(
  order: Pick<FallbackOrder, "id" | "location" | "proofRequirements">,
  serviceText: string
): Promise<NotificationResult> {
  const now = new Date().toISOString();
  const evidenceText = `${serviceText} ${order.proofRequirements.join(" ")} ${order.location}`;

  const matchedEmails = await updateDb((db) => {
    const emails: string[] = [];

    for (const sub of db.fallbackSubscriptions) {
      if (!sub.active) continue;

      const cityMatched =
        sub.cities.length === 0 ||
        sub.cities.some((city) => order.location.toLowerCase().includes(city.toLowerCase()));
      const skillMatched = includesAnyKeyword(evidenceText, sub.skills);

      if (!cityMatched || !skillMatched) continue;

      sub.lastNotifiedAt = now;
      emails.push(sub.email);
    }

    const targetOrder = db.fallbackOrders.find((item) => item.id === order.id);
    if (targetOrder) {
      appendEvidence(targetOrder, {
        by: "system",
        type: "log",
        content:
          emails.length > 0
            ? `Subscription notification queued for ${emails.length} email(s).`
            : "No subscriber matched this fallback order."
      });
    }

    return emails;
  });

  return {
    matched: matchedEmails.length,
    emails: matchedEmails.slice(0, 10)
  };
}
