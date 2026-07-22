import type { BillingWebhookEvent, RecurringMandate, RecurringSubscription } from "@autlantic/payments-recurring-core";
import {
  findInvoiceByTxHash,
  isValidLiveChargeTxHash,
  setOnChainSubscriptionId,
} from "./on-chain";
import { attemptInvoiceCharge } from "./charge";
import type { ChargeInvoiceResult } from "./types";
import { completeMandate } from "./subscriptions";
import type { BillingStore } from "./types";

export type ActivateLiveResult = {
  subscription: RecurringSubscription;
  mandate: RecurringMandate;
  charge: ChargeInvoiceResult | null;
  events: BillingWebhookEvent[];
};

export function activateSubscriptionLive(
  store: BillingStore,
  subscriptionId: string,
  onChainSubscriptionId: string,
  txHash?: string,
): ActivateLiveResult | null {
  const linked = setOnChainSubscriptionId(store, subscriptionId, onChainSubscriptionId);
  if (!linked) return null;

  const mandateResult = completeMandate(store, subscriptionId);
  if (!mandateResult) return null;

  const events: BillingWebhookEvent[] = [...mandateResult.events];
  const openInvoice = store
    .listInvoicesBySubscription(subscriptionId)
    .find((inv) => inv.status === "open");

  if (!openInvoice) {
    return {
      subscription: mandateResult.subscription,
      mandate: mandateResult.mandate,
      charge: null,
      events,
    };
  }

  const normalizedTx = txHash?.trim();
  const canFinalizeInvoice =
    isValidLiveChargeTxHash(normalizedTx) &&
    !findInvoiceByTxHash(store, normalizedTx!, openInvoice.id);

  const charge = canFinalizeInvoice
    ? attemptInvoiceCharge(store, openInvoice.id, {
        sandbox: false,
        txHash: normalizedTx,
      })
    : null;

  if (charge) events.push(...charge.events);

  return {
    subscription: charge?.subscription ?? mandateResult.subscription,
    mandate: mandateResult.mandate,
    charge,
    events,
  };
}
