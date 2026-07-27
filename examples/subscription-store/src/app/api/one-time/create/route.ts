import { getBilling, getPayoutAddress, isHostedMode } from "@/lib/billing";
import {
  createOneTimePayment,
  type OneTimePayment as LocalOneTimePayment,
} from "@/lib/one-time";
import { getOneTimeProduct } from "@/lib/one-time-products";
import { NextResponse } from "next/server";

/** Sandbox simulate wallet. Hosted checkout replaces this when the buyer connects. */
const DEMO_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
/** Placeholder until Autlantic hosted checkout wallet connect. */
const PENDING_CHECKOUT_WALLET = "0x0000000000000000000000000000000000000001";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      productId?: string;
      priceId?: string;
      customerWallet?: string;
      amountUsdc?: number;
    };

    const hosted = isHostedMode();
    const customerWallet =
      body.customerWallet?.trim() || (hosted ? PENDING_CHECKOUT_WALLET : DEMO_WALLET);

    // Hosted: create via Autlantic API and redirect to checkoutUrl (mirrors subscribe).
    if (hosted) {
      const billing = getBilling();
      const priceId = body.priceId?.trim();
      let amountUsdc = body.amountUsdc;
      let productName: string | undefined;
      let merchantRefProduct = body.productId ?? "one_time";

      if (priceId) {
        const { products } = await billing.listProducts();
        let matched = false;
        for (const product of products) {
          const price = product.prices.find((p) => p.id === priceId && p.active);
          if (price) {
            if (price.interval !== "once") {
              return NextResponse.json(
                { error: "priceId must have interval once for one-time checkout" },
                { status: 400 },
              );
            }
            amountUsdc = price.amountUsdc;
            productName = product.name;
            merchantRefProduct = product.id;
            matched = true;
            break;
          }
        }
        if (!matched) {
          return NextResponse.json({ error: "Unknown or inactive priceId" }, { status: 400 });
        }
      } else if (body.productId) {
        const local = getOneTimeProduct(body.productId);
        if (!local) {
          return NextResponse.json({ error: "Unknown productId" }, { status: 400 });
        }
        amountUsdc = local.amountUsdc;
        productName = local.name;
        merchantRefProduct = local.id;
      }

      const created = await billing.createPayment(
        priceId
          ? {
              merchantRef: `store_pay_${merchantRefProduct}_${Date.now()}`,
              customerWallet,
              payoutAddressEvm: getPayoutAddress(),
              priceId,
              metadata: {
                source: "example-subscription-store",
                ...(productName ? { productName } : {}),
              },
            }
          : {
              merchantRef: `store_pay_${merchantRefProduct}_${Date.now()}`,
              customerWallet,
              payoutAddressEvm: getPayoutAddress(),
              amountUsdc: amountUsdc!,
              metadata: {
                source: "example-subscription-store",
                ...(productName ? { productName } : {}),
              },
            },
      );

      return NextResponse.json({
        mode: "hosted",
        payment: created.payment,
        checkoutUrl: created.checkoutUrl,
      });
    }

    // Sandbox / local: keep in-memory simulate flow.
    if (!body.productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const payment: LocalOneTimePayment = createOneTimePayment({
      productId: body.productId,
      customerWallet,
      mode: "sandbox",
    });

    return NextResponse.json({
      mode: "sandbox",
      payment,
      hint: "Call POST /api/one-time/pay with { paymentId } to simulate the USDC transfer.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create payment" },
      { status: 400 },
    );
  }
}
