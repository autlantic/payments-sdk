# Sandbox & testing

Use sandbox mode before mainnet. No real USDC is required for in-process demos.

## In-process sandbox

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });
```

Or via env when talking to a remote Autlantic billing API:

```bash
export AUTLANTIC_BILLING_SANDBOX=1
```

```ts
const billing = AutlanticBilling.fromEnv();
```

## What to test

1. Create a subscription with a test wallet and payout address.
2. `activateSubscription` (sandbox completes mandate + first charge).
3. `chargeInvoice` for later renewals (not the same first invoice after activate).
4. Cancel, refund, and void flows.
5. Webhook signature verification with your secret.

## Repo commands

From the root of this repository:

```bash
pnpm check      # build + unit tests
pnpm example    # sandbox demo
```

More detail: [`packages/payments-recurring/TESTING.md`](https://github.com/autlantic/payments-sdk/blob/main/packages/payments-recurring/TESTING.md).

## Going live

1. Set `AUTLANTIC_BILLING_SANDBOX` off (or remove it).
2. Point at Base mainnet chain config and live USDC.
3. Set `AUTLANTIC_BILLING_API_URL` to the base URL Autlantic issues with your API key, and use Autlantic’s hosted renewals worker, or run a compatible API yourself.
4. Verify webhooks with `x-autlantic-signature`.
