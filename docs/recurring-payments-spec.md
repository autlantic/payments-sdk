# Autlantic Recurring Payments (Billing SDK) — v0.1 spec

Autlantic-owned recurring crypto billing: authorize a wallet once, pull USDC on schedule, settle to the merchant wallet on Base.

This document is the source of truth for Phase 1 (sandbox) and Phase 2 (mainnet).

## Goals

- Stripe-like subscription lifecycle without Stripe
- Non-custodial: USDC flows to merchant EVM wallet via pull contract
- Autlantic relayer pays gas on renewals (cost baked into platform fee)
- Multi-merchant-ready data model; Autlantic app is tenant zero
- One-time USDC pass checkout shares the same Base / EVM wallet rail

## v1 scope

| Item | Choice |
|------|--------|
| Chain | Base mainnet + Base Sepolia sandbox |
| Token | USDC (6 decimals) |
| Settlement | Direct to merchant `payoutAddressEvm` |
| Authorization | ERC-20 `approve` + subscription contract `transferFrom` |
| Allowance | Rolling cap with per-charge max (contract-enforced) |
| Retries | 4 attempts over 7 days, then `past_due` |
| Checkout | Hosted API + merchant SDK (embedded UI in Phase 2) |
| Refunds | On-chain USDC to original payer wallet (Phase 2) |

## Out of scope (v0.1)

- Non-Base EVM chains (planned later)
- Proration / mid-cycle plan changes
- Stripe or third-party billing for member USDC checkout
- Wallet screening (hook reserved)
- Mainnet deploy (sandbox first)

## Architecture

```
Merchant app
  └── @autlantic/payments-recurring (SDK)
        └── apps/billing-api (REST)
              ├── packages/billing-engine (subscriptions, invoices, retries)
              ├── packages/payments-recurring-core (types)
              └── packages/chain-evm (Base + USDC)
        └── apps/billing-worker (due invoice processor + relayer stub)

On-chain: contracts/src/AutlanticSubscriptionVault.sol
  Customer approve(USDC, vault) → subscribe(planId, merchant)
  Relayer calls charge(subscriptionId) each period → transferFrom → merchant
```

## Core objects

### Merchant

| Field | Description |
|-------|-------------|
| `id` | `mer_…` |
| `payoutAddressEvm` | Receives USDC on successful charge |
| `webhookUrl` | Optional HTTPS endpoint |
| `webhookSecret` | HMAC signing secret |

### Customer

| Field | Description |
|-------|-------------|
| `id` | `cus_…` |
| `walletAddress` | EVM address (checksummed) |
| `merchantId` | Owning merchant |

### Subscription

| Field | Description |
|-------|-------------|
| `id` | `sub_…` |
| `status` | `incomplete` \| `active` \| `past_due` \| `canceled` |
| `merchantId` | Merchant |
| `customerId` | Customer |
| `planId` | Merchant plan reference |
| `amountUsdc` | Recurring amount (display units) |
| `interval` | `month` \| `year` |
| `currentPeriodStart` | ISO datetime |
| `currentPeriodEnd` | ISO datetime |
| `cancelAtPeriodEnd` | boolean |
| `mandateId` | Linked wallet authorization |

### Mandate

| Field | Description |
|-------|-------------|
| `id` | `mdt_…` |
| `walletAddress` | Customer wallet |
| `spenderAddress` | Subscription vault contract |
| `allowanceCapUsdc` | Max total pullable until revoked |
| `maxChargeUsdc` | Max single charge |
| `status` | `pending` \| `active` \| `revoked` \| `expired` |
| `chainId` | e.g. `84532` (Base Sepolia) |

### Invoice

| Field | Description |
|-------|-------------|
| `id` | `inv_…` |
| `subscriptionId` | Parent subscription |
| `status` | `open` \| `paid` \| `void` \| `uncollectible` |
| `amountUsdc` | Due amount |
| `dueAt` | When charge should run |
| `attemptCount` | Payment attempts so far |
| `nextAttemptAt` | Next retry (null if none scheduled) |
| `paidAt` | When settled |
| `txHash` | On-chain charge tx (if paid) |

## Subscription lifecycle

1. **Create subscription** (`POST /v1/subscriptions`) → status `incomplete`, first invoice `open`
2. **Complete mandate** (`POST /v1/subscriptions/:id/complete`) → customer approved USDC on-chain (sandbox: simulated)
3. **Activate** → status `active`, webhook `subscription.activated`
4. **Renewal** → worker creates invoice at period end, relayer calls `charge`
5. **Success** → extend period, webhook `invoice.paid`
6. **Failure** → retry per policy, webhook `invoice.payment_failed`; after max retries → `past_due`
7. **Cancel** → `cancelAtPeriodEnd` or immediate `canceled`

## Retry policy (default)

| Attempt | Delay after previous failure |
|---------|------------------------------|
| 1 | Immediate (due date) |
| 2 | +1 day |
| 3 | +2 days |
| 4 | +4 days |

After attempt 4 fails: subscription → `past_due`, invoice → `uncollectible`.

## REST API (billing-api)

Base URL: `https://billing.autlantic.com` (local: `:8788`)

Auth: `X-Autlantic-Api-Key` or `Authorization: Bearer`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health |
| GET | `/checkout/subscribe/:id` | Hosted checkout HTML |
| GET | `/checkout/subscribe/:id.json` | Checkout session JSON |
| POST | `/checkout/subscribe/:id/activate` | Activate (sandbox or live with `onChainSubscriptionId`) |
| GET | `/v1/subscriptions` | List subscriptions |
| POST | `/v1/subscriptions` | Create subscription |
| GET | `/v1/subscriptions/:id` | Get subscription |
| PATCH | `/v1/subscriptions/:id` | Update plan/amount |
| POST | `/v1/subscriptions/:id/activate` | Live activate (authenticated) |
| POST | `/v1/subscriptions/:id/cancel` | Cancel (+ on-chain cancel) |
| POST | `/v1/subscriptions/:id/complete` | Mark mandate complete |
| GET | `/v1/invoices` | List invoices |
| GET | `/v1/invoices/:id` | Get invoice |
| POST | `/v1/invoices/:id/charge` | Charge invoice |
| POST | `/v1/invoices/:id/refund` | Refund paid invoice |
| POST | `/v1/invoices/:id/void` | Void open invoice |
| POST | `/v1/test-events/trigger` | Sandbox scenarios |

POST requests accept `Idempotency-Key` header (24h replay cache).

### Create subscription

```json
POST /v1/subscriptions
{
  "merchantRef": "order_abc",
  "customerWallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "payoutAddressEvm": "0xMerchantWallet…",
  "amountUsdc": 20,
  "interval": "month",
  "metadata": { "planId": "plan_1" }
}
```

Response: `{ subscription, invoice, checkoutUrl }`

`checkoutUrl` points to hosted authorize flow (Phase 2 UI). Sandbox completes via `/complete`.

## Webhooks

Header: `x-autlantic-signature` (HMAC-SHA256 of raw body)

Events:

| Event | When |
|-------|------|
| `subscription.created` | Subscription created |
| `subscription.activated` | First charge succeeded |
| `subscription.past_due` | Retries exhausted |
| `subscription.canceled` | Canceled |
| `invoice.created` | New invoice |
| `invoice.paid` | Charge succeeded |
| `invoice.refunded` | Refund completed |
| `invoice.voided` | Invoice voided |
| `subscription.updated` | Plan/amount changed |

```json
{
  "type": "invoice.paid",
  "id": "evt_…",
  "createdAt": "2026-06-19T12:00:00.000Z",
  "data": {
    "invoice": { "id": "inv_…", "subscriptionId": "sub_…", "amountUsdc": 20, "txHash": "0x…" }
  }
}
```

## Smart contract (AutlanticSubscriptionVault)

See `contracts/src/AutlanticSubscriptionVault.sol`.

Functions:

- `subscribe(bytes32 planRef, address merchant, uint256 amountPerPeriod, uint256 maxChargeAmount, uint64 periodEnd, uint256 allowanceCap)` — customer after USDC approve; `periodEnd` may equal `block.timestamp` for immediate first charge
- `charge(uint256 subscriptionId)` — relayer only; `transferFrom` customer → merchant
- `cancel(uint256 subscriptionId)` — customer or relayer

Constants enforced on-chain:

- `maxChargeAmount` per subscription
- `allowanceCap` at subscribe time

## Environment

| Variable | Service | Purpose |
|----------|---------|---------|
| `AUTLANTIC_BILLING_SANDBOX` | billing-api, worker | Sandbox mode |
| `AUTLANTIC_BILLING_API_KEYS` | billing-api | Merchant API keys |
| `AUTLANTIC_BILLING_WEBHOOK_SECRET` | billing-api | Default webhook signing |
| `AUTLANTIC_BILLING_CHAIN_ID` | worker | `84532` sandbox default |
| `AUTLANTIC_BILLING_VAULT_ADDRESS` | worker, web | Deployed vault |
| `AUTLANTIC_RELAYER_PRIVATE_KEY` | worker, web | Relayer wallet for live `charge()` |
| `AUTLANTIC_BASE_SEPOLIA_RPC_URL` | worker, web | Base Sepolia RPC |
| `AUTLANTIC_BILLING_STORE_PATH` | billing-api, worker | Shared JSON store (default `.autlantic/billing-store.json`) |
| `AUTLANTIC_BILLING_WEBHOOK_URL` | billing-api, worker | Optional merchant webhook target |

## Packages

| Package | Role |
|---------|------|
| `@autlantic/payments-recurring-core` | Types, intervals, retry math, webhook shapes |
| `@autlantic/billing-engine` | Subscription + invoice logic, memory store |
| `@autlantic/chain-evm` | Base + USDC constants |
| `@autlantic/payments-recurring` | Merchant SDK |

## Phase roadmap

- **Phase 1 (done):** Spec, core packages, sandbox API/worker, contract skeleton, memory/file store
- **Phase 2 (done):** Foundry tests, vault deploy script, relayer integration (viem live submit), Prisma persistence
- **Phase 3 (done):** Hosted checkout UI, Autlantic app integration (creator EVM payout, USDC subscribe flow, membership webhooks)
- **Phase 4 (ops):** Base Sepolia/mainnet vault deploy, npm publish (`pnpm publish:recurring-sdk`), third-party audit

### Live Base Sepolia checklist

1. Deploy vault: `pnpm deploy:billing-vault:sepolia` with `AUTLANTIC_DEPLOYER_PRIVATE_KEY`, `AUTLANTIC_RELAYER_ADDRESS`
2. Set `AUTLANTIC_BILLING_VAULT_ADDRESS`, `AUTLANTIC_RELAYER_PRIVATE_KEY`, `AUTLANTIC_BILLING_SANDBOX=0`
3. Customer flow: approve USDC → `vault.subscribe()` (stores `onChainSubscriptionId` in engine metadata) → relayer `charge(onChainId)` on activate and renewals
4. Run worker: `pnpm dev:billing-worker` (live mode uses `processDueInvoicesLive`)
