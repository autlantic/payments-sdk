import { getBilling, isHostedMode } from "@/lib/billing";
import {
  catalogDisplayName,
  descriptionFromProduct,
  featuresFromProduct,
} from "@/lib/catalog";
import { DEMO_PLANS, type StorePlan } from "@/lib/plans";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isHostedMode()) {
    return NextResponse.json({ source: "demo" as const, plans: DEMO_PLANS });
  }

  try {
    const billing = getBilling();
    const { products } = await billing.listProducts();
    const plans: StorePlan[] = [];

    for (const product of products) {
      if (!product.active) continue;
      const recurringPrices = product.prices.filter(
        (p) => p.active && (p.interval === "month" || p.interval === "year"),
      );
      for (const price of recurringPrices) {
        const interval = price.interval as "month" | "year";
        plans.push({
          id: price.id,
          priceId: price.id,
          productId: product.id,
          name: catalogDisplayName(product.name, interval, recurringPrices.length > 1),
          description: descriptionFromProduct(product, interval),
          amountUsdc: price.amountUsdc,
          interval,
          features: featuresFromProduct(product, interval),
          highlighted: plans.length === 0,
        });
      }
    }

    if (plans.length === 0) {
      return NextResponse.json({
        source: "portal" as const,
        plans: [],
        hint: "No active monthly or yearly prices yet. Create one in the portal under Products, then refresh.",
      });
    }

    return NextResponse.json({ source: "portal" as const, plans });
  } catch (e) {
    return NextResponse.json(
      {
        source: "error" as const,
        plans: [],
        error: e instanceof Error ? e.message : "Could not load products",
      },
      { status: 502 },
    );
  }
}
