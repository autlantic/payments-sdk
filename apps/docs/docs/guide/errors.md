# Error codes

Invoice charge failures use a stable `failureCode` on `RecurringInvoice` (and related webhook `data`). Treat these as the public contract for handling declines.

```ts
import type { InvoiceFailureCode, RecurringInvoice } from "@autlantic/payments-recurring-core";

function explain(invoice: RecurringInvoice): string {
  switch (invoice.failureCode) {
    case "INSUFFICIENT_BALANCE":
      return "Member wallet needs more USDC";
    case "ALLOWANCE_REVOKED":
      return "Member must re-approve the vault";
    default:
      return invoice.failureMessage ?? "Charge failed";
  }
}
```

## `InvoiceFailureCode`

| Code | When it happens | Typical next step |
|------|-----------------|-------------------|
| `INSUFFICIENT_BALANCE` | Wallet USDC balance too low for the charge | Ask the member to fund the wallet; wait for [retry](/guide/retries) |
| `ALLOWANCE_REVOKED` | ERC-20 allowance to the vault spender is zero / revoked | Send member back through approve / checkout |
| `ALLOWANCE_TOO_LOW` | Allowance exists but is below this charge (or remaining cap) | Ask member to raise allowance / renew mandate |
| `MANDATE_INACTIVE` | Mandate not `active` (pending, revoked, or expired) | Complete activation or create a new subscription |
| `RELAYER_ERROR` | Live chain / relayer submit or confirmation failed | Retry later; check RPC / relayer health |
| `SANDBOX_DECLINED` | In-process sandbox forced a decline (`sandboxMode`) | Expected in tests; use `"success"` mode for happy path |

Optional human text may also appear on `invoice.failureMessage`. Prefer branching on `failureCode`.

## Where codes appear

- `RecurringInvoice.failureCode` after a failed `chargeInvoice` / renewal
- Webhook `invoice.payment_failed` payload `data` (includes invoice fields)
- Hosted API JSON for charge endpoints when the invoice remains unpaid

## HTTP / client errors

The Node client throws **`AutlanticBillingError`** (extends `Error`) when:

- Remote API returns non-2xx (`json.error` or status text)
- Sandbox resource is missing or an operation cannot complete
- Remote mode is used without `apiBaseUrl`
- Webhook assertion helpers reject a signature / body

```ts
import { AutlanticBillingError } from "@autlantic/payments-recurring";

if (AutlanticBillingError.is(err)) {
  // err.code, err.type, err.statusCode, err.requestId
}
```

These are transport / client errors, not `InvoiceFailureCode` values. For hosted HTTP, non-2xx bodies typically look like `{ "error": "…" }`.

See [Debugging](/guide/debugging) for opt-in logs and webhook verify reasons.

## Related

- [Retries](/guide/retries)
- [Lifecycle](/guide/lifecycle)
- [TypeScript types](/api/types)
