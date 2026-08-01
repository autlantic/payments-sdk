# API reference - @autlantic/payments-recurring

## Test vs Live

For the hosted billing API, **mode comes from the API key**:

- `abk_test_…` → Test data plane, Base Sepolia, hosted checkout shows **Test**
- `abk_live_…` → Live data plane, Base mainnet, hosted checkout shows **Live**

Use a test key in staging and a live key in production (same env var names, different values). Webhook verification should use the signing secret from the matching Test or Live webhook endpoint in the portal.

`AUTLANTIC_BILLING_SANDBOX` is optional and mainly for in-process sandbox or local overrides. It is not the primary hosted Test/Live switch.

## `AutlanticBilling`

### Constructor / factories

```ts
new AutlanticBilling({
  apiBaseUrl?: string;
  apiKey?: string;
  merchantId: string;
  sandbox?: boolean;
  webhookSecret?: string;
});

AutlanticBilling.sandbox({ merchantId, webhookSecret? });
AutlanticBilling.fromEnv();
```

Env vars:

| Variable | Purpose |
|----------|---------|
| `AUTLANTIC_BILLING_API_URL` | Hosted API base URL |
| `AUTLANTIC_BILLING_API_KEY` | `abk_test_…` or `abk_live_…` |
| `AUTLANTIC_BILLING_MERCHANT_ID` | Merchant id |
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | Endpoint signing secret for this env |
| `AUTLANTIC_BILLING_SANDBOX` | Optional; in-process / local override |

### Methods

| Method | Description |
|--------|-------------|
| `createPayment(input)` | Create one-time USDC payment + hosted `/checkout/pay/:id` |
| `createPaymentLink(input)` | Create shareable payment link + `/checkout/link/:id` (URL / QR) |
| `listPaymentLinks()` | List payment links for the merchant |
| `getPaymentLink(id)` | Fetch a payment link |
| `disablePaymentLink(id)` | Disable a payment link |
| `openPaymentLink(id, { customerWallet })` | Mint a one-time payment from a link |
| `listProducts()` | List active catalog products and prices (hosted API, scoped to key mode) |
| `createSubscription(input)` | Create incomplete subscription + open invoice (`priceId` or `amountUsdc` + `interval`) |
| `listSubscriptions({ status? })` | List merchant subscriptions (key mode) |
| `getSubscription(id)` | Fetch subscription |
| `updateSubscription(id, input)` | Update amount, interval, plan, metadata |
| `getCheckoutSession(id)` | Fetch hosted checkout session JSON |
| `completeSubscription(id)` | Mark wallet mandate active (no charge) |
| `activateSubscription(id, { onChainSubscriptionId? })` | Complete mandate + first charge (test or live) |
| `cancelSubscription(id, immediate?)` | Cancel at period end or now (+ on-chain cancel via API) |
| `listInvoices({ subscriptionId? })` | List invoices (key mode) |
| `getInvoice(id)` | Fetch invoice |
| `chargeInvoice(id, sandboxMode?)` | Attempt invoice payment |
| `refundInvoice(id, { amountUsdc? })` | Refund a paid invoice |
| `voidInvoice(id)` | Void an open invoice |

### Webhooks

```ts
import { signBillingWebhook, verifyBillingWebhook, parseBillingWebhookEvent } from "@autlantic/payments-recurring";
```

Header: `x-autlantic-signature`

Events: `subscription.*`, `invoice.paid`, `invoice.payment_failed`, `invoice.refunded`, `invoice.voided`, `payment.*`

Verify with the **endpoint** secret from the portal for that mode.

### Idempotency

Pass `Idempotency-Key` on POST requests to the billing API. Replays return the cached response for 24 hours.

## Hosted billing API

Public docs: https://docs.autlantic.com/api/http

Public checkout (no API key; Test/Live from the session):

- `GET /checkout/subscribe/:id` — hosted HTML
- `GET /checkout/subscribe/:id.json` — session JSON
- `POST /checkout/subscribe/:id/activate` — test or live (live requires `{ onChainSubscriptionId }`)
- `GET /checkout/pay/:id` — one-time payment checkout
- `GET /checkout/link/:id` — payment link landing (opens into `/checkout/pay/:id`)
- `GET /checkout/link/:id/status` — link status JSON
- `POST /checkout/link/:id/open` — mint payment from link (`{ customerWallet? }`)

Authenticated (`X-Autlantic-Api-Key` / `x-autlantic-api-key`):

- `GET /v1/products` — list (`?` scoped to key mode)
- `POST /v1/payments` — create one-time payment
- `GET /v1/payments/:id`
- `POST /v1/payment-links` — create shareable payment link
- `GET /v1/payment-links` — list
- `GET /v1/payment-links/:id`
- `POST /v1/payment-links/:id/disable`
- `POST /v1/subscriptions` — create
- `GET /v1/subscriptions` — list (`?status=active`)
- `GET /v1/subscriptions/:id`
- `PATCH /v1/subscriptions/:id` — update plan/amount
- `POST /v1/subscriptions/:id/complete`
- `POST /v1/subscriptions/:id/activate` — live activate with `{ onChainSubscriptionId }`
- `POST /v1/subscriptions/:id/cancel`
- `GET /v1/invoices` — list (`?subscriptionId=`)
- `GET /v1/invoices/:id`
- `POST /v1/invoices/:id/charge`
- `POST /v1/invoices/:id/refund`
- `POST /v1/invoices/:id/void`
