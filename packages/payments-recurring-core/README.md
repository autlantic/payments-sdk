# @autlantic/payments-recurring-core

Shared types and pure billing rules for Autlantic recurring USDC payments on Base.

No network I/O. Safe for workers, tests, and edge runtimes.

## Install

```bash
npm install @autlantic/payments-recurring-core
```

Most apps should install [`@autlantic/payments-recurring`](https://www.npmjs.com/package/@autlantic/payments-recurring) instead. That client re-exports the types you need day to day.

## What this package provides

- Billing intervals and period helpers
- Subscription / invoice TypeScript types
- Default retry policy for failed charges
- Webhook event type helpers
- Input validation utilities

## Docs

- Product docs: [docs.autlantic.com](https://docs.autlantic.com)
- Spec: [recurring-payments-spec.md](https://github.com/autlantic/payments-sdk/blob/main/docs/recurring-payments-spec.md)
- Source: [github.com/autlantic/payments-sdk](https://github.com/autlantic/payments-sdk)

## License

[MIT](https://github.com/autlantic/payments-sdk/blob/main/LICENSE) © Autlantic
