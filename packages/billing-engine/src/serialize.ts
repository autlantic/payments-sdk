import type {
  RecurringCustomer,
  RecurringInvoice,
  RecurringMandate,
  RecurringSubscription,
} from "@autlantic/payments-recurring-core";
import type { OneTimePayment } from "./one-time";
import type { PaymentLink } from "./payment-links";

export type BillingStoreSnapshot = {
  subscriptions: RecurringSubscription[];
  customers: RecurringCustomer[];
  mandates: RecurringMandate[];
  invoices: RecurringInvoice[];
  oneTimePayments?: OneTimePayment[];
  paymentLinks?: PaymentLink[];
};

const DATE_FIELDS_SUB = new Set([
  "currentPeriodStart",
  "currentPeriodEnd",
  "canceledAt",
  "createdAt",
  "updatedAt",
]);

const DATE_FIELDS_INV = new Set([
  "dueAt",
  "nextAttemptAt",
  "paidAt",
  "createdAt",
  "updatedAt",
]);

const DATE_FIELDS_MANDATE = new Set(["createdAt", "activatedAt"]);

const DATE_FIELDS_PAYMENT = new Set(["createdAt", "paidAt", "canceledAt"]);

const DATE_FIELDS_LINK = new Set(["createdAt", "expiresAt", "disabledAt"]);

function reviveDates<T extends Record<string, unknown>>(
  row: T,
  fields: Set<string>,
): T {
  const out = { ...row };
  for (const key of fields) {
    const value = out[key];
    if (typeof value === "string") {
      (out as Record<string, unknown>)[key] = new Date(value);
    }
  }
  return out;
}

export function serializeBillingSnapshot(
  snapshot: BillingStoreSnapshot,
): BillingStoreSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as BillingStoreSnapshot;
}

export function parseBillingSnapshot(raw: string): BillingStoreSnapshot {
  const parsed = JSON.parse(raw) as BillingStoreSnapshot;
  return {
    subscriptions: parsed.subscriptions.map((s) =>
      reviveDates(s as unknown as Record<string, unknown>, DATE_FIELDS_SUB),
    ) as RecurringSubscription[],
    customers: parsed.customers,
    mandates: parsed.mandates.map((m) =>
      reviveDates(m as unknown as Record<string, unknown>, DATE_FIELDS_MANDATE),
    ) as RecurringMandate[],
    invoices: parsed.invoices.map((i) =>
      reviveDates(i as unknown as Record<string, unknown>, DATE_FIELDS_INV),
    ) as RecurringInvoice[],
    oneTimePayments: (parsed.oneTimePayments ?? []).map((p) =>
      reviveDates(p as unknown as Record<string, unknown>, DATE_FIELDS_PAYMENT),
    ) as OneTimePayment[],
    paymentLinks: (parsed.paymentLinks ?? []).map((l) =>
      reviveDates(l as unknown as Record<string, unknown>, DATE_FIELDS_LINK),
    ) as PaymentLink[],
  };
}
