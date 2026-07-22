# Webhooks

Billing events are POSTed to your endpoint with HMAC header `x-autlantic-signature`.

## Verify

```ts
import {
  verifyBillingWebhook,
  parseBillingWebhookEvent,
} from "@autlantic/payments-recurring";

const ok = verifyBillingWebhook(rawBody, signatureHeader, process.env.AUTLANTIC_BILLING_WEBHOOK_SECRET!);
if (!ok) throw new Error("bad signature");

const event = parseBillingWebhookEvent(JSON.parse(rawBody));
```

Always verify against the **raw** request body. Do not re-serialize JSON before checking the signature.

## Common events

- `subscription.created` / `subscription.activated` / `subscription.canceled`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.refunded`
- `invoice.voided`

## Env

| Variable | Purpose |
|----------|---------|
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | Shared HMAC secret |
| `AUTLANTIC_BILLING_WEBHOOK_URL` | Destination URL for delivered events (hosted API / worker) |
