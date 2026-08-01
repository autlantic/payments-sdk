# @autlantic/payments-recurring

Autlantic Billing SDK. Create USDC subscriptions, one-time payments, and shareable payment links on Base. Receive webhooks. Test and Live environments.

Public docs: https://docs.autlantic.com

## Install

```bash
npm install @autlantic/payments-recurring
```

## Test vs Live (hosted API)

Mode follows your API key (Stripe-style):

| Key | Environment |
|-----|-------------|
| `abk_test_…` | Test · Base Sepolia |
| `abk_live_…` | Live · Base mainnet |

```bash
# Staging
AUTLANTIC_BILLING_API_URL=https://billing.autlantic.com
AUTLANTIC_BILLING_API_KEY=abk_test_…
AUTLANTIC_BILLING_MERCHANT_ID=mer_…
AUTLANTIC_BILLING_WEBHOOK_SECRET=whsec_…   # Test webhook endpoint secret

# Production: same vars, live key + Live endpoint secret
```

Create keys and webhook endpoints in the merchant portal under Test or Live. Use one key per deploy.

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.fromEnv();

const { products } = await billing.listProducts();
const { subscription, checkoutUrl } = await billing.createSubscription({
  merchantRef: "order_123",
  customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  priceId: products[0]?.prices[0]?.id,
});
```

Payment link (share URL or QR; payer wallet collected at checkout):

```ts
const { paymentLink, url } = await billing.createPaymentLink({
  merchantRefPrefix: "invoice",
  payoutAddressEvm: "0xYourMerchantWallet…",
  amountUsdc: 42,
  description: "Consulting",
});
// url → /checkout/link/:id
```

## Quickstart (in-process sandbox)

No hosted API required. Useful for local demos:

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

const { subscription } = await billing.createSubscription({
  merchantRef: "order_123",
  customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  payoutAddressEvm: "0xYourMerchantWallet…",
  amountUsdc: 20,
  interval: "month",
});

const { charge } = await billing.activateSubscription(subscription.id);
```

## Hosted API

Point `AUTLANTIC_BILLING_API_URL` at your billing API. Mode, chain, and checkout badge come from the API key. See [API.md](./API.md) and https://docs.autlantic.com/guide/sandbox.
