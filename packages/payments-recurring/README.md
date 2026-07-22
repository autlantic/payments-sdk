# @autlantic/payments-recurring

Autlantic Recurring Billing SDK. Create USDC subscriptions on Base, receive webhooks, sandbox test flows.

Public docs: https://docs.autlantic.com

## Install

```bash
npm install @autlantic/payments-recurring
```

## Quickstart (sandbox, in-process)

`activateSubscription` completes the wallet mandate and charges the first open invoice.

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

const { subscription } = await billing.createSubscription({
  merchantRef: "order_123",
  customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  payoutAddressEvm: "0xYourMerchantWallet…",
  amountUsdc: 20,
  interval: "month",
});

const { charge } = await billing.activateSubscription(subscription.id);
```

## Hosted API

Run `pnpm dev:billing-api` and point the client at your billing API URL.
