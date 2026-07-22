# Testing — @autlantic/payments-recurring

## Quick check

```bash
pnpm check:recurring-sdk
pnpm --filter @autlantic/payments-recurring example
```

## Sandbox SDK (in-process)

No billing API required.

```ts
const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });
const { subscription, invoice } = await billing.createSubscription({ ... });
await billing.activateSubscription(subscription.id);
```

## Billing API + worker (shared file store)

Terminal 1:

```bash
export AUTLANTIC_BILLING_STORE_PATH=.autlantic/billing-store.json
pnpm dev:billing-api
```

Terminal 2:

```bash
export AUTLANTIC_BILLING_STORE_PATH=.autlantic/billing-store.json
pnpm dev:billing-worker
```

Create a subscription:

```bash
curl -s -X POST http://localhost:8788/v1/subscriptions \
  -H "X-Autlantic-Api-Key: abk_test_local" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantRef": "order_api_1",
    "customerWallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "payoutAddressEvm": "0x1111111111111111111111111111111111111111",
    "amountUsdc": 20,
    "interval": "month"
  }'
```

Open the returned `checkoutUrl` in a browser and click **Simulate approve + pay**.

## Failure scenarios

```bash
curl -s -X POST http://localhost:8788/v1/invoices/INV_ID/charge \
  -H "X-Autlantic-Api-Key: abk_test_local" \
  -H "Content-Type: application/json" \
  -d '{"sandboxMode":"insufficient_balance"}'
```

Retries follow the default policy: immediate, +1d, +2d, +4d, then `past_due`.

## Autlantic web app (Postgres store)

When `DATABASE_URL` is set, billing defaults to `AUTLANTIC_BILLING_STORE=prisma` automatically.

Terminal 1 (web):

```bash
export AUTLANTIC_BILLING_SANDBOX=1
pnpm dev
```

Terminal 2 (renewals worker):

```bash
export AUTLANTIC_BILLING_SANDBOX=1
export AUTLANTIC_BILLING_WEBHOOK_URL=http://localhost:3001/api/webhooks/recurring-billing
pnpm dev:billing-worker
```

Or run API + worker together:

```bash
pnpm dev:billing-all
```

Creator flow:

1. Settings → Payout wallet → add EVM address + enable USDC auto-renew
2. Storefront → **Subscribe with USDC (auto-renew)** → connect wallet (browser or WalletConnect)
3. Sandbox checkout → **Simulate approve + pay**

WalletConnect (optional): set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from [Reown Cloud](https://cloud.reown.com).

Member can cancel auto-renew under Account → Memberships → USDC auto-renew.

E2E smoke (no servers):

```bash
pnpm test:e2e:recurring-billing
```

## Smart contract tests (Foundry)

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit 2>/dev/null || true
forge test
```

## Webhook verification

Set `AUTLANTIC_BILLING_WEBHOOK_URL` to a request bin or your app endpoint. Events are POSTed with HMAC `x-autlantic-signature`.
