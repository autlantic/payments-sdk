# Getting started

Autlantic Billing verifies **USDC** on **Base**: recurring subscriptions, one-time payments, and shareable payment links. Funds settle to **your** EVM wallet (`payoutAddressEvm`). Autlantic does not custody member revenue.

Test and Live work like Stripe: the **API key** selects the environment. Hosted checkout and data follow that key.

## Install

```bash
npm install @autlantic/payments-recurring
```

Published packages:

- [@autlantic/payments-recurring](https://www.npmjs.com/package/@autlantic/payments-recurring) - main client (recommended)
- [@autlantic/payments-recurring-core](https://www.npmjs.com/package/@autlantic/payments-recurring-core) - types and billing rules
- [@autlantic/chain-evm](https://www.npmjs.com/package/@autlantic/chain-evm) - Base + USDC adapter
- [@autlantic/billing-engine](https://www.npmjs.com/package/@autlantic/billing-engine) - subscriptions, invoices, payment links

Requires **Node.js 20+**.

## Test vs Live (hosted API)

| Deploy | API key | Chain | Checkout badge |
|--------|---------|-------|----------------|
| Local / staging | `abk_test_…` from the portal (Test mode) | Base Sepolia | Test |
| Production | `abk_live_…` from the portal (Live mode) | Base mainnet | Live |

Use the **same env var names** in every deploy. Change the values, not the names:

```bash
# Staging
AUTLANTIC_BILLING_API_KEY=abk_test_…
AUTLANTIC_BILLING_WEBHOOK_SECRET=whsec_…   # secret from your Test webhook endpoint

# Production
AUTLANTIC_BILLING_API_KEY=abk_live_…
AUTLANTIC_BILLING_WEBHOOK_SECRET=whsec_…   # secret from your Live webhook endpoint
```

Create keys and webhook endpoints in the [merchant portal](https://portal.autlantic.com) while Test or Live is selected. Do not put both test and live keys in one production app.

## Quickstart (subscription)

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.fromEnv();

const { products } = await billing.listProducts();
const priceId = products[0]?.prices[0]?.id;

const { subscription, checkoutUrl } = await billing.createSubscription({
  merchantRef: order.id,
  customerWallet: member.walletAddress,
  priceId,
});

// Send the customer to checkoutUrl (hosted Test or Live UI)
```

`activateSubscription` completes the wallet mandate and charges the first open invoice when you drive activation from your backend. Prefer hosted checkout for wallet UX.

## Quickstart (payment link)

Share a URL or QR. The payer connects a wallet on hosted checkout; USDC settles to your payout address.

```ts
const { paymentLink, url } = await billing.createPaymentLink({
  merchantRefPrefix: "invoice",
  payoutAddressEvm: creator.payoutAddressEvm,
  amountUsdc: 42,
  description: "Consulting",
  maxUses: 1, // optional single-use
});

// Share `url` (/checkout/link/:id) or encode as QR
```

You can also create links in the [merchant portal](https://portal.autlantic.com) under **Payment links**.

## Quickstart (in-process sandbox)

For local demos without the hosted API:

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

## Environment variables

| Variable | Purpose |
|----------|---------|
| `AUTLANTIC_BILLING_API_URL` | Hosted billing API base URL |
| `AUTLANTIC_BILLING_API_KEY` | `abk_test_…` or `abk_live_…` (mode comes from the key) |
| `AUTLANTIC_BILLING_MERCHANT_ID` | Your merchant id from the portal |
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | Signing secret from the matching Test or Live webhook endpoint |
| `AUTLANTIC_BILLING_SANDBOX` | Optional. Only for in-process / forcing sandbox locally. **Not** the primary Test/Live switch for hosted API |

```ts
const billing = AutlanticBilling.fromEnv();
```

## Hosted API alternative

If you prefer HTTP + API key over embedding Node, see [Hosted HTTP API](/api/http).

## Next steps

- [Test & Live](/guide/sandbox)
- [Webhooks](/guide/webhooks)
- [Node.js API reference](/api/nodejs)
- [Security](/guide/security)


## Next

- [15-minute integration](/guide/integration) — catalog → checkout → webhook → unlock
- [Local webhooks](/guide/local-webhooks) — tunnel to localhost
- [FAQ](/guide/faq) — Autlantic vs card processors
- [OpenAPI](/openapi.yaml) · [Postman](/postman/autlantic-billing.postman_collection.json)
