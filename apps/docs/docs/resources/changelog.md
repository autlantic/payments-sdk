# Changelog

Version history for the Autlantic Payments SDK and docs. Also see GitHub [Releases](https://github.com/autlantic/payments-sdk/releases).

## 0.2.7 - Hosted one-time payments

Packages: `@autlantic/payments-recurring@0.2.7`, `@autlantic/billing-engine@0.2.5`, `@autlantic/payments-recurring-core@0.2.5`, `@autlantic/chain-evm@0.2.5`.

- `AutlanticBilling.createPayment` / `getPayment` / `confirmPayment`
- Hosted HTTP: `POST /v1/payments`, `GET /checkout/pay/:id`, confirm with sandbox or `txHash`
- Catalog price interval `once` (portal One-time)
- Webhooks: `payment.created`, `payment.paid`
- Docs: [One-time payments](/guide/one-time-payments)
- Example store: hosted mode redirects to `checkoutUrl`; sandbox keeps local simulate

## 0.2.6 - Catalog products + example store

- `listProducts()` on `AutlanticBilling` (hosted `GET /v1/products`)
- `createSubscription` accepts `priceId` (resolves amount + interval from the merchant catalog) or ad-hoc `amountUsdc` + `interval`
- Example Next.js storefront: [`examples/subscription-store`](https://github.com/autlantic/payments-sdk/tree/main/examples/subscription-store) (`pnpm example:store`)
- Docs: hosted HTTP catalog route and Node.js SDK updates

## Docs - reference maturity (site)

Public docs now include:

- [Lifecycle](/guide/lifecycle) with sequence and state diagrams
- [Error codes](/guide/errors) (`InvoiceFailureCode`)
- [Retries](/guide/retries) (`DEFAULT_RETRY_POLICY`)
- [TypeScript types](/api/types)
- Expanded [Node.js SDK](/api/nodejs) and [Webhooks](/guide/webhooks) references

Package versions below are unchanged unless noted.

## 0.2.5 - README branding

- Drop wordmark from package README; keep Autlantic icon only
- Public docs cleanup: SDK-only testing, hosted API described as Autlantic-operated
- Docs site points at the public [payments-sdk](https://github.com/autlantic/payments-sdk) repo
- GitHub Release [v0.2.5](https://github.com/autlantic/payments-sdk/releases/tag/v0.2.5)

## 0.2.4 - Public brand assets on npm

- README logos use https://autlantic.com/brand/... CDN URLs
- Consistent Autlantic branding across all four packages

## 0.2.3 - Professional npm READMEs

- Branded package READMEs for npm (badges, quick start, docs links)
- Absolute brand image URLs so npm renders Autlantic branding

## 0.2.2 - Repository home

- npm `repository` fields point to https://github.com/autlantic/payments-sdk
- Brand README, SECURITY policy, and MIT license under Autlantic

## 0.2.1 - Public docs alignment

- Marketing and getting-started samples match the real `AutlanticBilling` API
- Clarify that `activateSubscription` charges the first invoice

## 0.2.0 - Recurring USDC on Base

- `@autlantic/payments-recurring` merchant SDK
- `@autlantic/payments-recurring-core` types and retry policy
- `@autlantic/chain-evm` Base + USDC adapter
- `@autlantic/billing-engine` subscriptions, invoices, webhooks
- Autlantic-operated hosted billing API and renewal worker (not shipped as runnable services in this repo)

## 0.1.x - Legacy (removed)

Tron USDT one-off checkout (`@autlantic/payments`, `@autlantic/chain-tron`) has been removed from this monorepo.
