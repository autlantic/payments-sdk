# Webhooks

Billing events are POSTed to your endpoint with HMAC header `x-autlantic-signature`.

Signing uses the **webhook endpoint secret** from the merchant portal (Test and Live each have their own endpoints and secrets). Put that value in `AUTLANTIC_BILLING_WEBHOOK_SECRET` for the matching deploy.

## Verify

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
if (!ok) throw new Error("bad signature");

const event = parseBillingWebhookEvent(JSON.parse(rawBody));
```

Always verify against the **raw** request body. Do not re-serialize JSON before checking the signature.

## Test vs Live

| Deploy | Portal | Secret source |
|--------|--------|---------------|
| Staging | Test mode → Webhooks | That Test endpoint’s signing secret |
| Production | Live mode → Webhooks | That Live endpoint’s signing secret |

Test events are delivered only to Test endpoints. Live events only to Live endpoints.

## Common events

- `subscription.created` / `subscription.activated` / `subscription.canceled`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.refunded`
- `invoice.voided`
- `payment.created` / `payment.paid` (one-time payments and payment links)

## Env

| Variable | Purpose |
|----------|---------|
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | Endpoint signing secret for this environment |
| `AUTLANTIC_BILLING_WEBHOOK_URL` | Optional platform destination (billing-worker / engine), not your merchant URL |
