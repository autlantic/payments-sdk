import { createMemoryBillingStore } from "./memory-store";
import type { BillingStore, BillingStoreSnapshot } from "./types";
import type { OneTimePayment } from "./one-time";
import type {
  RecurringCustomer,
  RecurringInvoice,
  RecurringMandate,
  RecurringSubscription,
} from "@autlantic/payments-recurring-core";

export type BillingPersistAdapter = {
  saveSubscription(sub: RecurringSubscription): Promise<void>;
  saveCustomer(customer: RecurringCustomer): Promise<void>;
  saveMandate(mandate: RecurringMandate): Promise<void>;
  saveInvoice(invoice: RecurringInvoice): Promise<void>;
  saveOneTimePayment(payment: OneTimePayment): Promise<void>;
  loadSnapshot(): Promise<BillingStoreSnapshot>;
};

export function hydrateBillingStore(
  store: BillingStore,
  snapshot: BillingStoreSnapshot,
): void {
  for (const sub of snapshot.subscriptions) store.saveSubscription(sub);
  for (const customer of snapshot.customers) store.saveCustomer(customer);
  for (const mandate of snapshot.mandates) store.saveMandate(mandate);
  for (const invoice of snapshot.invoices) store.saveInvoice(invoice);
  for (const payment of snapshot.oneTimePayments ?? []) store.saveOneTimePayment(payment);
}

export function createWriteThroughBillingStore(
  memory: BillingStore,
  persist: BillingPersistAdapter,
): BillingStore {
  let persistQueue = Promise.resolve();

  const persistQueued = (label: string, fn: () => Promise<void>) => {
    persistQueue = persistQueue
      .then(fn)
      .catch((err) => {
        console.error(`[billing-store] persist ${label} failed`, err);
      });
  };

  return {
    saveSubscription(sub) {
      memory.saveSubscription(sub);
      persistQueued("subscription", () => persist.saveSubscription(sub));
    },
    getSubscription(id) {
      return memory.getSubscription(id);
    },
    listSubscriptionsByMerchant(merchantId) {
      return memory.listSubscriptionsByMerchant(merchantId);
    },
    listAllSubscriptions() {
      return memory.listAllSubscriptions();
    },
    saveCustomer(customer) {
      memory.saveCustomer(customer);
      persistQueued("customer", () => persist.saveCustomer(customer));
    },
    getCustomer(id) {
      return memory.getCustomer(id);
    },
    saveMandate(mandate) {
      memory.saveMandate(mandate);
      persistQueued("mandate", () => persist.saveMandate(mandate));
    },
    getMandate(id) {
      return memory.getMandate(id);
    },
    saveInvoice(invoice) {
      memory.saveInvoice(invoice);
      persistQueued("invoice", () => persist.saveInvoice(invoice));
    },
    getInvoice(id) {
      return memory.getInvoice(id);
    },
    listOpenInvoicesDueBefore(until) {
      return memory.listOpenInvoicesDueBefore(until);
    },
    listInvoicesBySubscription(subscriptionId) {
      return memory.listInvoicesBySubscription(subscriptionId);
    },
    listInvoicesByMerchant(merchantId) {
      return memory.listInvoicesByMerchant(merchantId);
    },
    saveOneTimePayment(payment) {
      memory.saveOneTimePayment(payment);
      persistQueued("oneTimePayment", () => persist.saveOneTimePayment(payment));
    },
    getOneTimePayment(id) {
      return memory.getOneTimePayment(id);
    },
    listOneTimePaymentsByMerchant(merchantId) {
      return memory.listOneTimePaymentsByMerchant(merchantId);
    },
    snapshot() {
      return memory.snapshot();
    },
  };
}

export async function createPersistedBillingStore(
  persist: BillingPersistAdapter,
): Promise<BillingStore> {
  const snapshot = await persist.loadSnapshot();
  const memory = createMemoryBillingStore(snapshot);
  return createWriteThroughBillingStore(memory, persist);
}

export async function reloadPersistedBillingStore(
  store: BillingStore,
  persist: BillingPersistAdapter,
): Promise<void> {
  const snapshot = await persist.loadSnapshot();
  const fresh = createMemoryBillingStore();
  hydrateBillingStore(fresh, snapshot);
  const next = fresh.snapshot();
  hydrateBillingStore(store, next);
}
