# Lifecycle

How a USDC subscription moves from create → activate → renew → fail/retry → cancel, and which webhooks fire.

## Happy path

```mermaid
sequenceDiagram
  participant App as Your backend
  participant SDK as AutlanticBilling
  participant Chain as Base / vault
  participant Hook as Your webhook URL

  App->>SDK: createSubscription(...)
  SDK-->>App: subscription incomplete + open invoice
  Note over Hook: subscription.created, invoice.created

  App->>SDK: activateSubscription(id)
  Note over Chain: mandate + first charge (sandbox or live)
  SDK-->>App: subscription active, invoice paid
  Note over Hook: subscription.activated, invoice.paid

  loop Each billing period
    Note over SDK: renewal invoice created when due
    SDK->>Chain: chargeInvoice / worker charge
    Chain-->>SDK: success
    Note over Hook: invoice.created, invoice.paid
  end

  App->>SDK: cancelSubscription(id)
  Note over Hook: subscription.canceled
```

## Subscription state machine

```mermaid
stateDiagram-v2
  [*] --> incomplete: createSubscription
  incomplete --> active: activateSubscription (mandate + first charge)
  active --> past_due: retries exhausted
  active --> canceled: cancelSubscription
  past_due --> canceled: cancelSubscription
  past_due --> active: successful recovery charge
  canceled --> [*]
```

## Invoice status flow

```mermaid
stateDiagram-v2
  [*] --> open: invoice created
  open --> paid: successful charge
  open --> open: payment_failed (retry scheduled)
  open --> uncollectible: retries exhausted
  open --> void: voidInvoice
  paid --> refunded: refundInvoice
```

## First charge vs renewals

| Step | API | Charges? |
|------|-----|----------|
| Create | `createSubscription` | No. Opens first invoice. |
| Activate | `activateSubscription` | **Yes.** Completes mandate and pays the first open invoice. |
| Complete only | `completeSubscription` | No. Mandate only; you charge later. |
| Renewal | `chargeInvoice` or Autlantic worker | Yes, for later open invoices. |

Do **not** call `chargeInvoice` on the same invoice immediately after a successful `activateSubscription`.

## Webhook timeline (typical)

| Order | Event | Meaning |
|-------|-------|---------|
| 1 | `subscription.created` | Incomplete subscription stored |
| 2 | `invoice.created` | First (or renewal) invoice opened |
| 3 | `subscription.activated` | Mandate active after activate |
| 4 | `invoice.paid` | Charge succeeded |
| — | `invoice.payment_failed` | Charge failed; see [retries](/guide/retries) |
| — | `subscription.past_due` | Automatic retries exhausted |
| — | `subscription.updated` | Plan / amount / metadata changes |
| — | `invoice.refunded` / `invoice.voided` | Money returned or invoice canceled |
| — | `subscription.canceled` | Subscription ended |

Full verify guide: [Webhooks](/guide/webhooks).

## Related

- [Getting started](/guide/getting-started)
- [Error codes](/guide/errors)
- [Retries](/guide/retries)
- [TypeScript types](/api/types)
