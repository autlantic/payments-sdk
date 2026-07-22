# Testing - @autlantic/payments-recurring

All commands below run in this repository (`autlantic/payments-sdk`).

## Quick check

```bash
pnpm check      # build + unit tests for all packages
pnpm example    # in-process sandbox demo
```

## In-process sandbox

No hosted API required. State lives in memory for the process lifetime.

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

const { subscription } = await billing.createSubscription({
  merchantRef: "order_123",
  customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  payoutAddressEvm: "0x1111111111111111111111111111111111111111",
  amountUsdc: 20,
  interval: "month",
});

const { charge } = await billing.activateSubscription(subscription.id);
// charge.invoice.status === "paid" in the default sandbox path
```

## What to cover

1. Create subscription (status `incomplete`, first invoice `open`)
2. `activateSubscription` (mandate + first charge)
3. Later renewals with `chargeInvoice` on a new open invoice
4. Cancel, refund, and void
5. Webhook sign / verify with `signBillingWebhook` and `verifyBillingWebhook`

## E2E smoke (no servers)

```bash
pnpm --filter @autlantic/payments-recurring exec tsx examples/e2e-recurring-billing.mts
```

## Webhooks

Use a test secret only. Never commit production webhook secrets.

```ts
import { signBillingWebhook, verifyBillingWebhook } from "@autlantic/payments-recurring";

const { body, signature } = signBillingWebhook("whsec_test", event);
verifyBillingWebhook("whsec_test", body, signature);
```

## Hosted API

Remote billing (`apiBaseUrl` + API key) is provided by Autlantic’s hosted service, not by scripts in this repo. See [Hosted HTTP API](https://docs.autlantic.com/api/http) and `AutlanticBilling.fromEnv()`.
