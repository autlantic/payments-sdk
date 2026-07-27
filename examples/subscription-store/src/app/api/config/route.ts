import {
  clearPortalConfig,
  getPortalConfig,
  getPortalConfigPublic,
  setPortalConfig,
  type PortalConfig,
} from "@/lib/billing";
import { NextResponse } from "next/server";

const DEMO_MERCHANT = "mer_demo_store";
const DEMO_PAYOUT = "0x1111111111111111111111111111111111111111";
const DEMO_WEBHOOK = "whsec_demo_store";

export async function GET() {
  const publicConfig = getPortalConfigPublic();
  const full = getPortalConfig();
  const hosted = publicConfig.mode === "hosted";
  return NextResponse.json({
    ...publicConfig,
    // Don't present sandbox demo placeholders as if the merchant configured them.
    merchantId:
      !hosted && full.merchantId === DEMO_MERCHANT ? "" : full.merchantId,
    payoutAddressEvm:
      !hosted && full.payoutAddressEvm.toLowerCase() === DEMO_PAYOUT.toLowerCase()
        ? ""
        : full.payoutAddressEvm,
    apiKey: full.apiKey ? maskSecret(full.apiKey) : "",
    webhookSecret:
      full.webhookSecret && full.webhookSecret !== DEMO_WEBHOOK
        ? maskSecret(full.webhookSecret)
        : full.webhookSecret && hosted
          ? maskSecret(full.webhookSecret)
          : "",
    apiKeySet: Boolean(full.apiKey),
    webhookSecretSet: Boolean(full.webhookSecret && full.webhookSecret !== DEMO_WEBHOOK),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PortalConfig> & { clear?: boolean };

    if (body.clear) {
      clearPortalConfig();
      return NextResponse.json({
        ok: true,
        cleared: true,
        ...getPortalConfigPublic(),
      });
    }

    const current = getPortalConfig();
    setPortalConfig({
      portalUrl: body.portalUrl,
      apiUrl: body.apiUrl,
      apiKey: isBlankOrMasked(body.apiKey) ? current.apiKey : body.apiKey,
      merchantId: body.merchantId,
      payoutAddressEvm: body.payoutAddressEvm,
      webhookSecret: isBlankOrMasked(body.webhookSecret)
        ? current.webhookSecret
        : body.webhookSecret,
      sandbox: body.sandbox,
    });

    return NextResponse.json({
      ok: true,
      ...getPortalConfigPublic(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save config" },
      { status: 400 },
    );
  }
}

function maskSecret(value: string): string {
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 6)}${"•".repeat(12)}${value.slice(-4)}`;
}

function isBlankOrMasked(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return value.includes("•");
}
