import { getBilling, getModeLabel, isHostedMode } from "@/lib/billing";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    if (isHostedMode()) {
      return NextResponse.json(
        { error: "Hosted mode uses Autlantic checkout. Open the share URL instead." },
        { status: 400 },
      );
    }

    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as {
      paymentId?: string;
      customerWallet?: string;
    };

    const billing = getBilling();
    const wallet = body.customerWallet?.trim() || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

    let paymentId = body.paymentId?.trim();
    if (!paymentId) {
      const opened = await billing.openPaymentLink(id, { customerWallet: wallet });
      paymentId = opened.payment.id;
    }

    const paid = await billing.confirmPayment(paymentId, {
      txHash: `0xsandbox_link_${Date.now().toString(16)}`,
    });

    return NextResponse.json({
      mode: getModeLabel(),
      payment: paid.payment,
      alreadyPaid: paid.alreadyPaid,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pay failed" },
      { status: 400 },
    );
  }
}
