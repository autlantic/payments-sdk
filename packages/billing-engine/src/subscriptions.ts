import {
  createWebhookEvent,
  defaultAllowanceCapUsdc,
  nextPeriodEnd,
  periodEndFromStart,
  assertPositiveAmountUsdc,
  normalizeEvmAddress,
  type BillingWebhookEvent,
  type CreateSubscriptionInput,
  type RecurringCustomer,
  type RecurringInvoice,
  type RecurringMandate,
  type RecurringSubscription,
} from "@autlantic/payments-recurring-core";
import { newId } from "./id";
import type { BillingStore, CreateSubscriptionResult } from "./types";

export function createSubscription(
  store: BillingStore,
  input: CreateSubscriptionInput,
): CreateSubscriptionResult {
  assertPositiveAmountUsdc(input.amountUsdc);
  const walletAddress = normalizeEvmAddress(input.walletAddress);
  const payoutAddressEvm = normalizeEvmAddress(input.payoutAddressEvm);
  const vaultAddress = normalizeEvmAddress(input.vaultAddress);

  const now = new Date();
  const customerId = newId("cus");
  const subscriptionId = newId("sub");
  const mandateId = newId("mdt");
  const invoiceId = newId("inv");

  const allowanceCapUsdc =
    input.allowanceCapUsdc ?? defaultAllowanceCapUsdc(input.amountUsdc, input.interval);
  const maxChargeUsdc = input.maxChargeUsdc ?? input.amountUsdc;

  const customer: RecurringCustomer = {
    id: customerId,
    merchantId: input.merchantId,
    walletAddress,
  };

  const periodStart = now;
  const periodEnd = periodEndFromStart(periodStart, input.interval);

  const mandate: RecurringMandate = {
    id: mandateId,
    subscriptionId,
    walletAddress,
    spenderAddress: vaultAddress,
    chainId: input.chainId,
    allowanceCapUsdc,
    maxChargeUsdc,
    status: "pending",
    createdAt: now,
  };

  const subscription: RecurringSubscription = {
    id: subscriptionId,
    merchantId: input.merchantId,
    merchantRef: input.merchantRef,
    customerId,
    planId: input.planId,
    payoutAddressEvm,
    walletAddress,
    amountUsdc: input.amountUsdc,
    interval: input.interval,
    chainId: input.chainId,
    status: "incomplete",
    mandateId,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now,
  };

  const invoice: RecurringInvoice = {
    id: invoiceId,
    subscriptionId,
    merchantId: input.merchantId,
    status: "open",
    amountUsdc: input.amountUsdc,
    dueAt: now,
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  store.saveCustomer(customer);
  store.saveSubscription(subscription);
  store.saveMandate(mandate);
  store.saveInvoice(invoice);

  const events = [
    createWebhookEvent("subscription.created", { subscription }),
    createWebhookEvent("invoice.created", { invoice }),
  ];

  return { subscription, invoice, mandate, events };
}

export function completeMandate(
  store: BillingStore,
  subscriptionId: string,
): { subscription: RecurringSubscription; mandate: RecurringMandate; events: BillingWebhookEvent[] } | null {
  const subscription = store.getSubscription(subscriptionId);
  if (!subscription?.mandateId) return null;

  const mandate = store.getMandate(subscription.mandateId);
  if (!mandate || mandate.status !== "pending") return null;

  const now = new Date();
  const updatedMandate: RecurringMandate = {
    ...mandate,
    status: "active",
    activatedAt: now,
  };

  const updatedSub: RecurringSubscription = {
    ...subscription,
    updatedAt: now,
  };

  store.saveMandate(updatedMandate);
  store.saveSubscription(updatedSub);

  return {
    subscription: updatedSub,
    mandate: updatedMandate,
    events: [
      createWebhookEvent("subscription.activated", {
        subscription: updatedSub,
        mandate: updatedMandate,
      }),
    ],
  };
}

export function cancelSubscription(
  store: BillingStore,
  subscriptionId: string,
  immediate = false,
): { subscription: RecurringSubscription; events: BillingWebhookEvent[] } | null {
  const subscription = store.getSubscription(subscriptionId);
  if (!subscription || subscription.status === "canceled") return null;

  const now = new Date();
  const updated: RecurringSubscription = immediate
    ? {
        ...subscription,
        status: "canceled",
        cancelAtPeriodEnd: false,
        canceledAt: now,
        updatedAt: now,
      }
    : {
        ...subscription,
        cancelAtPeriodEnd: true,
        updatedAt: now,
      };

  store.saveSubscription(updated);

  return {
    subscription: updated,
    events: [createWebhookEvent("subscription.canceled", { subscription: updated })],
  };
}

export function createRenewalInvoice(
  store: BillingStore,
  subscriptionId: string,
): RecurringInvoice | null {
  const subscription = store.getSubscription(subscriptionId);
  if (!subscription || subscription.status !== "active") return null;
  if (subscription.cancelAtPeriodEnd) return null;

  const now = new Date();
  const invoice: RecurringInvoice = {
    id: newId("inv"),
    subscriptionId,
    merchantId: subscription.merchantId,
    status: "open",
    amountUsdc: subscription.amountUsdc,
    dueAt: subscription.currentPeriodEnd,
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  store.saveInvoice(invoice);
  return invoice;
}

/** Create renewal invoice and return webhook event for dispatch. */
export function createRenewalInvoiceWithEvent(
  store: BillingStore,
  subscriptionId: string,
): { invoice: RecurringInvoice; events: BillingWebhookEvent[] } | null {
  const subscription = store.getSubscription(subscriptionId);
  if (!subscription) return null;

  const invoice = createRenewalInvoice(store, subscriptionId);
  if (!invoice) return null;

  return {
    invoice,
    events: [createWebhookEvent("invoice.created", { invoice, subscription })],
  };
}

export function advanceSubscriptionPeriod(
  subscription: RecurringSubscription,
): RecurringSubscription {
  const nextEnd = nextPeriodEnd(subscription.currentPeriodEnd, subscription.interval);
  return {
    ...subscription,
    currentPeriodStart: subscription.currentPeriodEnd,
    currentPeriodEnd: nextEnd,
    updatedAt: new Date(),
  };
}

/** Update customer wallet on an incomplete subscription (checkout wallet change). */
export function updateSubscriptionCustomerWallet(
  store: BillingStore,
  subscriptionId: string,
  walletAddress: string,
): RecurringSubscription | null {
  const subscription = store.getSubscription(subscriptionId);
  if (!subscription || subscription.status !== "incomplete") return null;

  const normalized = normalizeEvmAddress(walletAddress);
  const now = new Date();

  const customer = store.getCustomer(subscription.customerId);
  if (customer) {
    store.saveCustomer({ ...customer, walletAddress: normalized });
  }

  if (subscription.mandateId) {
    const mandate = store.getMandate(subscription.mandateId);
    if (mandate && mandate.status === "pending") {
      store.saveMandate({ ...mandate, walletAddress: normalized });
    }
  }

  const updated: RecurringSubscription = {
    ...subscription,
    walletAddress: normalized,
    updatedAt: now,
  };
  store.saveSubscription(updated);
  return updated;
}
