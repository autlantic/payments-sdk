# Debugging

Enterprise-friendly diagnostics for `@autlantic/payments-recurring`: opt-in HTTP traces, pluggable loggers, typed errors, and webhook verify reasons.

## Enable debug logs

```bash
export AUTLANTIC_BILLING_DEBUG=1
# optional: debug | info | warn | error
export AUTLANTIC_BILLING_LOG_LEVEL=debug
```

Or in code:

```ts
import {
  AutlanticBilling,
  createConsoleBillingLogger,
} from "@autlantic/payments-recurring";

const billing = new AutlanticBilling({
  apiBaseUrl: process.env.AUTLANTIC_BILLING_API_URL,
  apiKey: process.env.AUTLANTIC_BILLING_API_KEY!,
  merchantId: process.env.AUTLANTIC_BILLING_MERCHANT_ID!,
  debug: true,
  // optional custom sink (Datadog, Pino, …)
  logger: createConsoleBillingLogger({ minLevel: "debug" }),
});
```

When debug is on, the client logs:

- `client.init` (mode, merchant id, sdk version; no secrets)
- `http.request` / `http.response` (method, path, status, latency, redacted body)
- `http.error` / `http.network_error` on failures
- Sandbox helpers (`sandbox.createPayment`, …)

**Secrets are redacted** (`abk_…`, `whsec_…`, `X-Autlantic-Api-Key`, fields matching `secret` / `token` / `password`).

Default (no debug, no custom logger): **silent**. Safe for production.

## Typed errors

```ts
import { AutlanticBilling, AutlanticBillingError } from "@autlantic/payments-recurring";

try {
  await billing.getPaymentLink("plink_missing");
} catch (err) {
  if (AutlanticBillingError.is(err)) {
    console.error(err.code, err.type, err.statusCode, err.requestId);
    // err.toJSON() for structured logs
  }
  throw err;
}
```

| `type` | Typical cause |
|--------|----------------|
| `validation_error` | Bad input / sandbox missing `amountUsdc` |
| `not_found` | Unknown subscription, payment, or link |
| `authentication_error` | Bad / missing API key (401/403) |
| `configuration_error` | Hosted call without `apiBaseUrl` |
| `api_error` | Other non-2xx or network failure |
| `webhook_error` | Signature / parse failures from `assertBillingWebhook` |

Each request sets `X-Autlantic-Client-Request-Id`. Prefer that id (or server `x-request-id` when present) when filing support tickets.

Invoice **charge** declines still use `invoice.failureCode` (`INSUFFICIENT_BALANCE`, …). See [Error codes](/guide/errors).

## Webhooks

```ts
import {
  verifyBillingWebhookDetailed,
  parseBillingWebhookEventDetailed,
  assertBillingWebhook,
} from "@autlantic/payments-recurring";

// Argument order: secret, rawBody, signatureHeader
const verified = verifyBillingWebhookDetailed(
  process.env.AUTLANTIC_BILLING_WEBHOOK_SECRET!,
  rawBody,
  req.headers["x-autlantic-signature"],
);
if (!verified.ok) {
  // missing_header | empty_secret | length_mismatch | invalid_signature | compare_error
  console.warn("webhook.verify_failed", verified.reason);
  return res.status(400).end();
}

const parsed = parseBillingWebhookEventDetailed(rawBody);
if (!parsed.ok) {
  console.warn("webhook.parse_failed", parsed.reason);
  return res.status(400).end();
}

// Or throw AutlanticBillingError:
assertBillingWebhook(secret, rawBody, signatureHeader);
```

Always verify the **raw** body. Do not `JSON.stringify` a parsed object before checking the signature.

In the [merchant portal](https://portal.autlantic.com), open **Webhooks** → filter failed deliveries → **Retry now**.

## Portal ops checklist

| Symptom | Where to look |
|---------|----------------|
| Payment link paid but app missed it | Webhooks deliveries + `payment.paid`; SDK debug HTTP |
| Subscription past due | Invoices → Failed; `invoice.failureCode`; [Retries](/guide/retries) |
| Signature always fails | Test vs Live secret mismatch; raw body middleware |
| 401 from API | Wrong key mode (`abk_test_` vs `abk_live_`) |

## Related

- [Error codes](/guide/errors)
- [Webhooks](/guide/webhooks)
- [Sandbox & testing](/guide/sandbox)
- [Security](/guide/security)
