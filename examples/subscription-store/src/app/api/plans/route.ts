import { getBilling, isHostedMode } from "@/lib/billing";
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
      for (const price of product.prices) {
        if (!price.active) continue;
        const multi = product.prices.filter((p) => p.active).length > 1;
        plans.push({
          id: price.id,
          priceId: price.id,
          productId: product.id,
          name: multi ? `${product.name} (${price.interval})` : product.name,
          description: product.description?.trim() || "From your billing portal catalog.",
          amountUsdc: price.amountUsdc,
          interval: price.interval,
          features: ["Portal catalog price", `Price ${price.id}`],
          highlighted: plans.length === 0,
        });
      }
    }

    if (plans.length === 0) {
      return NextResponse.json({
        source: "portal" as const,
        plans: [],
        hint: "No active products/prices yet. Create one in the portal under Products, then refresh.",
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
