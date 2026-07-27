import {
  clearPortalConfig,
  getPortalConfig,
  getPortalConfigPublic,
  setPortalConfig,
  type PortalConfig,
} from "@/lib/billing";
import { NextResponse } from "next/server";

export async function GET() {
  const publicConfig = getPortalConfigPublic();
  const full = getPortalConfig();
  return NextResponse.json({
    ...publicConfig,
    apiKey: full.apiKey ? maskSecret(full.apiKey) : "",
    webhookSecret: full.webhookSecret ? maskSecret(full.webhookSecret) : "",
    apiKeySet: Boolean(full.apiKey),
    webhookSecretSet: Boolean(full.webhookSecret),
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
