# Contributing to Autlantic Payments SDK

Thanks for your interest in contributing. This repository powers the public
TypeScript packages for Autlantic Billing: recurring USDC subscriptions on Base,
invoices, webhooks, and the in-process sandbox.

By participating, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- Report bugs and documentation gaps
- Suggest features that help merchants integrate faster
- Improve types, tests, examples, or docs
- Fix issues labeled `good first issue` or `help wanted`

Security reports are handled privately. See [SECURITY.md](./SECURITY.md). Do not
open a public issue for vulnerabilities.

## Before you start

1. Search [existing issues](https://github.com/autlantic/payments-sdk/issues) to
   avoid duplicates.
2. For larger changes, open an issue first so we can align on scope.
3. Keep PRs focused. Prefer one concern per pull request.

## Development setup

Requires **Node.js 20+** and **pnpm**.

```bash
pnpm install
pnpm check      # build + test all packages
pnpm example    # sandbox demo
pnpm dev:docs   # local VitePress docs
```

Most integrators only need `@autlantic/payments-recurring`. Shared packages live
under `packages/`.

## Pull request checklist

- [ ] `pnpm check` passes locally
- [ ] Tests or examples cover the change when behavior changes
- [ ] Docs updated when APIs or setup steps change
- [ ] No secrets, API keys, or mainnet credentials in the diff
- [ ] Commit messages explain why the change exists

## Commit and PR style

- Use clear, present-tense messages (for example: `Add sandbox webhook helper`)
- Link related issues in the PR description
- Call out breaking changes explicitly

## Code review

Maintainers review for correctness, API clarity, security, and docs quality. We
may ask for small follow-ups before merging. Once merged, package publishes follow
[PUBLISHING.md](./PUBLISHING.md).

## Questions

- Docs: [docs.autlantic.com](https://docs.autlantic.com)
- Product: [autlantic.com](https://autlantic.com)
- Support: [support@autlantic.com](mailto:support@autlantic.com)
