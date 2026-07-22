import type { BillingWebhookEvent, RecurringSubscription, RecurringMandate } from "@autlantic/payments-recurring-core";
import { buildApproveTransaction, buildSubscribeTransaction, chainConfigFor, planRefBytes32 } from "@autlantic/chain-evm";
import { intervalPeriodSeconds } from "@autlantic/payments-recurring-core";
import { attemptInvoiceCharge } from "./charge";
import { completeMandate } from "./subscriptions";
import type { BillingStore, ChargeInvoiceResult, SandboxChargeMode } from "./types";

export type ActivateCheckoutResult = {
  subscription: RecurringSubscription;
  mandate: RecurringMandate;
  charge: ChargeInvoiceResult | null;
  events: BillingWebhookEvent[];
};

/** Complete wallet mandate and charge the first open invoice (initial checkout). */
export function activateSubscriptionCheckout(
  store: BillingStore,
  subscriptionId: string,
  options: { sandbox?: boolean; sandboxMode?: SandboxChargeMode } = {},
): ActivateCheckoutResult | null {
  const completed = completeMandate(store, subscriptionId);
  if (!completed) return null;

  const events: BillingWebhookEvent[] = [...completed.events];

  const openInvoice = store
    .listInvoicesBySubscription(subscriptionId)
    .find((inv) => inv.status === "open");

  if (!openInvoice) {
    return {
      subscription: completed.subscription,
      mandate: completed.mandate,
      charge: null,
      events,
    };
  }

  const charge = attemptInvoiceCharge(store, openInvoice.id, options);
  if (charge) {
    events.push(...charge.events);
  }

  return {
    subscription: charge?.subscription ?? completed.subscription,
    mandate: completed.mandate,
    charge,
    events,
  };
}

export type CheckoutSessionView = {
  subscriptionId: string;
  status: string;
  amountUsdc: number;
  interval: string;
  chainId: number;
  network: string;
  usdcAddress: string;
  vaultAddress: string;
  merchantPayout: string;
  customerWallet: string;
  allowanceCapUsdc: number;
  maxChargeUsdc: number;
  approveCalldata: string;
  subscribeCalldata: string;
  planRef: string;
  periodDurationSeconds: number;
  sandbox: boolean;
};

export function buildCheckoutSessionView(
  store: BillingStore,
  subscriptionId: string,
  input: { vaultAddress: string; sandbox: boolean },
): CheckoutSessionView | null {
  const subscription = store.getSubscription(subscriptionId);
  if (!subscription?.mandateId) return null;

  const mandate = store.getMandate(subscription.mandateId);
  if (!mandate) return null;

  const chain = chainConfigFor(subscription.chainId);
  const approve = buildApproveTransaction({
    chainId: subscription.chainId,
    vaultAddress: input.vaultAddress,
    allowanceCapUsdc: mandate.allowanceCapUsdc,
  });

  const planRef = planRefBytes32(subscription.planId ?? subscription.id);
  const periodDurationSeconds = intervalPeriodSeconds(subscription.interval);
  const subscribe = buildSubscribeTransaction({
    chainId: subscription.chainId,
    vaultAddress: input.vaultAddress,
    planRef,
    merchant: subscription.payoutAddressEvm,
    amountPerPeriodUsdc: subscription.amountUsdc,
    maxChargeUsdc: mandate.maxChargeUsdc,
    periodEndUnix: Math.floor(Date.now() / 1000),
    allowanceCapUsdc: mandate.allowanceCapUsdc,
    periodDurationSeconds,
  });

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    amountUsdc: subscription.amountUsdc,
    interval: subscription.interval,
    chainId: subscription.chainId,
    network: chain.name,
    usdcAddress: chain.usdcAddress,
    vaultAddress: mandate.spenderAddress,
    merchantPayout: subscription.payoutAddressEvm,
    customerWallet: subscription.walletAddress,
    allowanceCapUsdc: mandate.allowanceCapUsdc,
    maxChargeUsdc: mandate.maxChargeUsdc,
    approveCalldata: approve.data,
    subscribeCalldata: subscribe.data,
    planRef,
    periodDurationSeconds,
    sandbox: input.sandbox,
  };
}
