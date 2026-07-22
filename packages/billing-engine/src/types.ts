import type {
  BillingWebhookEvent,
  RecurringCustomer,
  RecurringInvoice,
  RecurringMandate,
  RecurringSubscription,
} from "@autlantic/payments-recurring-core";

export type BillingStoreSnapshot = {
  subscriptions: RecurringSubscription[];
  customers: RecurringCustomer[];
  mandates: RecurringMandate[];
  invoices: RecurringInvoice[];
};

export type BillingStore = {
  saveSubscription(sub: RecurringSubscription): void;
  getSubscription(id: string): RecurringSubscription | null;
  listSubscriptionsByMerchant(merchantId: string): RecurringSubscription[];
  listAllSubscriptions(): RecurringSubscription[];

  saveCustomer(customer: RecurringCustomer): void;
  getCustomer(id: string): RecurringCustomer | null;

  saveMandate(mandate: RecurringMandate): void;
  getMandate(id: string): RecurringMandate | null;

  saveInvoice(invoice: RecurringInvoice): void;
  getInvoice(id: string): RecurringInvoice | null;
  listOpenInvoicesDueBefore(until: Date): RecurringInvoice[];
  listInvoicesBySubscription(subscriptionId: string): RecurringInvoice[];
  listInvoicesByMerchant(merchantId: string): RecurringInvoice[];

  snapshot(): BillingStoreSnapshot;
};

export type CreateSubscriptionResult = {
  subscription: RecurringSubscription;
  invoice: RecurringInvoice;
  mandate: RecurringMandate;
  events: BillingWebhookEvent[];
};

export type CompleteMandateResult = {
  subscription: RecurringSubscription;
  mandate: RecurringMandate;
  events: BillingWebhookEvent[];
};

export type ChargeInvoiceResult = {
  invoice: RecurringInvoice;
  subscription: RecurringSubscription;
  events: BillingWebhookEvent[];
  ok: boolean;
};

export type CancelSubscriptionResult = {
  subscription: RecurringSubscription;
  events: BillingWebhookEvent[];
};

export type SandboxChargeMode = "success" | "insufficient_balance" | "allowance_revoked";
