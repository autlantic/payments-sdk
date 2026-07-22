# Changelog

## 0.2.5 - README branding

- Drop wordmark from package README; keep Autlantic icon only
- Public docs cleanup: SDK-only testing, hosted API described as Autlantic-operated
- Docs site points at the public [payments-sdk](https://github.com/autlantic/payments-sdk) repo

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
