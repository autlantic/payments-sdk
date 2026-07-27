# API reference - @autlantic/payments-recurring 0.2.6

Canonical docs: [docs.autlantic.com/api/nodejs](https://docs.autlantic.com/api/nodejs)

Also see:

- [TypeScript types](https://docs.autlantic.com/api/types)
- [Error codes](https://docs.autlantic.com/guide/errors)
- [Retries](https://docs.autlantic.com/guide/retries)
- [Lifecycle](https://docs.autlantic.com/guide/lifecycle)
- [Changelog](https://docs.autlantic.com/resources/changelog)

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
| `listProducts()` | List active catalog products and prices (hosted API) |
| `createSubscription(input)` | Create incomplete subscription + open invoice (`priceId` or `amountUsdc` + `interval`) |
| `listSubscriptions({ status? })` | List merchant subscriptions |
| `getSubscription(id)` | Fetch subscription |
| `updateSubscription(id, input)` | Update amount, interval, plan, metadata |
| `getCheckoutSession(id)` | Fetch hosted checkout session JSON |
| `completeSubscription(id)` | Mark wallet mandate active (no charge) |
| `activateSubscription(id, { onChainSubscriptionId? })` | Complete mandate + first charge |
| `cancelSubscription(id, immediate?)` | Cancel at period end or now |
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

Events: `subscription.*`, `invoice.created`, `invoice.paid`, `invoice.payment_failed`, `invoice.refunded`, `invoice.voided`

### Idempotency

Pass `Idempotency-Key` on POST requests to the billing API. Replays return the cached response for 24 hours.

## Hosted billing API

The hosted HTTP surface is operated by Autlantic (or a compatible deployment). See [docs.autlantic.com/api/http](https://docs.autlantic.com/api/http).
