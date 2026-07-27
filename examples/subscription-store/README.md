# Example store: one-time + recurring

A minimal Next.js storefront with **both** Autlantic payment patterns:

| Flow | Package | Route |
|------|---------|-------|
| **One-time** USDC payment | `@autlantic/payments-recurring` + `@autlantic/chain-evm` | [`/one-time`](./src/app/one-time) |
| **Recurring** subscription | `@autlantic/payments-recurring` | [`/recurring`](./src/app/recurring) |

Also includes `/account` (subscriptions), `/webhooks` (signed event inbox), and `/settings` (portal + API credentials).

## Quick start (sandbox)

From the repo root:

```bash
pnpm install
pnpm --filter @autlantic/payments-recurring build
pnpm --filter @autlantic/chain-evm build
pnpm --filter @autlantic/example-subscription-store dev
```

Open [http://localhost:3040](http://localhost:3040).

No API key required. Recurring uses built-in demo plans. One-time uses local simulate pay.

### Try one-time (sandbox)

1. Open **One-time**
2. Select a product → **Create payment**
3. **Simulate USDC transfer (sandbox)** → paid state + fake tx hash

### Try recurring (sandbox)

1. Open **Recurring**
2. Select a plan → **Subscribe (sandbox)**
3. Open **Account** to see invoices / cancel

## Production path (portal catalog → hosted checkout)

1. In [portal.autlantic.com](https://portal.autlantic.com), create a **Product** with prices:
   - **Monthly / Yearly** for subscriptions
   - **One-time** for single charges
2. Create an **API key** (Developers → API keys) and note your **Merchant ID** and **payout wallet**.
3. Open this example → **Settings** and set:
   - **Portal URL**: `https://portal.autlantic.com` (UI links only)
   - **Billing API URL**: `https://billing.autlantic.com` (or `http://localhost:8788` locally)
   - API key, merchant ID, payout wallet, webhook secret
4. Save. The badge switches to **Hosted API mode**.
5. **Recurring:** plans load from `GET /v1/products` → subscribe redirects to `/checkout/subscribe/:id`.
6. **One-time:** create payment redirects to `/checkout/pay/:id` (same Autlantic hosted checkout pattern).
7. Confirm subscriptions / payments appear under the portal where applicable.

See also: [One-time payments guide](https://docs.autlantic.com/guide/one-time-payments).

### Webhooks (local)

Tunnel the example and register the endpoint in the portal:

```text
https://YOUR_TUNNEL/api/webhooks/billing
```

Use **Reset to sandbox** anytime. You can also use `.env.local` (see `.env.example`) instead of the form.

## SDK surface

### One-time

```ts
import {
  encodeTransferCalldata,
  verifyUsdcPassPaymentFromTxHash,
  type UsdcPassPaymentIntent,
} from "@autlantic/chain-evm";
```

### Recurring

```ts
import {
  AutlanticBilling,
  verifyBillingWebhook,
  parseBillingWebhookEvent,
} from "@autlantic/payments-recurring";

const billing = new AutlanticBilling({
  apiBaseUrl: process.env.AUTLANTIC_BILLING_API_URL,
  apiKey: process.env.AUTLANTIC_BILLING_API_KEY,
  merchantId: process.env.AUTLANTIC_BILLING_MERCHANT_ID!,
});

const { products } = await billing.listProducts();
await billing.createSubscription({
  merchantRef: "order_123",
  customerWallet: "0x…",
  payoutAddressEvm: "0x…",
  priceId: products[0].prices[0].id,
});
```

## API routes in this example

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/plans` | Demo plans (sandbox) or portal catalog (hosted) |
| `POST` | `/api/one-time/create` | Create payment intent + transfer calldata |
| `POST` | `/api/one-time/pay` | Sandbox: mark paid |
| `POST` | `/api/one-time/verify` | Verify tx hash against intent |
| `POST` | `/api/subscribe` | Create (+ activate in sandbox) subscription |
| `GET/POST` | `/api/subscriptions/:id` | Fetch / cancel / activate |
| `POST` | `/api/webhooks/billing` | Verify `x-autlantic-signature` |

## Notes

- Sandbox state is in-process memory. Restart clears payments and subscriptions.
- Portal Products/Prices drive the **recurring** hosted flow via `priceId`.
- Do not set the billing API URL to the portal UI host.
- MIT code; Autlantic trademarks remain owned by Autlantic.

## Docs

- [Getting started](https://docs.autlantic.com/guide/getting-started)
- [Node.js API](https://docs.autlantic.com/api/nodejs)
- [Webhooks](https://docs.autlantic.com/guide/webhooks)
- [Billing portal](https://portal.autlantic.com)
