import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryBillingStore } from "./memory-store";
import {
  createPaymentLink,
  disablePaymentLink,
  openPaymentLink,
  resolvePaymentLinkStatus,
} from "./payment-links";

describe("payment links", () => {
  it("creates a link and mints a one-time payment on open", () => {
    const store = createMemoryBillingStore();
    const link = createPaymentLink(store, {
      merchantId: "mer_test",
      merchantRefPrefix: "invoice",
      payoutAddressEvm: "0x1111111111111111111111111111111111111111",
      amountUsdc: 42,
      chainId: 84532,
      description: "Consulting",
      mode: "test",
    });

    assert.equal(link.status, "active");
    assert.equal(link.useCount, 0);
    assert.match(link.id, /^plink_/);

    const opened = openPaymentLink(store, link.id, {
      customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    });
    assert.ok(!("error" in opened));
    if ("error" in opened) return;

    assert.equal(opened.payment.amountUsdc, 42);
    assert.equal(opened.payment.merchantRef, "invoice_1");
    assert.equal(opened.payment.metadata?.paymentLinkId, link.id);
    assert.equal(opened.paymentLink.useCount, 1);
    assert.equal(opened.events[0]?.type, "payment.created");
  });

  it("enforces maxUses and disable", () => {
    const store = createMemoryBillingStore();
    const link = createPaymentLink(store, {
      merchantId: "mer_test",
      merchantRefPrefix: "once",
      payoutAddressEvm: "0x1111111111111111111111111111111111111111",
      amountUsdc: 10,
      chainId: 84532,
      maxUses: 1,
    });

    const first = openPaymentLink(store, link.id, {
      customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    });
    assert.ok(!("error" in first));
    if ("error" in first) return;
    assert.equal(first.paymentLink.status, "expired");

    const second = openPaymentLink(store, link.id, {
      customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    });
    assert.ok("error" in second);

    const reusable = createPaymentLink(store, {
      merchantId: "mer_test",
      merchantRefPrefix: "multi",
      payoutAddressEvm: "0x1111111111111111111111111111111111111111",
      amountUsdc: 5,
      chainId: 84532,
    });
    disablePaymentLink(store, reusable.id);
    assert.equal(resolvePaymentLinkStatus(store.getPaymentLink(reusable.id)!), "disabled");
    const blocked = openPaymentLink(store, reusable.id, {
      customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    });
    assert.ok("error" in blocked);
  });
});
