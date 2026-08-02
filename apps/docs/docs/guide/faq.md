# FAQ

Short answers for evaluators comparing Autlantic Billing to card processors (Stripe and similar).

## Why Autlantic instead of Stripe?

| | Autlantic Billing | Typical card billing |
|--|-------------------|----------------------|
| Asset | **USDC** on **Base** | Fiat cards / ACH |
| Settlement | Straight to **your** EVM wallet | Processor balance → payout schedule |
| Custody | Autlantic does **not** hold member revenue | Processor holds funds |
| Mandate | Wallet allowance / vault approve | Card on file |
| Chargebacks | On-chain finality (no card chargebacks) | Disputes / chargebacks |
| Best for | Crypto-native products, global USDC | Mass-market fiat commerce |

Use Autlantic when your members already have wallets (or you want them to) and you want programmable USDC renewals without becoming a money transmitter for member revenue.

## Do funds touch Autlantic?

No. Settlement is to your `payoutAddressEvm`. Autlantic runs checkout, invoices, webhooks, and renewals. Member USDC moves wallet → your wallet (via the billing rails on Base).

## Test vs Live?

Same product surface, different keys and chain:

- **Test** (`abk_test_…`) → Base Sepolia, portal Test mode  
- **Live** (`abk_live_…`) → Base mainnet, portal Live mode  

Webhook secrets are per mode. Do not mix a Live key with a Test webhook secret.

## Do I need the Node SDK?

No. Any stack can call the [Hosted HTTP API](/api/http). Use:

- [OpenAPI](/openapi.yaml)  
- [Postman collection](/postman/autlantic-billing.postman_collection.json)  
- `@autlantic/payments-recurring` when you want typed Node/TS  

## How do renewals work?

After activation, the mandate allows Autlantic’s billing worker to charge due invoices in USDC on schedule. Failures set `invoice.failureCode`, retry per [Retries](/guide/retries), and may move the subscription to `past_due`. You get `invoice.payment_failed` webhooks to message the member.

## What about taxes, multi-currency, and disputes?

Not in scope for Autlantic Billing today. You own tax/VAT presentation and any off-platform accounting. There are no card chargebacks; treat on-chain settlement as final once confirmed.

## Where do I start?

1. [15-minute integration](/guide/integration)  
2. [Local webhooks](/guide/local-webhooks)  
3. [Debugging](/guide/debugging) when something fails  

Portal: [portal.autlantic.com](https://portal.autlantic.com) · npm: [`@autlantic/payments-recurring`](https://www.npmjs.com/package/@autlantic/payments-recurring)
