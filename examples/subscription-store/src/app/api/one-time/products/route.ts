import { getBilling, isHostedMode } from "@/lib/billing";
import { ONE_TIME_PRODUCTS, type OneTimeProduct } from "@/lib/one-time-products";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isHostedMode()) {
    return NextResponse.json({ source: "demo" as const, products: ONE_TIME_PRODUCTS });
  }

  try {
    const billing = getBilling();
    const { products: catalog } = await billing.listProducts();
    const products: (OneTimeProduct & { priceId: string; productId: string })[] = [];

    for (const product of catalog) {
      for (const price of product.prices) {
        if (!price.active || price.interval !== "once") continue;
        const multi =
          product.prices.filter((p) => p.active && p.interval === "once").length > 1;
        products.push({
          id: price.id,
          priceId: price.id,
          productId: product.id,
          name: multi ? `${product.name} (once)` : product.name,
          description: product.description?.trim() || "From your billing portal catalog.",
          amountUsdc: price.amountUsdc,
          features: ["Portal catalog price", `Price ${price.id}`],
          highlighted: products.length === 0,
        });
      }
    }

    if (products.length === 0) {
      return NextResponse.json({
        source: "portal" as const,
        products: [],
        hint: "No active one-time prices yet. In the portal, add a product price with interval Once, then refresh.",
      });
    }

    return NextResponse.json({ source: "portal" as const, products });
  } catch (e) {
    return NextResponse.json(
      {
        source: "error" as const,
        products: [],
        error: e instanceof Error ? e.message : "Could not load products",
      },
      { status: 502 },
    );
  }
}
