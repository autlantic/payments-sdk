import { getBilling, getModeLabel, isHostedMode } from "@/lib/billing";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const billing = getBilling();
    const { paymentLink, url } = await billing.disablePaymentLink(id);
    const origin = new URL(req.url).origin;
    const shareUrl =
      isHostedMode() && url && !url.startsWith("sandbox://")
        ? url
        : `${origin}/pay/link/${paymentLink.id}`;

    return NextResponse.json({
      mode: getModeLabel(),
      paymentLink,
      url: shareUrl,
      sdkUrl: url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not disable payment link" },
      { status: 400 },
    );
  }
}
