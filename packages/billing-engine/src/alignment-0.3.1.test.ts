import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  chainIdForBillingMode,
  defaultSandboxChainId,
  VAULT_PLACEHOLDER_BASE_SEPOLIA,
} from "@autlantic/chain-evm";
import {
  attemptInvoiceCharge,
  buildCheckoutSessionView,
  cancelSubscription,
  completeMandate,
  createMemoryBillingStore,
  createOneTimePayment,
  createPaymentLink,
  createRenewalInvoice,
  createSubscription,
  openPaymentLink,
  processDueInvoices,
  resumeSubscription,
} from "./index";

const WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const PAYOUT = "0x1111111111111111111111111111111111111111";

describe("0.3.1 hosted alignment", () => {
  it("maps chainIdForBillingMode test/live", () => {
    assert.equal(chainIdForBillingMode("test"), 84532);
    assert.equal(chainIdForBillingMode("live"), 8453);
  });

  it("stamps mode on subscription, invoice, and one-time payment", () => {
    const store = createMemoryBillingStore();
    const { subscription, invoice } = createSubscription(store, {
      merchantId: "mer_test",
      merchantRef: "mode_sub",
      walletAddress: WALLET,
      payoutAddressEvm: PAYOUT,
      amountUsdc: 20,
      interval: "month",
      chainId: defaultSandboxChainId(),
      vaultAddress: VAULT_PLACEHOLDER_BASE_SEPOLIA,
      mode: "live",
    });
    assert.equal(subscription.mode, "live");
    assert.equal(invoice.mode, "live");

    const { payment } = createOneTimePayment(store, {
      merchantId: "mer_test",
      merchantRef: "mode_pay",
      customerWallet: WALLET,
      payoutAddressEvm: PAYOUT,
      amountUsdc: 5,
      chainId: defaultSandboxChainId(),
      mode: "test",
    });
    assert.equal(payment.mode, "test");
  });

  it("resumes cancel-at-period-end subscriptions", () => {
    const store = createMemoryBillingStore();
    const { subscription, invoice } = createSubscription(store, {
      merchantId: "mer_test",
      merchantRef: "resume_1",
      walletAddress: WALLET,
      payoutAddressEvm: PAYOUT,
      amountUsdc: 10,
      interval: "month",
      chainId: defaultSandboxChainId(),
      vaultAddress: VAULT_PLACEHOLDER_BASE_SEPOLIA,
      mode: "test",
    });
    completeMandate(store, subscription.id);
    assert.equal(attemptInvoiceCharge(store, invoice.id, { sandbox: true })?.ok, true);

    const canceled = cancelSubscription(store, subscription.id, false);
    assert.equal(canceled?.subscription.cancelAtPeriodEnd, true);

    const resumed = resumeSubscription(store, subscription.id);
    assert.ok(resumed);
    assert.equal(resumed.subscription.cancelAtPeriodEnd, false);
    assert.equal(resumed.subscription.status, "active");

    const renewal = createRenewalInvoice(store, subscription.id);
    assert.ok(renewal, "renewal should be allowed after resume");
  });

  it("filters processDueInvoices by mode", () => {
    const store = createMemoryBillingStore();
    const testSub = createSubscription(store, {
      merchantId: "mer_test",
      merchantRef: "due_test",
      walletAddress: WALLET,
      payoutAddressEvm: PAYOUT,
      amountUsdc: 8,
      interval: "month",
      chainId: defaultSandboxChainId(),
      vaultAddress: VAULT_PLACEHOLDER_BASE_SEPOLIA,
      mode: "test",
    });
    const liveSub = createSubscription(store, {
      merchantId: "mer_test",
      merchantRef: "due_live",
      walletAddress: WALLET,
      payoutAddressEvm: PAYOUT,
      amountUsdc: 9,
      interval: "month",
      chainId: defaultSandboxChainId(),
      vaultAddress: VAULT_PLACEHOLDER_BASE_SEPOLIA,
      mode: "live",
    });
    completeMandate(store, testSub.subscription.id);
    completeMandate(store, liveSub.subscription.id);

    const until = new Date(Date.now() + 60_000);
    const testOnly = processDueInvoices(store, until, { sandbox: true, mode: "test" });
    assert.equal(testOnly.length, 1);
    assert.equal(testOnly[0]?.invoice.id, testSub.invoice.id);

    const liveOnly = processDueInvoices(store, until, { sandbox: true, mode: "live" });
    assert.equal(liveOnly.length, 1);
    assert.equal(liveOnly[0]?.invoice.id, liveSub.invoice.id);
  });

  it("exposes coupon and merchant fields on checkout session", () => {
    const store = createMemoryBillingStore();
    const { subscription } = createSubscription(store, {
      merchantId: "mer_test",
      merchantRef: "checkout_1",
      walletAddress: WALLET,
      payoutAddressEvm: PAYOUT,
      amountUsdc: 50,
      interval: "month",
      chainId: defaultSandboxChainId(),
      vaultAddress: VAULT_PLACEHOLDER_BASE_SEPOLIA,
      metadata: {
        listAmountUsdc: "100",
        couponCode: "SAVE50",
        couponLabel: "50% off",
      },
    });
    completeMandate(store, subscription.id);
    const session = buildCheckoutSessionView(store, subscription.id, {
      vaultAddress: VAULT_PLACEHOLDER_BASE_SEPOLIA,
      sandbox: true,
      merchantDisplayName: "Demo Shop",
      merchantLogoUrl: "https://example.com/logo.png",
      merchantWebsiteUrl: "https://example.com",
    });
    assert.ok(session);
    assert.equal(session.listAmountUsdc, 100);
    assert.equal(session.couponCode, "SAVE50");
    assert.equal(session.couponLabel, "50% off");
    assert.equal(session.merchantDisplayName, "Demo Shop");
    assert.ok(session.nextPaymentAt);
  });

  it("stamps payment link mode onto minted one-time payment", () => {
    const store = createMemoryBillingStore();
    const link = createPaymentLink(store, {
      merchantId: "mer_test",
      merchantRefPrefix: "plink_mode",
      payoutAddressEvm: PAYOUT,
      amountUsdc: 12,
      chainId: defaultSandboxChainId(),
      mode: "live",
    });
    const opened = openPaymentLink(store, link.id, { customerWallet: WALLET });
    assert.ok(!("error" in opened));
    if ("error" in opened) return;
    assert.equal(opened.payment.mode, "live");
  });
});
