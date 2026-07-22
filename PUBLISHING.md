# Publishing @autlantic/* to npm

## Packages (publish order)

1. `@autlantic/payments-recurring-core`
2. `@autlantic/chain-evm`
3. `@autlantic/billing-engine`
4. `@autlantic/payments-recurring`

## Prerequisites

- npm login as a user with access to scope `@autlantic`
- Clean git tree recommended

```bash
npm login
```

## Publish

```bash
pnpm check
pnpm publish:sdk
```

Or publish one package:

```bash
pnpm --filter @autlantic/payments-recurring publish --access public
```

## After install

```bash
npm install @autlantic/payments-recurring
```

## Version bumps

Bump `version` in the package `package.json` files together, update [apps/docs/docs/resources/changelog.md](./apps/docs/docs/resources/changelog.md), then publish.
