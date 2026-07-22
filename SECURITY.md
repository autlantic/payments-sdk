# Security — Autlantic Recurring Billing SDK

Applies to `@autlantic/payments-recurring`, `@autlantic/payments-recurring-core`, `@autlantic/chain-evm`, and `@autlantic/billing-engine` (USDC on Base).

## Secrets

- Store `AUTLANTIC_BILLING_API_KEY`, `AUTLANTIC_BILLING_WEBHOOK_SECRET`, and any relayer keys in environment variables, not source code.
- Rotate webhook secrets if leaked; old signatures will fail verification.

## Webhooks

- Always verify `x-autlantic-signature` with `verifyBillingWebhook` or `parseBillingWebhookEvent` before trusting the body.
- Use the raw request body for verification (do not re-serialize JSON).

## On-chain verification

- The SDK verifies **USDC** transfers and vault charges on **Base** (mainnet or Sepolia sandbox) to the merchant `payoutAddressEvm`.
- Autlantic does not custody member subscription revenue. Funds settle to the configured EVM wallet.
- Treat plan amounts as the expected charge; overpayments on one-time pass flows are handled by product rules, not by holding balances.

## Sandbox

- Never enable `AUTLANTIC_BILLING_SANDBOX` in production against mainnet wallets.
- Use Base Sepolia for integration tests before going live.

## Reporting

Report security issues to your Autlantic operator / maintainer privately.
