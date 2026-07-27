import type { BillingCatalogProduct } from "@autlantic/payments-recurring";

export type CatalogInterval = "month" | "year" | "once";

export function intervalTitle(interval: CatalogInterval): string {
  if (interval === "month") return "Monthly";
  if (interval === "year") return "Yearly";
  return "One-time";
}

/**
 * Features for a portal product card.
 * Uses metadata.features (comma / newline / pipe separated) when present.
 * Never surfaces raw price or product IDs.
 */
export function featuresFromProduct(
  product: BillingCatalogProduct,
  interval: CatalogInterval,
): string[] {
  const raw = product.metadata?.features?.trim();
  if (raw) {
    return raw
      .split(/[\n,|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (interval === "once") {
    return ["Pay once", "No renewals", "USDC on Base"];
  }
  if (interval === "year") {
    return ["Billed yearly", "Cancel anytime", "USDC on Base"];
  }
  return ["Billed monthly", "Cancel anytime", "USDC on Base"];
}

/** Card description: portal text, else a short interval default (no jargon). */
export function descriptionFromProduct(
  product: BillingCatalogProduct,
  interval: CatalogInterval,
): string {
  const text = product.description?.trim();
  if (text) return text;
  if (interval === "once") return "Single USDC payment. No mandate.";
  if (interval === "year") return "Billed yearly in USDC.";
  return "Billed monthly in USDC.";
}

/** Display name when a product has multiple active prices of the same kind. */
export function catalogDisplayName(
  productName: string,
  interval: CatalogInterval,
  multi: boolean,
): string {
  if (!multi) return productName;
  return `${productName} (${intervalTitle(interval)})`;
}

export function formatUsdc(amount: number): string {
  return amount.toFixed(2);
}
