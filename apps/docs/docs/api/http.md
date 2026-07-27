# Hosted HTTP API

The hosted billing HTTP API is operated by **Autlantic**. This open-source repo ships the TypeScript client and engine packages; it does not run the production API process.

Set `AUTLANTIC_BILLING_API_URL` to the base URL Autlantic gives you with your API key (same value you pass to the SDK). Paths below are relative to that base.

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.fromEnv();
// AUTLANTIC_BILLING_API_URL   // base URL from Autlantic
// AUTLANTIC_BILLING_API_KEY
// AUTLANTIC_BILLING_MERCHANT_ID
// AUTLANTIC_BILLING_SANDBOX
// AUTLANTIC_BILLING_WEBHOOK_SECRET
```

For local demos without a remote API, use `AutlanticBilling.sandbox()` instead. See [Sandbox & testing](/guide/sandbox).

## Public checkout (no API key)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/checkout/subscribe/:id` | Hosted HTML subscription checkout |
| `GET` | `/checkout/subscribe/:id.json` | Session JSON |
| `POST` | `/checkout/subscribe/:id/activate` | Activate (sandbox or live with `{ onChainSubscriptionId }`) |
| `GET` | `/checkout/pay/:id` | Hosted HTML one-time checkout |
| `GET` | `/checkout/pay/:id.json` | One-time session JSON |
| `POST` | `/checkout/pay/:id/confirm` | Confirm (sandbox, or live with `{ txHash }`) |

## Authenticated (`X-Autlantic-Api-Key`)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/products` | List active catalog products and prices |
| `POST` | `/v1/payments` | Create one-time payment (`priceId` once, or `amountUsdc`) |
| `GET` | `/v1/payments/:id` | Fetch one-time payment |
| `GET` | `/v1/subscriptions` | List (`?status=active`) |
| `POST` | `/v1/subscriptions` | Create (`priceId` or `amountUsdc` + `interval`) |
| `GET` | `/v1/subscriptions/:id` | Fetch |
| `PATCH` | `/v1/subscriptions/:id` | Update |
| `POST` | `/v1/subscriptions/:id/complete` | Complete mandate |
| `POST` | `/v1/subscriptions/:id/activate` | Activate |
| `POST` | `/v1/subscriptions/:id/cancel` | Cancel |
| `GET` | `/v1/invoices` | List (`?subscriptionId=`) |
| `GET` | `/v1/invoices/:id` | Fetch |
| `POST` | `/v1/invoices/:id/charge` | Charge |
| `POST` | `/v1/invoices/:id/refund` | Refund |
| `POST` | `/v1/invoices/:id/void` | Void |

## Idempotency

Pass `Idempotency-Key` on POST requests. Replays return the cached response for 24 hours.

## Renewals

On Autlantic’s hosted stack, due invoices are processed by Autlantic’s billing worker using the same `AUTLANTIC_BILLING_*` configuration as the API. Self-hosting that worker is outside the scope of this public SDK repo.
