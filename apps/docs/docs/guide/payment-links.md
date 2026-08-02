# Payment links

Share a **fixed-amount USDC** URL (or QR of that URL). The payer opens hosted checkout, connects a wallet, and pays once. Funds settle to your `payoutAddressEvm`.

- No vault mandate or renewals
- Public landing at `/checkout/link/:id`
- Opens into the existing one-time pay flow (`/checkout/pay/:id`)
- Optional `maxUses`, `expiresAt`, success/cancel URLs, and collect email/name

## Opens vs paid

Each time a payer starts checkout, the link’s **open** count increases (`useCount`). A separate **paid** count tracks confirmed USDC settlements. In the portal, Analytics shows opens → paid conversion and one-time / payment-link revenue.

## SDK (sandbox)

```ts
import { AutlanticBilling } from "@autlantic/payments-recurring";

const billing = AutlanticBilling.sandbox({ merchantId: "mer_demo" });

const { paymentLink, url } = await billing.createPaymentLink({
  merchantRefPrefix: "invoice",
  payoutAddressEvm: "0xYourMerchantWallet",
  amountUsdc: 42,
  description: "Consulting",
  maxUses: 1,
});

// Share `url` or encode as QR
const opened = await billing.openPaymentLink(paymentLink.id, {
  customerWallet: "0xPayerWallet",
});
await billing.confirmPayment(opened.payment.id);
```

## SDK (hosted)

```ts
const billing = AutlanticBilling.fromEnv();

const { paymentLink, url } = await billing.createPaymentLink({
  merchantRefPrefix: "invoice",
  payoutAddressEvm: "0xYourMerchantWallet",
  amountUsdc: 42,
  description: "Consulting",
  // Optional: priceId for a portal “once” price instead of amountUsdc
  // maxUses, expiresAt, successUrl, cancelUrl, collectEmail, collectName
});
// url → https://billing…/checkout/link/:id
```

## HTTP

```bash
curl -X POST "$AUTLANTIC_BILLING_API_URL/v1/payment-links" \
  -H "x-autlantic-api-key: $AUTLANTIC_BILLING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amountUsdc": 42,
    "merchantRefPrefix": "invoice",
    "description": "Consulting",
    "payoutAddressEvm": "0x…",
    "collectEmail": true,
    "collectName": true,
    "successUrl": "https://yoursite.example/thanks",
    "cancelUrl": "https://yoursite.example/cancel"
  }'
```

Public:

- `GET /checkout/link/:id` — landing
- `GET /checkout/link/:id/status` — status JSON
- `POST /checkout/link/:id/open` — mint payment (`{ customerWallet? }`, optional email/name collected at checkout)

## Portal

In the merchant portal:

1. **Payment links** — create from amount or a catalog **once** price; set max uses, expiry, single-use, success/cancel URLs, collect email/name; copy URL / QR; see **opens** vs **paid** per link and drill into payments
2. **Invoices** — one-time / link payments appear alongside subscription invoices (name and email on the receipt when collected)
3. **Customers** — wallets merge subscription + payment-link history; search by name/email; internal notes
4. **Analytics** — link opens, paid count, conversion, and one-time revenue charts

## Webhooks

Opening a link emits `payment.created`. Confirming pay emits `payment.paid`.

## E2E smoke

```bash
pnpm --filter @autlantic/payments-recurring exec tsx examples/e2e-payment-links.mts
```
