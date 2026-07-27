import { createOneTimePayment } from "@/lib/one-time";
import { isHostedMode } from "@/lib/billing";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      productId?: string;
      customerWallet?: string;
    };

    if (!body.productId || !body.customerWallet) {
      return NextResponse.json(
        { error: "productId and customerWallet are required" },
        { status: 400 },
      );
    }

    const payment = createOneTimePayment({
      productId: body.productId,
      customerWallet: body.customerWallet,
      mode: isHostedMode() ? "live" : "sandbox",
    });

    return NextResponse.json({
      payment,
      hint:
        payment.mode === "sandbox"
          ? "Call POST /api/one-time/pay with { paymentId } to simulate the USDC transfer."
          : "Send USDC with transferCalldata to usdcAddress, then POST /api/one-time/verify with the tx hash.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create payment" },
      { status: 400 },
    );
  }
}
