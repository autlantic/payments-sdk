# Changelog

## 0.3.1 - Align engine with hosted portal / billing

Upstream features required by Autlantic hosted billing (portal, API, worker) so npm matches production behavior:

- Test/Live `mode` on customers, subscriptions, invoices, and one-time payments
- `resumeSubscription` for cancel-at-period-end undo
- `chainIdForBillingMode("test" | "live")` (Sepolia vs Base)
- `processDueInvoices` / `processDueInvoicesLive` optional `mode` filter
- Checkout session extras: coupons, `listAmountUsdc`, `nextPaymentAt`, merchant branding
- `BillingPersistAdapter.loadPaymentLink?` for cross-process link loads
- Payment links stamp `mode` on minted one-time payments

Package versions: `@autlantic/payments-recurring` / `@autlantic/billing-engine` **0.3.1**, `@autlantic/payments-recurring-core` / `@autlantic/chain-evm` **0.2.6**.

## 0.3.0 - Payment links (URL / QR)

- Shareable **payment links**: fixed USDC amount, optional max uses / expiry
- SDK: `createPaymentLink`, `listPaymentLinks`, `getPaymentLink`, `disablePaymentLink`, `openPaymentLink`
- Hosted: `POST /v1/payment-links`, public `/checkout/link/:id` (opens into one-time pay checkout)
- Merchant portal: **Payment links** page with copy URL and QR
- Webhooks: `payment.created` / `payment.paid` when a link is opened and paid
- E2E smoke: `pnpm test:e2e:payment-links`

## Docs - Test / Live API keys

- Document Stripe-style Test and Live: portal toggle, `abk_test_` / `abk_live_` keys, Sepolia vs Base mainnet
- Webhook docs use per-mode endpoint signing secrets
- Clarify `AUTLANTIC_BILLING_SANDBOX` is not the primary hosted mode switch

## 0.2.6 - Catalog products + example store

- `listProducts()` and `priceId` on `createSubscription`
- Hosted `GET /v1/products`
- Example storefront in the public [payments-sdk](https://github.com/autlantic/payments-sdk/tree/main/examples/subscription-store) repo

## 0.2.1 - Public docs alignment

- Marketing and getting-started samples match the real `AutlanticBilling` API
- Clarify that `activateSubscription` charges the first invoice
- Docs site no longer links to the private GitHub repo

## 0.2.0 - Recurring USDC on Base

- `@autlantic/payments-recurring` merchant SDK
- `@autlantic/payments-recurring-core` types and retry policy
- `@autlantic/chain-evm` Base + USDC adapter
- `@autlantic/billing-engine` subscriptions, invoices, webhooks
- Hosted `billing-api` and `billing-worker`

## 0.1.x - Legacy (removed)

Tron USDT one-off checkout (`@autlantic/payments`, `@autlantic/chain-tron`) has been removed from this monorepo.
