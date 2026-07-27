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

Hosted checkout is a React wallet flow with EIP-6963 discovery, WalletConnect, and Connect → Approve → Pay for subscriptions (Connect → Pay for one-time). Redirect buyers to `checkoutUrl` from `createSubscription` / `createPayment`.

Subscribe `/status` (and `.json`) is a **fast** session payload: amounts, PDFs, coupon fields, and flags such as `onchainPending`. It does **not** call Base RPC. The hosted SPA then loads `GET .../onchain` for allowance and vault resume when the session is still incomplete on live.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/checkout/subscribe/:id` | Hosted subscription checkout (React SPA) |
| `GET` | `/checkout/subscribe/:id/status` | Fast session status (no Base RPC) |
| `GET` | `/checkout/subscribe/:id.json` | Same as `/status` |
| `GET` | `/checkout/subscribe/:id/onchain` | Allowance + vault resume (Base RPC; live incomplete only) |
| `POST` | `/checkout/subscribe/:id/wallet` | Sync connected `customerWallet` (incomplete only) |
| `POST` | `/checkout/subscribe/:id/activate` | Activate (sandbox or live with `{ onChainSubscriptionId }`) |
| `POST` | `/checkout/subscribe/:id/coupon` | Apply merchant coupon (`{ code }`) |
| `DELETE` | `/checkout/subscribe/:id/coupon` | Remove applied coupon; restore list price |
| `GET` | `/checkout/pay/:id` | Hosted one-time checkout (React SPA) |
| `GET` | `/checkout/pay/:id/status` | Enriched one-time session |
| `GET` | `/checkout/pay/:id.json` | Same as `/status` |
| `POST` | `/checkout/pay/:id/confirm` | Confirm (sandbox, or live with `{ txHash }`) |
| `POST` | `/checkout/pay/:id/coupon` | Apply merchant coupon (`{ code }`) |
| `DELETE` | `/checkout/pay/:id/coupon` | Remove applied coupon; restore list price |

Coupons are configured in the merchant portal. Apply/remove only works while the checkout session is still open (subscription incomplete, or payment open).

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
