import { createHmac, timingSafeEqual } from "node:crypto";
import type { BillingWebhookEvent } from "@autlantic/payments-recurring-core";
import { BILLING_WEBHOOK_SIGNATURE_HEADER } from "@autlantic/payments-recurring-core";
import { AutlanticBillingError } from "./errors";

export { BILLING_WEBHOOK_SIGNATURE_HEADER };

export type WebhookVerifyFailureReason =
  | "missing_header"
  | "empty_secret"
  | "length_mismatch"
  | "invalid_signature"
  | "compare_error";

export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: WebhookVerifyFailureReason };

export type WebhookParseFailureReason = "invalid_json" | "missing_fields";

export type WebhookParseResult =
  | { ok: true; event: BillingWebhookEvent }
  | { ok: false; reason: WebhookParseFailureReason };

export function signBillingWebhook(
  secret: string,
  event: BillingWebhookEvent,
): { body: string; signature: string } {
  const body = JSON.stringify(event);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  return { body, signature };
}

/**
 * Verify webhook HMAC. Prefer {@link verifyBillingWebhookDetailed} when you need
 * a failure reason for logs / metrics.
 *
 * Argument order: `(secret, rawBody, signatureHeader)`.
 */
export function verifyBillingWebhook(
  secret: string,
  rawBody: string,
  signatureHeader: string | null | undefined,
): boolean {
  return verifyBillingWebhookDetailed(secret, rawBody, signatureHeader).ok;
}

/** Same as {@link verifyBillingWebhook}, with structured failure reasons. */
export function verifyBillingWebhookDetailed(
  secret: string,
  rawBody: string,
  signatureHeader: string | null | undefined,
): WebhookVerifyResult {
  if (!secret.trim()) return { ok: false, reason: "empty_secret" };
  if (!signatureHeader?.trim()) return { ok: false, reason: "missing_header" };

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader.trim(), "utf8");
    if (a.length !== b.length) return { ok: false, reason: "length_mismatch" };
    if (!timingSafeEqual(a, b)) return { ok: false, reason: "invalid_signature" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "compare_error" };
  }
}

/**
 * Throw {@link AutlanticBillingError} when verification fails.
 * Useful in Express / Next route handlers.
 */
export function assertBillingWebhook(
  secret: string,
  rawBody: string,
  signatureHeader: string | null | undefined,
): void {
  const result = verifyBillingWebhookDetailed(secret, rawBody, signatureHeader);
  if (result.ok) return;
  const code =
    result.reason === "missing_header" || result.reason === "empty_secret"
      ? "webhook_missing_header"
      : "webhook_invalid_signature";
  throw new AutlanticBillingError({
    message: `Webhook signature verification failed (${result.reason})`,
    code,
    type: "webhook_error",
    statusCode: 400,
    details: { reason: result.reason },
  });
}

export function parseBillingWebhookEvent(rawBody: string): BillingWebhookEvent | null {
  const result = parseBillingWebhookEventDetailed(rawBody);
  return result.ok ? result.event : null;
}

/** Parse webhook JSON with a structured failure reason. */
export function parseBillingWebhookEventDetailed(rawBody: string): WebhookParseResult {
  try {
    const parsed = JSON.parse(rawBody) as BillingWebhookEvent;
    if (!parsed?.type || !parsed.id) return { ok: false, reason: "missing_fields" };
    return { ok: true, event: parsed };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
