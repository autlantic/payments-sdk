# Node.js SDK

`@autlantic/payments-recurring` **0.2.5** (related packages: `payments-recurring-core`, `chain-evm`, and `billing-engine` at **0.2.4**).

## `AutlanticBilling`

### Factories

```ts
new AutlanticBilling({
  apiBaseUrl?: string;
  apiKey?: string;
  merchantId: string;
  sandbox?: boolean;
  webhookSecret?: string;
});

AutlanticBilling.sandbox({ merchantId, webhookSecret? });
AutlanticBilling.fromEnv();
```

Env vars: `AUTLANTIC_BILLING_API_URL`, `AUTLANTIC_BILLING_API_KEY`, `AUTLANTIC_BILLING_MERCHANT_ID`, `AUTLANTIC_BILLING_SANDBOX`, `AUTLANTIC_BILLING_WEBHOOK_SECRET`

### Methods

| Method | Description |
|--------|-------------|
| `createSubscription(input)` | Create incomplete subscription + open invoice |
| `listSubscriptions({ status? })` | List merchant subscriptions |
| `getSubscription(id)` | Fetch subscription |
| `updateSubscription(id, input)` | Update amount, interval, plan, metadata |
| `getCheckoutSession(id)` | Fetch hosted checkout session JSON |
| `completeSubscription(id)` | Mark wallet mandate active (no charge) |
| `activateSubscription(id, { onChainSubscriptionId? })` | Complete mandate + first charge |
| `cancelSubscription(id, immediate?)` | Cancel at period end or now |
| `listInvoices({ subscriptionId? })` | List invoices |
| `getInvoice(id)` | Fetch invoice |
| `chargeInvoice(id, sandboxMode?)` | Attempt invoice payment |
| `refundInvoice(id, { amountUsdc? })` | Refund a paid invoice |
| `voidInvoice(id)` | Void an open invoice |

### Webhooks

```ts
import {
  signBillingWebhook,
  verifyBillingWebhook,
  parseBillingWebhookEvent,
} from "@autlantic/payments-recurring";
```

Header: `x-autlantic-signature`
