import { getBilling } from "@/lib/billing";
import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const billing = getBilling();
    const payment = await billing.getPayment(id);
    return NextResponse.json({
      payment: {
        ...payment,
        productName: payment.metadata?.productName ?? payment.productName,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment not found" },
      { status: 404 },
    );
  }
}
