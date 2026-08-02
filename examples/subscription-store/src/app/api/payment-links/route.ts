import { getBilling, getModeLabel, isHostedMode } from "@/lib/billing";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const billing = getBilling();
    const links = await billing.listPaymentLinks();
    const origin = new URL(req.url).origin;
    const hosted = isHostedMode();

    const paymentLinks = links.map((link) => {
      const sdkUrl = link.url;
      const shareUrl =
        hosted && sdkUrl && !sdkUrl.startsWith("sandbox://")
          ? sdkUrl
          : `${origin}/pay/link/${link.id}`;
      return {
        ...link,
        url: shareUrl,
        sdkUrl,
      };
    });

    return NextResponse.json({
      mode: getModeLabel(),
      paymentLinks,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not list payment links" },
      { status: 500 },
    );
  }
}
