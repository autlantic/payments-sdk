<p align="center">
  <img src="https://autlantic.com/brand/autlantic-icon-1024-master.png" alt="Autlantic" width="96" height="96" />
</p>

<h1 align="center">@autlantic/payments-recurring</h1>

<p align="center">
  <img src="https://autlantic.com/brand/autlantic-wordmark-800-light.png" alt="Autlantic" width="200" />
</p>

<p align="center">
  <strong>Autlantic Billing</strong>. TypeScript SDK for USDC recurring subscriptions on Base.
</p>

<p align="center">
  <a href="https://docs.autlantic.com"><img src="https://img.shields.io/badge/docs-docs.autlantic.com-5672cd?style=flat-square" alt="Docs" /></a>
  <a href="https://www.npmjs.com/package/@autlantic/payments-recurring"><img src="https://img.shields.io/npm/v/@autlantic/payments-recurring?style=flat-square&color=5672cd" alt="npm" /></a>
  <a href="https://github.com/autlantic/payments-sdk/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT" /></a>
  <a href="https://autlantic.com"><img src="https://img.shields.io/badge/product-autlantic.com-111827?style=flat-square" alt="Autlantic" /></a>
</p>

---

The same billing engine that powers [Autlantic](https://autlantic.com) creator memberships:

- Recurring **USDC** on **Base**
- Direct settlement to your `payoutAddressEvm` (Autlantic does not custody subscription revenue)
- Sandbox mode, signed webhooks, and a hosted HTTP API option

## Install

```bash
npm install @autlantic/payments-recurring
```

Requires **Node.js 20+**.

## Quick start (sandbox)

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

const { subscription } = await billing.createSubscription({
  merchantRef: "order_123",
  customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  payoutAddressEvm: "0xYourMerchantWallet",
  amountUsdc: 20,
  interval: "month",
});

// Completes the wallet mandate and charges the first open invoice.
const { charge } = await billing.activateSubscription(subscription.id);

if (charge?.invoice.status === "paid") {
  // Unlock access for your customer
}
```

> Do not call `chargeInvoice` on that same first invoice after `activateSubscription`. Use `chargeInvoice` for later renewals, or after `completeSubscription` when you want mandate and charge as separate steps.

## Hosted API

```ts
const billing = AutlanticBilling.fromEnv();
// AUTLANTIC_BILLING_API_URL
// AUTLANTIC_BILLING_API_KEY
// AUTLANTIC_BILLING_MERCHANT_ID
// AUTLANTIC_BILLING_SANDBOX
// AUTLANTIC_BILLING_WEBHOOK_SECRET
```

## Webhooks

```ts
import {
  verifyBillingWebhook,
  parseBillingWebhookEvent,
} from "@autlantic/payments-recurring";

const ok = verifyBillingWebhook(
  rawBody,
  signatureHeader,
  process.env.AUTLANTIC_BILLING_WEBHOOK_SECRET!,
);
if (!ok) throw new Error("Invalid signature");

const event = parseBillingWebhookEvent(JSON.parse(rawBody));
```

Header: `x-autlantic-signature`. Always verify against the **raw** request body.

## Related packages

| Package | Role |
|---------|------|
| `@autlantic/payments-recurring` | Merchant client (this package) |
| `@autlantic/payments-recurring-core` | Types, intervals, retry policy |
| `@autlantic/chain-evm` | Base + USDC + vault helpers |
| `@autlantic/billing-engine` | Subscription and invoice engine |

## Documentation

| Resource | Link |
|----------|------|
| Guides | [docs.autlantic.com](https://docs.autlantic.com) |
| Getting started | [Getting started](https://docs.autlantic.com/guide/getting-started) |
| Node.js API | [API reference](https://docs.autlantic.com/api/nodejs) |
| Security | [SECURITY.md](https://github.com/autlantic/payments-sdk/blob/main/SECURITY.md) |
| Source | [github.com/autlantic/payments-sdk](https://github.com/autlantic/payments-sdk) |

## Brand

Autlantic marks: [autlantic.com/brand](https://autlantic.com/brand/autlantic-icon-1024-master.png). See [SECURITY.md](https://github.com/autlantic/payments-sdk/blob/main/SECURITY.md#brand-and-trademarks).

## License

[MIT](https://github.com/autlantic/payments-sdk/blob/main/LICENSE) © Autlantic

Support: [support@autlantic.com](mailto:support@autlantic.com)
