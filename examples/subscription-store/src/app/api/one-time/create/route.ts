import { getBilling, getModeLabel, getPayoutAddress, isHostedMode } from "@/lib/billing";
import { getOneTimeProduct } from "@/lib/one-time-products";
import { NextResponse } from "next/server";

/** Sandbox simulate wallet. Hosted checkout replaces this when the buyer connects. */
const DEMO_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
/** Placeholder until Autlantic hosted checkout wallet connect. */
const PENDING_CHECKOUT_WALLET = "0x0000000000000000000000000000000000000001";

/**
 * Create a one-time payment via `@autlantic/payments-recurring`
 * (`createPayment`). Hosted mode returns `/checkout/pay/:id`.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      productId?: string;
      priceId?: string;
      customerWallet?: string;
      amountUsdc?: number;
    };

    const hosted = isHostedMode();
    const billing = getBilling();
    const customerWallet =
      body.customerWallet?.trim() || (hosted ? PENDING_CHECKOUT_WALLET : DEMO_WALLET);

    const priceId = body.priceId?.trim();
    let amountUsdc = body.amountUsdc;
    let productName: string | undefined;
    let merchantRefProduct = body.productId ?? "one_time";

    if (hosted && priceId) {
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

    if (!hosted && (amountUsdc == null || !(amountUsdc > 0))) {
      return NextResponse.json(
        { error: "Sandbox createPayment requires amountUsdc (pick a demo product)" },
        { status: 400 },
      );
    }

    if (hosted && !priceId && (amountUsdc == null || !(amountUsdc > 0))) {
      return NextResponse.json(
        { error: "Hosted one-time requires priceId or amountUsdc" },
        { status: 400 },
      );
    }

    const created = await billing.createPayment(
      hosted && priceId
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
      mode: getModeLabel(),
      payment: {
        ...created.payment,
        productName: productName ?? created.payment.productName,
        // UI still keys off this for the simulate button in sandbox
        mode: hosted ? created.payment.mode : "sandbox",
      },
      checkoutUrl: created.checkoutUrl,
      hint: hosted
        ? undefined
        : "Call POST /api/one-time/pay with { paymentId } to confirmPayment (sandbox).",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create payment" },
      { status: 400 },
    );
  }
}
