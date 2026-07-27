# Node.js SDK

`@autlantic/payments-recurring` **0.2.7** (related packages: `payments-recurring-core`, `chain-evm`, and `billing-engine` at **0.2.5**).

Typed domain models: [TypeScript types](/api/types).  
HTTP twin: [Hosted HTTP API](/api/http).

## Install

```bash
npm install @autlantic/payments-recurring@^0.2.7
```

```ts
import {
  AutlanticBilling,
  AUTLANTIC_BILLING_SDK_VERSION,
  type CreateSubscriptionRequest,
  type CreatePaymentRequest,
  type RecurringSubscription,
  type OneTimePayment,
} from "@autlantic/payments-recurring";
```

`AUTLANTIC_BILLING_SDK_VERSION` is the string `"0.2.7"`.

## `AutlanticBilling`

### Factories

```ts
new AutlanticBilling({
  apiBaseUrl?: string;   // omit for in-process sandbox
  apiKey?: string;
  merchantId: string;
  sandbox?: boolean;
  webhookSecret?: string;
});

AutlanticBilling.sandbox({ merchantId, webhookSecret? });
AutlanticBilling.fromEnv();
```

| Factory | Behavior |
|---------|----------|
| `sandbox(...)` | In-memory store. No remote API. |
| `fromEnv()` | Uses env vars below. Remote if `AUTLANTIC_BILLING_API_URL` is set. |
| `new AutlanticBilling({...})` | Explicit config. |

Env vars: `AUTLANTIC_BILLING_API_URL`, `AUTLANTIC_BILLING_API_KEY`, `AUTLANTIC_BILLING_MERCHANT_ID`, `AUTLANTIC_BILLING_SANDBOX`, `AUTLANTIC_BILLING_WEBHOOK_SECRET`

### `createSubscription` input

Provide either a catalog `priceId` (hosted API) or ad-hoc `amountUsdc` + `interval` (sandbox / custom amounts).

```ts
type CreateSubscriptionRequest = {
  merchantRef: string;
  customerWallet: string;
  payoutAddressEvm: string;
  amountUsdc?: number;
  interval?: "month" | "year";
  priceId?: string;
  planId?: string;
  metadata?: Record<string, string>;
};
```

Returns subscription + first open invoice (and `checkoutUrl` when using the hosted API or sandbox).

### `createPayment` input

Provide either a catalog `priceId` with interval `once`, or ad-hoc `amountUsdc`.

```ts
type CreatePaymentRequest = {
  merchantRef: string;
  customerWallet: string;
  payoutAddressEvm: string;
  amountUsdc?: number;
  priceId?: string;
  metadata?: Record<string, string>;
};
```

Returns payment + `checkoutUrl` (`/checkout/pay/:id` hosted, or `sandbox://pay/...`). See [One-time payments](/guide/one-time-payments).

### Methods

| Method | Returns (conceptually) | Description |
|--------|------------------------|-------------|
| `listProducts()` | `{ products }` | Active catalog products and prices (hosted API; empty in sandbox) |
| `createSubscription(input)` | `{ subscription, invoice, checkoutUrl? }` | Create incomplete subscription + open invoice |
| `createPayment(input)` | `{ payment, checkoutUrl? }` | Create one-time payment |
| `getPayment(id)` | payment | Fetch one-time payment |
| `confirmPayment(id, { txHash? })` | `{ payment, alreadyPaid? }` | Sandbox mark paid, or confirm hosted checkout |
| `listSubscriptions({ status? })` | `{ subscriptions }` | List merchant subscriptions |
| `getSubscription(id)` | `{ subscription }` | Fetch subscription |
| `updateSubscription(id, input)` | `{ subscription }` | Update amount, interval, plan, metadata |
| `getCheckoutSession(id)` | `{ session }` | Hosted checkout session JSON (remote) |
| `completeSubscription(id)` | `{ subscription }` | Mark wallet mandate active (**no** charge) |
| `activateSubscription(id, { onChainSubscriptionId? })` | `{ subscription, charge, txHash? }` | Complete mandate **+ first charge** |
| `cancelSubscription(id, immediate?)` | `{ subscription }` | Cancel at period end or now |
| `listInvoices({ subscriptionId? })` | `{ invoices }` | List invoices |
| `getInvoice(id)` | `{ invoice }` | Fetch invoice |
| `chargeInvoice(id, sandboxMode?)` | charge result | Attempt invoice payment / renewal |
| `refundInvoice(id, { amountUsdc? })` | refund result | Refund a paid invoice |
| `voidInvoice(id)` | void result | Void an open invoice |

`sandboxMode` for `chargeInvoice`: `"success" | "insufficient_balance" | "allowance_revoked"` (in-process sandbox only).

### Activate vs charge

```ts
const { subscription } = await billing.createSubscription({ /* ... */ });
const { charge } = await billing.activateSubscription(subscription.id);
// charge pays the first invoice. Do not chargeInvoice that same invoice again.

// Later renewals:
await billing.chargeInvoice(renewalInvoiceId);
```

See [Lifecycle](/guide/lifecycle).

### Errors

- Transport / API failures: thrown `Error` with message.
- Soft charge declines: invoice `failureCode` ([Error codes](/guide/errors)) and `invoice.payment_failed` webhooks.
- Exhausted retries: [Retries](/guide/retries) → `past_due`.

### Webhooks helpers

```ts
import {
  signBillingWebhook,
  verifyBillingWebhook,
  parseBillingWebhookEvent,
  BILLING_WEBHOOK_SIGNATURE_HEADER,
} from "@autlantic/payments-recurring";
```

Header name: `x-autlantic-signature` (`BILLING_WEBHOOK_SIGNATURE_HEADER`).

### Idempotency

Pass `Idempotency-Key` on POST requests to the hosted billing API. Replays return the cached response for 24 hours.

### Re-exported chain helpers

```ts
import {
  defaultSandboxChainId,
  chainConfigFor,
  usdcToMicro,
  encodeApproveCalldata,
} from "@autlantic/payments-recurring";
```

## Next

- [TypeScript types](/api/types)
- [Hosted HTTP API](/api/http)
- [Lifecycle](/guide/lifecycle)
- [Changelog](/resources/changelog)
