# Hosted HTTP API

Run `pnpm dev:billing-api` (default `:8788`) or deploy `apps/billing-api`.

## Public checkout (no API key)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/checkout/subscribe/:id` | Hosted HTML checkout |
| `GET` | `/checkout/subscribe/:id.json` | Session JSON |
| `POST` | `/checkout/subscribe/:id/activate` | Activate (sandbox or live with `{ onChainSubscriptionId }`) |

## Authenticated (`X-Autlantic-Api-Key`)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/subscriptions` | List (`?status=active`) |
| `POST` | `/v1/subscriptions` | Create |
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

Due invoices are processed by `apps/billing-worker` with the same `AUTLANTIC_BILLING_*` env vars.
