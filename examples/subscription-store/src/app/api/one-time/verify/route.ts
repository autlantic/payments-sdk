import { getOneTimePayment, markOneTimePaid, toPaymentIntent } from "@/lib/one-time";
import { verifyUsdcPassPaymentFromTxHash } from "@autlantic/chain-evm";
import { NextResponse } from "next/server";

/**
 * Verify an on-chain USDC transfer against the payment intent.
 * Requires an RPC-capable environment (live / hosted).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { paymentId?: string; txHash?: string };
    if (!body.paymentId || !body.txHash) {
      return NextResponse.json(
        { error: "paymentId and txHash are required" },
        { status: 400 },
      );
    }

    const existing = getOneTimePayment(body.paymentId);
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (existing.status === "paid") {
      return NextResponse.json({ payment: existing, alreadyPaid: true });
    }

    if (existing.mode === "sandbox") {
      // Allow demo verify without RPC by accepting a fake hash in sandbox.
      const payment = markOneTimePaid(body.paymentId, body.txHash);
      return NextResponse.json({
        payment,
        verification: { ok: true, mode: "sandbox" },
      });
    }

    const intent = toPaymentIntent(existing);
    const result = await verifyUsdcPassPaymentFromTxHash(intent, body.txHash);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code, verification: result },
        { status: 400 },
      );
    }

    const payment = markOneTimePaid(body.paymentId, body.txHash);
    return NextResponse.json({ payment, verification: result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verify failed" },
      { status: 500 },
    );
  }
}
