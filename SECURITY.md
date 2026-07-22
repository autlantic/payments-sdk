# Security Policy

Autlantic takes the security of the Payments SDK seriously. This policy covers the public packages in this repository:

- `@autlantic/payments-recurring`
- `@autlantic/payments-recurring-core`
- `@autlantic/chain-evm`
- `@autlantic/billing-engine`

Product site: [autlantic.com](https://autlantic.com)  
Docs: [docs.autlantic.com](https://docs.autlantic.com)

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | Yes |
| 0.1.x (legacy Tron) | No (removed) |

Always use the latest published release from npm when integrating.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security reports.

Email **[support@autlantic.com](mailto:support@autlantic.com)** with:

1. A short description of the issue and impact
2. Steps to reproduce, or a proof of concept
3. Affected package name and version
4. Your contact details for follow-up

We aim to acknowledge reports within **2 business days** and to provide an initial assessment within **7 business days**. Please give us a reasonable window to investigate and ship a fix before any public disclosure.

If the report involves live merchant funds, keys, or production data, say so clearly in the subject line.

## What to expect

1. Confirmation that we received your report
2. Triage (severity, severity, affected surfaces)
3. A fix or mitigation plan when the report is valid
4. Credit in release notes if you want to be named (optional)

## Secure integration checklist

Integrators should:

- Keep `AUTLANTIC_BILLING_API_KEY`, `AUTLANTIC_BILLING_WEBHOOK_SECRET`, RPC keys, and relayer keys in environment variables or a secret manager. Never commit them.
- Verify every webhook with `verifyBillingWebhook` (or equivalent) against the **raw** request body and the `x-autlantic-signature` header. Do not re-serialize JSON before verification.
- Keep `AUTLANTIC_BILLING_SANDBOX` off in production. Sandbox mode must not run against mainnet wallets or live payout addresses.
- Confirm Base chain id and USDC contract addresses match the environment (Sepolia vs mainnet).
- Treat on-chain USDC settlement as final. Autlantic does not custody merchant subscription revenue; funds go to `payoutAddressEvm`.
- Rotate API keys and webhook secrets after any suspected leak.

## Scope

### In scope

- Vulnerabilities in published `@autlantic/*` packages in this repo
- Signature bypass or forgery for billing webhooks
- Sandbox / production configuration hazards that can cause fund loss when documented APIs are used as intended
- Dependency issues that Autlantic ships and can patch in a release

### Out of scope

- Issues only in third-party wallets, RPCs, or Base network outages
- Social engineering, phishing, or physical attacks
- Reports without a clear reproduction path
- Vulnerabilities in forked or modified copies of this code
- Denial of service against public infrastructure you do not operate under an Autlantic agreement

## Brand and trademarks

“Autlantic”, the Autlantic wordmark, and related logos are trademarks of Autlantic.

You may use package names and factual references to Autlantic when integrating or documenting the SDK. You may not:

- Use Autlantic branding to suggest that Autlantic built, endorses, or operates your product
- Modify the logo in a misleading way
- Register domains, social accounts, or packages that impersonate Autlantic

Brand files in [`brand/`](./brand) are provided for documentation and approved partner use only.

## Contact

| Topic | Contact |
|-------|---------|
| Security reports | [support@autlantic.com](mailto:support@autlantic.com) |
| General support | [support@autlantic.com](mailto:support@autlantic.com) |
| Product | [autlantic.com](https://autlantic.com) |

Thank you for helping keep Autlantic merchants and members safe.
