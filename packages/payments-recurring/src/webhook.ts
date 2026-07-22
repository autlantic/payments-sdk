import { createHmac, timingSafeEqual } from "node:crypto";
import type { BillingWebhookEvent } from "@autlantic/payments-recurring-core";
import { BILLING_WEBHOOK_SIGNATURE_HEADER } from "@autlantic/payments-recurring-core";

export { BILLING_WEBHOOK_SIGNATURE_HEADER };

export function signBillingWebhook(
  secret: string,
  event: BillingWebhookEvent,
): { body: string; signature: string } {
  const body = JSON.stringify(event);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  return { body, signature };
}

export function verifyBillingWebhook(
  secret: string,
  rawBody: string,
  signatureHeader: string | null | undefined,
): boolean {
  if (!signatureHeader?.trim()) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader.trim(), "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseBillingWebhookEvent(rawBody: string): BillingWebhookEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as BillingWebhookEvent;
    if (!parsed?.type || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
