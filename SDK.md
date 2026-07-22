# Autlantic Payments SDK

**Status:** Recurring USDC billing on Base (`v0.2`).

## Packages

| Package | Role |
|---------|------|
| `@autlantic/payments-recurring` | Merchant SDK (create subscriptions, charge, webhooks) |
| `@autlantic/payments-recurring-core` | Types, intervals, retry policy |
| `@autlantic/chain-evm` | Base + USDC + vault + preflight |
| `@autlantic/billing-engine` | Subscriptions, invoices, refunds, webhook dispatch |

Spec: [docs/recurring-payments-spec.md](./docs/recurring-payments-spec.md)  
Security: [SECURITY.md](./SECURITY.md)

## npm install

```bash
npm install @autlantic/payments-recurring
```

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });
```

Full quickstart: [packages/payments-recurring/README.md](./packages/payments-recurring/README.md)

## Two ways to integrate

| Mode | Best for |
|------|----------|
| **npm SDK** | Node backends, in-process sandbox, full control |
| **Hosted API** | Any stack via API key (runs in the Autlantic platform) |

## Commands

```bash
pnpm check      # build + test
pnpm example
pnpm dev:docs
```

## Production checklist

- [ ] `AUTLANTIC_BILLING_SANDBOX` **off** for mainnet
- [ ] Base chain id and USDC contract match environment
- [ ] API keys rotated for hosted mode
- [ ] Webhook secret + `x-autlantic-signature` verification
- [ ] Merchant `payoutAddressEvm` configured
