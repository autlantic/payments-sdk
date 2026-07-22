# Autlantic Payments SDK

Public TypeScript SDK for **USDC recurring billing on Base**.

- Docs: https://docs.autlantic.com
- npm: [`@autlantic/payments-recurring`](https://www.npmjs.com/package/@autlantic/payments-recurring)
- Product platform (private): https://github.com/autlantic/platform

## Packages

| Package | Role |
|---------|------|
| `@autlantic/payments-recurring` | Merchant SDK (subscriptions, invoices, webhooks) |
| `@autlantic/payments-recurring-core` | Types, intervals, retry policy |
| `@autlantic/chain-evm` | Base + USDC + vault helpers |
| `@autlantic/billing-engine` | Subscriptions, invoices, refunds, webhook dispatch |

## Install

```bash
npm install @autlantic/payments-recurring
```

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

const { subscription } = await billing.createSubscription({
  merchantRef: "order_123",
  customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  payoutAddressEvm: "0xYourMerchantWallet",
  amountUsdc: 20,
  interval: "month",
});

await billing.activateSubscription(subscription.id);
```

## Develop in this repo

```bash
pnpm install
pnpm check
pnpm example
pnpm dev:docs
```

## Publish

See [PUBLISHING.md](./PUBLISHING.md). Publish order: core → chain-evm → billing-engine → payments-recurring.

## License

MIT
