---
layout: home

hero:
  name: Autlantic Billing
  text: USDC on Base, recurring
  tagline: TypeScript SDK and hosted API for USDC subscriptions. Direct payouts to your EVM wallet, vault checkout, sandbox testing.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: npm package
      link: https://www.npmjs.com/package/@autlantic/payments-recurring
    - theme: alt
      text: Autlantic product
      link: https://autlantic.com

features:
  - title: npm SDK
    details: "@autlantic/payments-recurring: create subscriptions, charge invoices, refunds, and verify webhooks. TypeScript, Node 20+."
  - title: Hosted API
    details: "REST with API key when you do not want Node in your stack. Same billing engine as the SDK."
  - title: Sandbox mode
    details: "Base Sepolia / in-process sandbox. Test activate and renewals before mainnet."
  - title: Four packages
    details: "payments-recurring-core, chain-evm, billing-engine, payments-recurring. Use the umbrella client or split layers."
---

## Two ways to integrate

| Mode | Best for |
|------|----------|
| **npm SDK** | Node backends, in-process sandbox, full control |
| **Hosted HTTP API** | Any stack (curl, mobile, PHP), API key only |

```bash
npm install @autlantic/payments-recurring
```

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

const { subscription, invoice } = await billing.createSubscription({
  merchantRef: "order_123",
  customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  payoutAddressEvm: "0xYourMerchantWallet…",
  amountUsdc: 20,
  interval: "month",
});
```

See [Getting started](/guide/getting-started) for the full flow.
