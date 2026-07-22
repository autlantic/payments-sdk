# API reference - @autlantic/payments-recurring v0.2.1

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

Env vars: `AUTLANTIC_BILLING_API_URL`, `AUTLANTIC_BILLING_API_KEY`, `AUTLANTIC_BILLING_MERCHANT_ID`, `AUTLANTIC_BILLING_SANDBOX`, `AUTLANTIC_BILLING_WEBHOOK_SECRET`

### Methods

| Method | Description |
|--------|-------------|
| `createSubscription(input)` | Create incomplete subscription + open invoice |
| `listSubscriptions({ status? })` | List merchant subscriptions |
| `getSubscription(id)` | Fetch subscription |
| `updateSubscription(id, input)` | Update amount, interval, plan, metadata |
| `getCheckoutSession(id)` | Fetch hosted checkout session JSON |
| `completeSubscription(id)` | Mark wallet mandate active (no charge) |
| `activateSubscription(id, { onChainSubscriptionId? })` | Complete mandate + first charge (sandbox or live) |
| `cancelSubscription(id, immediate?)` | Cancel at period end or now (+ on-chain cancel via API) |
| `listInvoices({ subscriptionId? })` | List invoices |
| `getInvoice(id)` | Fetch invoice |
| `chargeInvoice(id, sandboxMode?)` | Attempt invoice payment |
| `refundInvoice(id, { amountUsdc? })` | Refund a paid invoice |
| `voidInvoice(id)` | Void an open invoice |

### Webhooks

```ts
import { signBillingWebhook, verifyBillingWebhook, parseBillingWebhookEvent } from "@autlantic/payments-recurring";
```

Header: `x-autlantic-signature`

Events: `subscription.*`, `invoice.paid`, `invoice.payment_failed`, `invoice.refunded`, `invoice.voided`

### Idempotency

Pass `Idempotency-Key` on POST requests to the billing API. Replays return the cached response for 24 hours.

## Hosted billing API

See [docs/recurring-payments-spec.md](../../docs/recurring-payments-spec.md).

Public checkout (no API key):

- `GET /checkout/subscribe/:id` — hosted HTML
- `GET /checkout/subscribe/:id.json` — session JSON
- `POST /checkout/subscribe/:id/activate` — sandbox or live (live requires `{ onChainSubscriptionId }`)

Authenticated (`X-Autlantic-Api-Key`):

- `GET /v1/subscriptions` — list (`?status=active`)
- `POST /v1/subscriptions` — create
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
