# Security

## Secrets

Store in environment variables, never in source:

- `AUTLANTIC_BILLING_API_KEY`
- `AUTLANTIC_BILLING_WEBHOOK_SECRET`
- Relayer / RPC keys for live charging

Rotate webhook secrets if leaked; old signatures will fail.

## Webhooks

Always verify `x-autlantic-signature` before trusting the body. Use the raw request bytes.

## On-chain

- USDC on **Base** settles to the merchant `payoutAddressEvm`.
- Autlantic does not custody member subscription revenue.

## Sandbox

Never enable `AUTLANTIC_BILLING_SANDBOX` against mainnet wallets in production.

## Checklist

- [ ] Sandbox off for production
- [ ] Chain id and USDC contract match the environment
- [ ] API keys rotated
- [ ] Webhook signature verification enabled
- [ ] Merchant payout address configured
