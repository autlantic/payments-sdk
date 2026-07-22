/**
 * Sandbox smoke test (no web server required).
 * Run: pnpm test:e2e:recurring-billing
 */
import { AutlanticBilling, signBillingWebhook, verifyBillingWebhook } from "../src/index";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_e2e" });
const webhookSecret = "whsec_e2e_test";

const created = await billing.createSubscription({
  merchantRef: "e2e-test",
  customerWallet: "0x1111111111111111111111111111111111111111",
  payoutAddressEvm: "0x2222222222222222222222222222222222222222",
  amountUsdc: 19,
  interval: "month",
});

if (created.subscription.status !== "incomplete") {
  console.error("Expected incomplete subscription, got", created.subscription.status);
  process.exit(1);
}

const activated = await billing.activateSubscription(created.subscription.id);
if (!activated.charge?.ok || activated.subscription.status !== "active") {
  console.error("Activation failed", activated);
  process.exit(1);
}

const event = {
  type: "invoice.paid" as const,
  id: "evt_test",
  createdAt: new Date().toISOString(),
  data: {
    invoice: activated.charge.invoice,
    subscription: activated.subscription,
  },
};
const { body, signature } = signBillingWebhook(webhookSecret, event);
if (!verifyBillingWebhook(webhookSecret, body, signature)) {
  console.error("Webhook verify failed");
  process.exit(1);
}

console.log("recurring billing e2e ok");
console.log("  subscription:", activated.subscription.id, activated.subscription.status);
console.log("  invoice:", activated.charge.invoice.id, activated.charge.invoice.status);
console.log("  tx:", activated.charge.invoice.txHash?.slice(0, 18) + "…");
