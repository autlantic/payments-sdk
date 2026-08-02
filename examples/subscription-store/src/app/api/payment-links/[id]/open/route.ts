import { getBilling, getModeLabel, isHostedMode } from "@/lib/billing";
import { NextResponse } from "next/server";

const DEMO_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { customerWallet?: string };
    const wallet = body.customerWallet?.trim() || DEMO_WALLET;
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json({ error: "Invalid customerWallet" }, { status: 400 });
    }

    const billing = getBilling();

    if (isHostedMode()) {
      const { paymentLink, url } = await billing.getPaymentLink(id);
      if (url && !url.startsWith("sandbox://")) {
        return NextResponse.json({
          mode: getModeLabel(),
          paymentLink,
          checkoutUrl: url,
          redirect: true,
        });
      }
    }

    const opened = await billing.openPaymentLink(id, { customerWallet: wallet });
    return NextResponse.json({
      mode: getModeLabel(),
      payment: opened.payment,
      paymentLink: opened.paymentLink,
      checkoutUrl: opened.checkoutUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not open payment link" },
      { status: 400 },
    );
  }
}
