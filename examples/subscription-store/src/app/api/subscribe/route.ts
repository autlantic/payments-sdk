import { getBilling, getPayoutAddress, isHostedMode } from "@/lib/billing";
import { getDemoPlan, type StorePlan } from "@/lib/plans";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      planId?: string;
      priceId?: string;
      customerWallet?: string;
      activate?: boolean;
    };

    const wallet = body.customerWallet?.trim();
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: "customerWallet must be a valid 0x… address (40 hex chars)" },
        { status: 400 },
      );
    }

    const billing = getBilling();
    const hosted = isHostedMode();
    const priceId = body.priceId?.trim() || undefined;
    let plan: StorePlan | undefined;

    if (hosted && priceId) {
      const { products } = await billing.listProducts();
      for (const product of products) {
        const price = product.prices.find((p) => p.id === priceId && p.active);
        if (price) {
          plan = {
            id: price.id,
            priceId: price.id,
            productId: product.id,
            name: product.name,
            description: product.description ?? "",
            amountUsdc: price.amountUsdc,
            interval: price.interval,
            features: [],
          };
          break;
        }
      }
      if (!plan) {
        return NextResponse.json({ error: "Unknown or inactive priceId" }, { status: 400 });
      }
    } else {
      plan = getDemoPlan(body.planId ?? "");
      if (!plan) {
        return NextResponse.json({ error: "Unknown planId" }, { status: 400 });
      }
    }

    const merchantRef = `store_${plan.id}_${Date.now()}`;

    const created = await billing.createSubscription(
      hosted && plan.priceId
        ? {
            merchantRef,
            customerWallet: wallet,
            payoutAddressEvm: getPayoutAddress(),
            priceId: plan.priceId,
            planId: plan.productId ?? plan.id,
            metadata: {
              source: "example-subscription-store",
              planName: plan.name,
            },
          }
        : {
            merchantRef,
            customerWallet: wallet,
            payoutAddressEvm: getPayoutAddress(),
            amountUsdc: plan.amountUsdc,
            interval: plan.interval,
            planId: plan.id,
            metadata: {
              source: "example-subscription-store",
              planName: plan.name,
            },
          },
    );

    // Sandbox: optionally complete mandate + first charge in one step.
    // Hosted: return checkoutUrl so the browser can open Autlantic checkout.
    if (!hosted && body.activate !== false) {
      const activated = await billing.activateSubscription(created.subscription.id);
      return NextResponse.json({
        mode: "sandbox",
        plan,
        subscription: activated.subscription,
        invoice: activated.charge?.invoice ?? created.invoice,
        charge: activated.charge,
        checkoutUrl: created.checkoutUrl,
      });
    }

    return NextResponse.json({
      mode: hosted ? "hosted" : "sandbox",
      plan,
      subscription: created.subscription,
      invoice: created.invoice,
      checkoutUrl: created.checkoutUrl,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Subscribe failed" },
      { status: 500 },
    );
  }
}
