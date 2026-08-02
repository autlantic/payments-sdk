# Example store: recurring, one-time, payment links

Next.js demo for the three Autlantic Billing methods via `@autlantic/payments-recurring`:

| Flow | SDK method | Route |
|------|------------|-------|
| **Recurring** | `createSubscription` → `/checkout/subscribe/:id` | [`/recurring`](./src/app/recurring) |
| **One-time** | `createPayment` → `/checkout/pay/:id` | [`/one-time`](./src/app/one-time) |
| **Payment links** | `createPaymentLink` → `/checkout/link/:id` | [`/payment-links`](./src/app/payment-links) |

Also includes `/account`, `/webhooks`, `/settings`, and sandbox payer page `/pay/link/:id`.

## Quick start (sandbox)

```bash
pnpm install
pnpm --filter @autlantic/payments-recurring build
pnpm --filter @autlantic/example-subscription-store dev
```

Open [http://localhost:3040](http://localhost:3040). No API key required.

### Try each flow (sandbox)

1. **Recurring** → Subscribe → **Account** for invoices / cancel  
2. **One-time** → Pay → **Confirm payment (sandbox)** (`confirmPayment`)  
3. **Payment links** → Create link + QR (optional max uses / expiry) → list / disable → open payer page  

## Hosted mode (portal catalog)

1. In [portal.autlantic.com](https://portal.autlantic.com), create products with **month/year** and **once** prices  
2. Create an API key; note merchant ID and payout wallet  
3. Example → **Settings**: Billing API URL `https://billing.autlantic.com`, API key, merchant ID, payout, webhook secret  
4. Badge switches to **Hosted API mode**  
5. Flows redirect to Autlantic hosted checkout (`/checkout/subscribe|:pay|:link/:id`)  
6. Payment links can use portal **once** prices via `priceId`

### What the portal shows after a pay

- **Payment links**: opens vs paid per link; payments list under each link  
- **Invoices**: one-time / link charges with collected name and email when enabled  
- **Customers**: merged wallet history (subscriptions + payment links); search by name/email; internal notes  
- **Analytics**: link conversion and one-time revenue  
- **Webhooks**: failed deliveries highlighted with **Retry now**

Railway: point Config-as-code at repo-root `railway.example-store.toml` (builds SDK packages, then this Next app).

## SDK surface

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });
// or hosted:
// const billing = new AutlanticBilling({
//   apiBaseUrl: process.env.AUTLANTIC_BILLING_API_URL,
//   apiKey: process.env.AUTLANTIC_BILLING_API_KEY,
//   merchantId: process.env.AUTLANTIC_BILLING_MERCHANT_ID!,
//   sandbox: true, // test key
// });

await billing.createSubscription({ /* … */ });
await billing.createPayment({ /* … */ });
await billing.createPaymentLink({ /* … */ });
```

## API routes in this example

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/plans` | Demo plans or portal month/year prices |
| `GET` | `/api/one-time/products` | Demo products or portal once prices |
| `POST` | `/api/one-time/create` | `billing.createPayment` |
| `POST` | `/api/one-time/pay` | Sandbox `billing.confirmPayment` |
| `GET` | `/api/one-time/:id` | `billing.getPayment` |
| `POST` | `/api/subscribe` | `createSubscription` (+ activate in sandbox) |
| `GET/POST` | `/api/subscriptions/:id` | Fetch / cancel / activate |
| `POST` | `/api/payment-links/create` | `createPaymentLink` (`priceId`, `amountUsdc`, `maxUses`, `expiresAt`) |
| `GET` | `/api/payment-links` | `listPaymentLinks` |
| `GET` | `/api/payment-links/:id` | `getPaymentLink` |
| `POST` | `/api/payment-links/:id/disable` | `disablePaymentLink` |
| `POST` | `/api/payment-links/:id/open` | Sandbox `openPaymentLink` |
| `POST` | `/api/payment-links/:id/pay` | Sandbox open + `confirmPayment` |
| `POST` | `/api/webhooks/billing` | `verifyBillingWebhook` |

## Notes

- Sandbox state is in-process memory (SDK local store). Restart clears it.
- Hosted catalog comes from `listProducts`.
- Do not set the billing API URL to the portal UI host.

## Docs

- [Getting started](https://docs.autlantic.com/guide/getting-started)
- [Payment links](https://docs.autlantic.com/guide/payment-links)
- [One-time payments](https://docs.autlantic.com/guide/one-time-payments)
- [Billing portal](https://portal.autlantic.com)
