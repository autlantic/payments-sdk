/**
 * Sandbox smoke test for payment links (no web server required).
 * Run: pnpm test:e2e:payment-links
 */
import { AutlanticBilling, signBillingWebhook, verifyBillingWebhook } from "../src/index";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_e2e_links" });
const webhookSecret = "whsec_e2e_payment_links";
const payer = "0x1111111111111111111111111111111111111111";
const payout = "0x2222222222222222222222222222222222222222";

const created = await billing.createPaymentLink({
  merchantRefPrefix: "e2e-link",
  payoutAddressEvm: payout,
  amountUsdc: 27.5,
  description: "E2E payment link",
  maxUses: 2,
});

if (created.paymentLink.status !== "active") {
  console.error("Expected active payment link, got", created.paymentLink.status);
  process.exit(1);
}
if (!created.url.includes(created.paymentLink.id)) {
  console.error("Expected url to include link id", created.url, created.paymentLink.id);
  process.exit(1);
}

const listed = await billing.listPaymentLinks();
if (!listed.some((l) => l.id === created.paymentLink.id)) {
  console.error("Created link missing from listPaymentLinks");
  process.exit(1);
}

const opened = await billing.openPaymentLink(created.paymentLink.id, {
  customerWallet: payer,
});

if (opened.payment.status !== "open") {
  console.error("Expected open payment, got", opened.payment.status);
  process.exit(1);
}
if (opened.payment.amountUsdc !== 27.5) {
  console.error("Unexpected payment amount", opened.payment.amountUsdc);
  process.exit(1);
}
if (opened.payment.merchantRef !== "e2e-link_1") {
  console.error("Unexpected merchantRef", opened.payment.merchantRef);
  process.exit(1);
}
if (opened.payment.metadata?.paymentLinkId !== created.paymentLink.id) {
  console.error("Payment missing paymentLinkId metadata");
  process.exit(1);
}
if (!opened.checkoutUrl?.includes(opened.payment.id)) {
  console.error("Expected checkoutUrl to include payment id", opened.checkoutUrl);
  process.exit(1);
}
if (opened.paymentLink.useCount !== 1) {
  console.error("Expected useCount 1 after open, got", opened.paymentLink.useCount);
  process.exit(1);
}

const confirmed = await billing.confirmPayment(opened.payment.id);
if (confirmed.payment.status !== "paid") {
  console.error("Confirm failed", confirmed);
  process.exit(1);
}

const event = {
  type: "payment.paid" as const,
  id: "evt_payment_link_e2e",
  createdAt: new Date().toISOString(),
  data: { payment: confirmed.payment },
};
const { body, signature } = signBillingWebhook(webhookSecret, event);
if (!verifyBillingWebhook(webhookSecret, body, signature)) {
  console.error("Webhook verify failed");
  process.exit(1);
}

const second = await billing.openPaymentLink(created.paymentLink.id, {
  customerWallet: payer,
});
if ("error" in second || second.paymentLink.status !== "expired") {
  // maxUses: 2 → after second open the link should be expired
  if (!("error" in second) && second.paymentLink.useCount !== 2) {
    console.error("Expected useCount 2 after second open", second);
    process.exit(1);
  }
}
if (!("error" in second) && second.paymentLink.status !== "expired") {
  console.error("Expected link expired after maxUses, got", second.paymentLink.status);
  process.exit(1);
}

const blocked = await billing.openPaymentLink(created.paymentLink.id, {
  customerWallet: payer,
}).then(
  () => null,
  (err: unknown) => err,
);
if (!blocked) {
  console.error("Expected third open to fail after maxUses");
  process.exit(1);
}

const disabled = await billing.createPaymentLink({
  merchantRefPrefix: "e2e-disabled",
  payoutAddressEvm: payout,
  amountUsdc: 5,
});
await billing.disablePaymentLink(disabled.paymentLink.id);
const disabledOpen = await billing
  .openPaymentLink(disabled.paymentLink.id, { customerWallet: payer })
  .then(
    () => null,
    (err: unknown) => err,
  );
if (!disabledOpen) {
  console.error("Expected open on disabled link to fail");
  process.exit(1);
}

console.log("payment links e2e ok");
console.log("  link:", created.paymentLink.id, created.paymentLink.status);
console.log("  url:", created.url);
console.log("  payment:", confirmed.payment.id, confirmed.payment.status);
console.log("  tx:", confirmed.payment.txHash?.slice(0, 18) + "…");
