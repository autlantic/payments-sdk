# Payment links

Share a **fixed-amount USDC** URL (or QR of that URL). The payer opens hosted checkout, connects a wallet, and pays once. Funds settle to your `payoutAddressEvm`.

- No vault mandate or renewals
- Public landing at `/checkout/link/:id`
- Opens into the existing one-time pay flow (`/checkout/pay/:id`)
- Optional `maxUses` and `expiresAt`

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
    "payoutAddressEvm": "0x…"
  }'
```

Public:

- `GET /checkout/link/:id` — landing
- `GET /checkout/link/:id/status` — status JSON
- `POST /checkout/link/:id/open` — mint payment (`{ customerWallet? }`)

## Portal

In the merchant portal, open **Payment links** to create a link, copy the URL, and show a QR.

## Webhooks

Opening a link emits `payment.created`. Confirming pay emits `payment.paid`.

## E2E smoke

```bash
pnpm --filter @autlantic/payments-recurring exec tsx examples/e2e-payment-links.mts
```
