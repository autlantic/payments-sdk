# Webhooks

Billing events are POSTed to your endpoint with HMAC header `x-autlantic-signature`.

## Verify

```ts
import {
  verifyBillingWebhook,
  parseBillingWebhookEvent,
  BILLING_WEBHOOK_SIGNATURE_HEADER,
  type BillingWebhookEvent,
} from "@autlantic/payments-recurring";

const signatureHeader = req.headers[BILLING_WEBHOOK_SIGNATURE_HEADER]; // x-autlantic-signature
const ok = verifyBillingWebhook(
  rawBody,
  signatureHeader,
  process.env.AUTLANTIC_BILLING_WEBHOOK_SECRET!,
);
if (!ok) throw new Error("bad signature");

const event: BillingWebhookEvent = parseBillingWebhookEvent(JSON.parse(rawBody));
```

Always verify against the **raw** request body. Do not re-serialize JSON before checking the signature.

## Event types

```ts
type BillingWebhookEvent = {
  type: BillingWebhookEventType;
  id: string;
  createdAt: string;
  data: Record<string, unknown>;
};
```

| Event | When |
|-------|------|
| `subscription.created` | Subscription created (`incomplete`) |
| `subscription.activated` | Mandate completed / subscription became `active` |
| `subscription.updated` | Amount, interval, plan, or metadata changed |
| `subscription.past_due` | Automatic [retries](/guide/retries) exhausted |
| `subscription.canceled` | Subscription canceled |
| `invoice.created` | Invoice opened (first or renewal) |
| `invoice.paid` | Charge succeeded |
| `invoice.payment_failed` | Charge failed; see `data.failureCode` / [errors](/guide/errors) |
| `invoice.refunded` | Refund recorded |
| `invoice.voided` | Open invoice voided |

How these line up on a real checkout: [Lifecycle](/guide/lifecycle).

## Signing (outbound tests)

```ts
import { signBillingWebhook } from "@autlantic/payments-recurring";

const signature = signBillingWebhook(rawBody, process.env.AUTLANTIC_BILLING_WEBHOOK_SECRET!);
```

## Env

| Variable | Purpose |
|----------|---------|
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | Shared HMAC secret |
| `AUTLANTIC_BILLING_WEBHOOK_URL` | Destination URL for delivered events (hosted API / worker) |
