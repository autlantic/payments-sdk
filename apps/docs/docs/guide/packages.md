# Packages

| Package | Role |
|---------|------|
| `@autlantic/payments-recurring` | Merchant SDK (create subscriptions, charge, webhooks) |
| `@autlantic/payments-recurring-core` | Types, intervals, retry policy |
| `@autlantic/chain-evm` | Base + USDC + vault + preflight |
| `@autlantic/billing-engine` | Subscriptions, invoices, refunds, webhook dispatch |

Most integrators only install `@autlantic/payments-recurring`. The other packages are available if you need lower-level types or chain helpers.

## Spec

Product/architecture notes: [recurring-payments-spec.md](https://github.com/autlantic/payments-sdk/blob/main/docs/recurring-payments-spec.md).
