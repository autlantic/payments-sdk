import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AutlanticBilling, signBillingWebhook, verifyBillingWebhook } from "./index";

describe("AutlanticBilling sandbox", () => {
  it("creates, completes, and charges a subscription", async () => {
    const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

    const created = await billing.createSubscription({
      merchantRef: "order_sdk_1",
      customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      payoutAddressEvm: "0x1111111111111111111111111111111111111111",
      amountUsdc: 25,
      interval: "month",
    });

    assert.equal(created.subscription.status, "incomplete");
    assert.ok(created.checkoutUrl?.includes(created.subscription.id));

    const activated = await billing.activateSubscription(created.subscription.id);
    assert.equal(activated.subscription.status, "active");
    assert.equal(activated.charge?.ok, true);
    assert.equal(activated.charge?.invoice.status, "paid");
  });

  it("creates and confirms a one-time payment", async () => {
    const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

    const created = await billing.createPayment({
      merchantRef: "order_pay_1",
      customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      payoutAddressEvm: "0x1111111111111111111111111111111111111111",
      amountUsdc: 15,
    });

    assert.equal(created.payment.status, "open");
    assert.ok(created.checkoutUrl?.includes(created.payment.id));

    const confirmed = await billing.confirmPayment(created.payment.id);
    assert.equal(confirmed.payment.status, "paid");
  });

  it("signs and verifies webhooks", () => {
    const event = {
      type: "invoice.paid" as const,
      id: "evt_test",
      createdAt: new Date().toISOString(),
      data: {},
    };
    const { body, signature } = signBillingWebhook("secret", event);
    assert.equal(verifyBillingWebhook("secret", body, signature), true);
    assert.equal(verifyBillingWebhook("wrong", body, signature), false);
  });
});
