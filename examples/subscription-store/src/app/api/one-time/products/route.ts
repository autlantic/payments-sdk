import { getBilling, isHostedMode } from "@/lib/billing";
import {
  catalogDisplayName,
  descriptionFromProduct,
  featuresFromProduct,
} from "@/lib/catalog";
import { ONE_TIME_PRODUCTS, type OneTimeProduct } from "@/lib/one-time-products";
import { NextResponse } from "next/server";

export type CatalogOneTimeProduct = OneTimeProduct & {
  priceId?: string;
  productId?: string;
};

export async function GET() {
  if (!isHostedMode()) {
    return NextResponse.json({ source: "demo" as const, products: ONE_TIME_PRODUCTS });
  }

  try {
    const billing = getBilling();
    const { products: catalog } = await billing.listProducts();
    const products: CatalogOneTimeProduct[] = [];

    for (const product of catalog) {
      if (!product.active) continue;
      const oncePrices = product.prices.filter((p) => p.active && p.interval === "once");
      for (const price of oncePrices) {
        products.push({
          id: price.id,
          priceId: price.id,
          productId: product.id,
          name: catalogDisplayName(product.name, "once", oncePrices.length > 1),
          description: descriptionFromProduct(product, "once"),
          amountUsdc: price.amountUsdc,
          features: featuresFromProduct(product, "once"),
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
