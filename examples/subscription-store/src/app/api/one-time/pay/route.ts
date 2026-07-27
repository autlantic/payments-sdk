import { getOneTimePayment, markOneTimePaid } from "@/lib/one-time";
import { NextResponse } from "next/server";

/**
 * Sandbox helper: mark a one-time payment paid without an on-chain tx.
 * In production you would wait for the wallet transfer and call /verify.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { paymentId?: string };
    if (!body.paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const existing = getOneTimePayment(body.paymentId);
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (existing.mode !== "sandbox") {
      return NextResponse.json(
        { error: "Sandbox pay only works in sandbox mode. Use /api/one-time/verify with a tx hash." },
        { status: 400 },
      );
    }

    const payment = markOneTimePaid(body.paymentId);
    return NextResponse.json({ payment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Pay failed" },
      { status: 500 },
    );
  }
}
