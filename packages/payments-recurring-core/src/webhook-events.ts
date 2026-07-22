import type { BillingWebhookEvent, BillingWebhookEventType } from "./types";

export function createWebhookEvent<T extends BillingWebhookEventType>(
  type: T,
  data: Record<string, unknown>,
  id?: string,
): BillingWebhookEvent<T> {
  return {
    type,
    id: id ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    data,
  };
}

export const BILLING_WEBHOOK_SIGNATURE_HEADER = "x-autlantic-signature";
