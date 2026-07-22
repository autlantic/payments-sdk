# Getting started

Autlantic Billing verifies **USDC** subscriptions on **Base**. Funds settle to **your** EVM wallet (`payoutAddressEvm`). Autlantic does not custody member revenue.

## Install

```bash
npm install @autlantic/payments-recurring@^0.2.5
```

Published packages (see [Packages](/guide/packages) for versions):

- [@autlantic/payments-recurring](https://www.npmjs.com/package/@autlantic/payments-recurring) - main client (recommended)
- [@autlantic/payments-recurring-core](https://www.npmjs.com/package/@autlantic/payments-recurring-core) - types and billing rules
- [@autlantic/chain-evm](https://www.npmjs.com/package/@autlantic/chain-evm) - Base + USDC adapter
- [@autlantic/billing-engine](https://www.npmjs.com/package/@autlantic/billing-engine) - subscriptions and invoices

Source: [github.com/autlantic/payments-sdk](https://github.com/autlantic/payments-sdk). Requires **Node.js 20+**.

## Quickstart (sandbox)

`activateSubscription` completes the wallet mandate and charges the first open invoice. Do not call `chargeInvoice` on that same invoice afterward.

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

const { subscription } = await billing.createSubscription({
  merchantRef: order.id,
  customerWallet: member.walletAddress,
  payoutAddressEvm: creator.payoutAddressEvm,
  amountUsdc: 20,
  interval: "month",
});

const { charge } = await billing.activateSubscription(subscription.id);
if (charge?.invoice.status === "paid") {
  await markMembershipActive(order.id);
}
```

Use `chargeInvoice` later for renewals or after `completeSubscription` when you want mandate and charge as separate steps.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `AUTLANTIC_BILLING_API_URL` | Hosted billing API base URL (issued with your API key) |
| `AUTLANTIC_BILLING_API_KEY` | API key for authenticated routes |
| `AUTLANTIC_BILLING_MERCHANT_ID` | Default merchant id |
| `AUTLANTIC_BILLING_SANDBOX` | `true` / `1` for sandbox mode |
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | HMAC secret for `x-autlantic-signature` |

```ts
const billing = AutlanticBilling.fromEnv();
```

For local demos without a remote API, use `AutlanticBilling.sandbox()` instead of `fromEnv()`.

## Hosted API alternative

If you prefer HTTP + API key over embedding Node, see [Hosted HTTP API](/api/http). Autlantic provides the base URL and credentials when you enable hosted billing.

## Next steps

- [Lifecycle](/guide/lifecycle) (diagrams + activate vs renew)
- [Error codes](/guide/errors) and [Retries](/guide/retries)
- [TypeScript types](/api/types)
- [Sandbox & testing](/guide/sandbox)
- [Webhooks](/guide/webhooks)
- [Node.js API reference](/api/nodejs)
- [Changelog](/resources/changelog)
- [Security](/guide/security)
