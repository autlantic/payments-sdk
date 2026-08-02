import { getBilling, getModeLabel, isHostedMode } from "@/lib/billing";
import { NextResponse } from "next/server";

/**
 * Sandbox helper: `confirmPayment` on the SDK client.
 * Hosted mode should use Autlantic `/checkout/pay/:id` instead.
 */
export async function POST(req: Request) {
  try {
    if (isHostedMode()) {
      return NextResponse.json(
        { error: "Hosted mode uses Autlantic checkout. Open the checkoutUrl instead." },
        { status: 400 },
      );
    }

    const body = (await req.json()) as { paymentId?: string };
    if (!body.paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const billing = getBilling();
    const paid = await billing.confirmPayment(body.paymentId, {
      txHash: `0xsandbox_pay_${Date.now().toString(16)}`,
    });

    return NextResponse.json({
      mode: getModeLabel(),
      payment: {
        ...paid.payment,
        mode: "sandbox",
        productName: paid.payment.metadata?.productName ?? paid.payment.productName,
      },
      alreadyPaid: paid.alreadyPaid,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Pay failed" },
      { status: 400 },
    );
  }
}
