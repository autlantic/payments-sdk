# Autlantic Recurring Payments (Billing SDK) - v0.2 overview

USDC recurring billing on Base: authorize a wallet once, charge on schedule, settle to the merchant `payoutAddressEvm`.

This document describes the public product model for the packages in this repository. Implementation details of Autlantic’s production hosting are out of scope here.

## Goals

- Subscription lifecycle similar to card billing, without card processors
- Non-custodial settlement: USDC goes to the merchant EVM wallet
- Typed merchant SDK, signed webhooks, and an optional hosted HTTP API
- Multi-merchant data model

## Scope

| Item | Choice |
|------|--------|
| Chain | Base mainnet + Base Sepolia sandbox |
| Token | USDC (6 decimals) |
| Settlement | Direct to merchant `payoutAddressEvm` |
| Authorization | ERC-20 allowance + vault `transferFrom` |
| Retries | Default policy: 4 attempts over 7 days, then `past_due` |
| Client | `@autlantic/payments-recurring` |
| Hosted API | Optional; operated by Autlantic or a compatible deployment |

## Architecture (packages)

```
Merchant app
  └── @autlantic/payments-recurring (SDK client)
        ├── @autlantic/billing-engine (subscriptions, invoices, retries)
        ├── @autlantic/payments-recurring-core (types, intervals, webhooks)
        └── @autlantic/chain-evm (Base + USDC helpers)

Optional: Autlantic hosted billing HTTP API + renewal worker
```

In-process sandbox mode runs the engine in memory inside the SDK (no remote API).

## Core objects

### Subscription

| Field | Description |
|-------|-------------|
| `id` | `sub_…` |
| `status` | `incomplete` \| `active` \| `past_due` \| `canceled` |
| `merchantId` | Merchant |
| `amountUsdc` | Recurring amount (display units) |
| `interval` | `month` \| `year` |
| `payoutAddressEvm` | Merchant settlement address |

### Invoice

| Field | Description |
|-------|-------------|
| `id` | `inv_…` |
| `subscriptionId` | Parent subscription |
| `status` | `open` \| `paid` \| `void` \| `uncollectible` |
| `amountUsdc` | Due amount |
| `attemptCount` | Payment attempts so far |
| `txHash` | On-chain charge tx when paid |

## Lifecycle

1. **Create** → status `incomplete`, first invoice `open`
2. **Activate** (or complete mandate + charge) → `active`, first invoice paid
3. **Renewal** → new invoice at period end, charge attempt
4. **Success** → extend period, webhook `invoice.paid`
5. **Failure** → retries per policy, then `past_due`
6. **Cancel** → at period end or immediately

## Retry policy (default)

| Attempt | Delay after previous failure |
|---------|------------------------------|
| 1 | Immediate (due date) |
| 2 | +1 day |
| 3 | +2 days |
| 4 | +4 days |

After attempt 4 fails: subscription → `past_due`, invoice → `uncollectible`.

## Hosted HTTP API (optional)

When using a remote Autlantic billing API, the client sends:

Auth: `X-Autlantic-Api-Key`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/checkout/subscribe/:id` | Hosted checkout HTML |
| GET | `/checkout/subscribe/:id.json` | Checkout session JSON |
| POST | `/checkout/subscribe/:id/activate` | Activate |
| GET/POST/PATCH | `/v1/subscriptions…` | Subscription CRUD / lifecycle |
| GET/POST | `/v1/invoices…` | Invoice fetch / charge / refund / void |

POST requests accept `Idempotency-Key` (24h replay cache).

Full tables: [Hosted HTTP API](https://docs.autlantic.com/api/http).

## Webhooks

Header: `x-autlantic-signature` (HMAC-SHA256 of raw body)

Common events: `subscription.created`, `subscription.activated`, `subscription.canceled`, `invoice.paid`, `invoice.payment_failed`, `invoice.refunded`, `invoice.voided`.

Verify with `verifyBillingWebhook` from `@autlantic/payments-recurring`.

## Environment (client)

| Variable | Purpose |
|----------|---------|
| `AUTLANTIC_BILLING_API_URL` | Hosted billing API base URL |
| `AUTLANTIC_BILLING_API_KEY` | API key |
| `AUTLANTIC_BILLING_MERCHANT_ID` | Default merchant id |
| `AUTLANTIC_BILLING_SANDBOX` | `true` / `1` for sandbox |
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | HMAC secret for verification |

## Packages

| Package | Role |
|---------|------|
| `@autlantic/payments-recurring` | Merchant SDK |
| `@autlantic/payments-recurring-core` | Types, intervals, retry math, webhook shapes |
| `@autlantic/billing-engine` | Subscription + invoice logic |
| `@autlantic/chain-evm` | Base + USDC helpers |

## See also

- [Getting started](https://docs.autlantic.com/guide/getting-started)
- [SECURITY.md](../SECURITY.md)
- [TESTING.md](../packages/payments-recurring/TESTING.md)
