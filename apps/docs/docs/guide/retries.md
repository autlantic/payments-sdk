# Retries

Failed invoice charges use a default retry schedule from `@autlantic/payments-recurring-core`. Hosted Autlantic renewals and the billing engine follow this policy unless configured otherwise.

## Default policy

```ts
import { DEFAULT_RETRY_POLICY } from "@autlantic/payments-recurring-core";

// {
//   maxAttempts: 4,
//   retryDelaysDays: [0, 1, 2, 4],
// }
```

| Attempt | Meaning | Delay after previous failure |
|---------|---------|------------------------------|
| 1 | First charge try (`attemptCount` becomes 1 on failure) | Immediate / due time |
| 2 | First retry | **1 day** later |
| 3 | Second retry | **2 days** after previous failure |
| 4 | Final retry | **4 days** after previous failure |
| After 4 failures | No more automatic attempts | Subscription may move to `past_due` |

Helpers:

```ts
import {
  nextAttemptAtAfterFailure,
  hasMoreAttempts,
  shouldMarkPastDue,
  DEFAULT_RETRY_POLICY,
} from "@autlantic/payments-recurring-core";

const next = nextAttemptAtAfterFailure(failedAt, attemptCountAfterFailure);
// null when attempts are exhausted

hasMoreAttempts(invoice.attemptCount); // true while under maxAttempts
shouldMarkPastDue(invoice.attemptCount); // true at/after maxAttempts
```

## Invoice fields

On `RecurringInvoice`:

| Field | Role |
|-------|------|
| `attemptCount` | How many charge attempts have run |
| `nextAttemptAt` | When the next automatic attempt is scheduled |
| `failureCode` | Last failure ([Error codes](/guide/errors)) |
| `status` | Stays `open` during the retry window; may become `uncollectible` when giving up |

## What you should do as a merchant

1. Listen for `invoice.payment_failed` and `subscription.past_due`.
2. Message the member using `failureCode` (fund wallet, re-approve, etc.).
3. Do **not** spam `chargeInvoice` on the same open invoice unless you intend a manual retry outside the schedule.
4. After success, you get `invoice.paid` and the subscription period advances.

In the [merchant portal](https://portal.autlantic.com), open invoices with a failure code appear under **Invoices → Failed** and on the dashboard **Needs attention** list. Use **Retry payment** for a manual attempt. Past-due subscriptions show on **Customers** and **Subscriptions**.

## Sandbox

In-process sandbox can force declines with `chargeInvoice(id, "insufficient_balance" | "allowance_revoked")` so you can test retry messaging without waiting real days.

## Related

- [Error codes](/guide/errors)
- [Lifecycle](/guide/lifecycle)
- Source: [`retry-policy.ts`](https://github.com/autlantic/payments-sdk/blob/main/packages/payments-recurring-core/src/retry-policy.ts)
