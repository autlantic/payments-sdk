# Sandbox & testing

Use sandbox mode before mainnet. No real USDC is required for in-process demos.

## In-process sandbox

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });
```

Or via env:

```bash
export AUTLANTIC_BILLING_SANDBOX=1
```

```ts
const billing = AutlanticBilling.fromEnv();
```

## What to test

1. Create a subscription with a test wallet and payout address.
2. `activateSubscription` (sandbox completes mandate + first charge).
3. `chargeInvoice` for renewals.
4. Cancel, refund, and void flows.
5. Webhook signature verification with your secret.

## Monorepo commands

```bash
pnpm check:recurring-sdk
pnpm --filter @autlantic/payments-recurring example
pnpm dev:billing-api
pnpm dev:billing-worker
```

More detail: package `TESTING.md` under `packages/payments-recurring`.

## Going live

1. Set `AUTLANTIC_BILLING_SANDBOX` off (or remove it).
2. Point at Base mainnet chain config and live USDC.
3. Run `billing-worker` for due renewals.
4. Verify webhooks with `x-autlantic-signature`.
