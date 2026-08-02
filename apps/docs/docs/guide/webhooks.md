# Webhooks

Billing events are POSTed to your endpoint with HMAC header `x-autlantic-signature`.

Signing uses the **webhook endpoint secret** from the merchant portal (Test and Live each have their own endpoints and secrets). Put that value in `AUTLANTIC_BILLING_WEBHOOK_SECRET` for the matching deploy.

## Verify

```ts
import {
  verifyBillingWebhook,
  verifyBillingWebhookDetailed,
  parseBillingWebhookEvent,
  parseBillingWebhookEventDetailed,
  assertBillingWebhook,
} from "@autlantic/payments-recurring";

// Argument order: (secret, rawBody, signatureHeader)
const ok = verifyBillingWebhook(
  process.env.AUTLANTIC_BILLING_WEBHOOK_SECRET!,
  rawBody,
  signatureHeader,
);
if (!ok) throw new Error("bad signature");

const event = parseBillingWebhookEvent(rawBody);
```

Prefer detailed helpers when you need ops-friendly failure reasons:

```ts
const verified = verifyBillingWebhookDetailed(secret, rawBody, signatureHeader);
if (!verified.ok) {
  // missing_header | empty_secret | length_mismatch | invalid_signature | compare_error
  console.warn(verified.reason);
}

const parsed = parseBillingWebhookEventDetailed(rawBody);
if (!parsed.ok) {
  // invalid_json | missing_fields
  console.warn(parsed.reason);
}

// Or throw AutlanticBillingError with code webhook_* :
assertBillingWebhook(secret, rawBody, signatureHeader);
```

Always verify against the **raw** request body. Do not re-serialize JSON before checking the signature.

See [Debugging](/guide/debugging) for logger setup and portal delivery retries.

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

## Delivery in the portal

Under **Webhooks**, each endpoint shows recent deliveries. Failed attempts are highlighted; use **Retry now** to redeliver. Automatic retries still run in the background. Keep Test and Live endpoints separate so secrets match the API key in that deploy.

## Env

| Variable | Purpose |
|----------|---------|
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | Endpoint signing secret for this environment |
| `AUTLANTIC_BILLING_WEBHOOK_URL` | Optional platform destination (billing-worker / engine), not your merchant URL |
