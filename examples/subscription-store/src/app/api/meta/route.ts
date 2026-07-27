import { getModeLabel, getPortalConfigPublic } from "@/lib/billing";
import { NextResponse } from "next/server";

export async function GET() {
  const config = getPortalConfigPublic();
  return NextResponse.json({
    mode: getModeLabel(),
    portalUrl: config.portalUrl,
    apiUrl: config.apiUrl,
    docsUrl: "https://docs.autlantic.com",
    merchantId: config.merchantId,
    hasApiKey: config.hasApiKey,
  });
}
