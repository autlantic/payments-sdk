import type { BillingInterval } from "./types";

/**
 * Map storefront plan intervals to billing-engine intervals.
 * Test intervals (five_minute) only apply when allowTestIntervals is true (sandbox/dev).
 */
export function billingIntervalFromPlanInterval(
  planInterval: string,
  options?: { allowTestIntervals?: boolean },
): BillingInterval {
  const allowTest = options?.allowTestIntervals ?? false;

  switch (planInterval) {
    case "year":
    case "yearly":
      return "year";
    case "weekly":
      return "week";
    case "five_minute":
      return allowTest ? "five_minute" : "month";
    case "month":
    case "monthly":
    default:
      return "month";
  }
}
