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

Use Autlantic when your members already have wallets (or you want them to) and you want programmable USDC renewals with settlement straight to your wallet.

## Do funds touch Autlantic?

No. Settlement is to your `payoutAddressEvm`. Autlantic runs checkout, invoices, webhooks, and renewals. Member USDC moves wallet → your wallet on Base. Autlantic does not custody member subscription revenue. Relayers may sponsor gas and submit transactions; they do not hold member revenue. See the product [Non-custodial overview](https://autlantic.com/non-custodial).

## Test vs Live?

Same product surface, different keys and chain:

- **Test** (`abk_test_…`) → Base Sepolia, portal Test mode  
- **Live** (`abk_live_…`) → Base mainnet, portal Live mode  

Webhook secrets are per mode. Do not mix a Live key with a Test webhook secret.

## Do I need the Node SDK?

No. Any stack can call the [Hosted HTTP API](/api/http). Use:

- [OpenAPI](/api/openapi)  
- [Postman collection](/resources/postman)  
- `@autlantic/payments-recurring` when you want typed Node/TS  

## How do renewals work?

After activation, the mandate lets scheduled vault charges settle USDC from the customer wallet to your payout wallet. Autlantic’s billing worker submits those charges on schedule. Failures set `invoice.failureCode`, retry per [Retries](/guide/retries), and may move the subscription to `past_due`. You get `invoice.payment_failed` webhooks to message the member.

## What about taxes, multi-currency, and disputes?

Not in scope for Autlantic Billing today. You own tax/VAT presentation and any off-platform accounting. There are no card chargebacks; treat on-chain settlement as final once confirmed.

## Where do I start?

1. [15-minute integration](/guide/integration)  
2. [Local webhooks](/guide/local-webhooks)  
3. [Debugging](/guide/debugging) when something fails  

Portal: [portal.autlantic.com](https://portal.autlantic.com) · npm: [`@autlantic/payments-recurring`](https://www.npmjs.com/package/@autlantic/payments-recurring)
