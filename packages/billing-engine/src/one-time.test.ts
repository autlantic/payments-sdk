import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryBillingStore } from "./memory-store";
import {
  buildOneTimeCheckoutSessionView,
  confirmOneTimePayment,
  createOneTimePayment,
} from "./one-time";

describe("one-time payments", () => {
  it("creates open payment and confirms in sandbox", () => {
    const store = createMemoryBillingStore();
    const created = createOneTimePayment(store, {
      merchantId: "mer_test",
      merchantRef: "order_1",
      customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      payoutAddressEvm: "0x1111111111111111111111111111111111111111",
      amountUsdc: 25,
      chainId: 84532,
      productName: "Day pass",
    });

    assert.equal(created.payment.status, "open");
    assert.equal(created.events[0]?.type, "payment.created");

    const session = buildOneTimeCheckoutSessionView(store, created.payment.id, {
      sandbox: true,
      merchantDisplayName: "Acme",
    });
    assert.ok(session);
    assert.equal(session?.interval, "once");
    assert.match(session?.transferCalldata ?? "", /^0xa9059cbb/);

    const confirmed = confirmOneTimePayment(store, created.payment.id);
    assert.ok(confirmed);
    assert.equal(confirmed?.payment.status, "paid");
    assert.equal(confirmed?.events[0]?.type, "payment.paid");
    assert.equal(confirmed?.alreadyPaid, false);

    const again = confirmOneTimePayment(store, created.payment.id);
    assert.equal(again?.alreadyPaid, true);
  });
});
