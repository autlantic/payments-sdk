import { AutlanticBilling } from "@autlantic/payments-recurring";

/**
 * Credentials for sandbox vs hosted billing-api.
 * Portal UI (portal.autlantic.com) is separate from the REST API host.
 * Filled from the Settings UI (or .env). In-memory for this Next.js process.
 */
export type PortalConfig = {
  /** Merchant portal UI base (links / docs only). */
  portalUrl: string;
  /** Hosted billing REST API base (no trailing slash). */
  apiUrl: string;
  apiKey: string;
  merchantId: string;
  payoutAddressEvm: string;
  webhookSecret: string;
  sandbox: boolean;
};

const DEFAULT_PORTAL_URL = "https://portal.autlantic.com";
const DEFAULT_API_URL = "https://billing.autlantic.com";

const globalForConfig = globalThis as unknown as {
  __autlanticPortalConfig?: PortalConfig | null;
  __autlanticBilling?: AutlanticBilling | null;
};

function envConfig(): PortalConfig {
  return {
    portalUrl:
      process.env.NEXT_PUBLIC_BILLING_PORTAL_URL?.trim() ||
      process.env.AUTLANTIC_BILLING_PORTAL_URL?.trim() ||
      DEFAULT_PORTAL_URL,
    apiUrl: process.env.AUTLANTIC_BILLING_API_URL?.trim() || DEFAULT_API_URL,
    apiKey: process.env.AUTLANTIC_BILLING_API_KEY?.trim() || "",
    merchantId: process.env.AUTLANTIC_BILLING_MERCHANT_ID?.trim() || "mer_demo_store",
    payoutAddressEvm:
      process.env.AUTLANTIC_PAYOUT_ADDRESS_EVM?.trim() ||
      "0x1111111111111111111111111111111111111111",
    webhookSecret: process.env.AUTLANTIC_BILLING_WEBHOOK_SECRET?.trim() || "whsec_demo_store",
    sandbox:
      process.env.AUTLANTIC_BILLING_SANDBOX === "1" ||
      process.env.AUTLANTIC_BILLING_SANDBOX === "true" ||
      process.env.AUTLANTIC_BILLING_SANDBOX == null,
  };
}

/** Active config: Settings UI override, else env defaults. */
export function getPortalConfig(): PortalConfig {
  return globalForConfig.__autlanticPortalConfig ?? envConfig();
}

export function getPortalConfigPublic(): Omit<PortalConfig, "apiKey" | "webhookSecret"> & {
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  mode: "sandbox" | "hosted";
  webhookUrlHint: string;
} {
  const c = getPortalConfig();
  return {
    portalUrl: c.portalUrl,
    apiUrl: c.apiUrl,
    merchantId: c.merchantId,
    payoutAddressEvm: c.payoutAddressEvm,
    sandbox: c.sandbox,
    hasApiKey: Boolean(c.apiKey),
    hasWebhookSecret: Boolean(c.webhookSecret),
    mode: isHostedMode() ? "hosted" : "sandbox",
    webhookUrlHint: "/api/webhooks/billing",
  };
}

/** Save Settings form values and rebuild the billing client. */
export function setPortalConfig(input: Partial<PortalConfig>): PortalConfig {
  const current = getPortalConfig();
  const next: PortalConfig = {
    portalUrl:
      (input.portalUrl ?? current.portalUrl).trim().replace(/\/$/, "") || current.portalUrl,
    apiUrl: (input.apiUrl ?? current.apiUrl).trim().replace(/\/$/, "") || current.apiUrl,
    apiKey: (input.apiKey ?? current.apiKey).trim(),
    merchantId: (input.merchantId ?? current.merchantId).trim() || "mer_demo_store",
    payoutAddressEvm:
      (input.payoutAddressEvm ?? current.payoutAddressEvm).trim() ||
      "0x1111111111111111111111111111111111111111",
    webhookSecret: (input.webhookSecret ?? current.webhookSecret).trim() || "whsec_demo_store",
    sandbox: input.sandbox ?? current.sandbox,
  };
  globalForConfig.__autlanticPortalConfig = next;
  globalForConfig.__autlanticBilling = null;
  return next;
}

export function clearPortalConfig(): void {
  globalForConfig.__autlanticPortalConfig = null;
  globalForConfig.__autlanticBilling = null;
}

export function isHostedMode(): boolean {
  const c = getPortalConfig();
  return Boolean(c.apiUrl && c.apiKey);
}

export function getBilling(): AutlanticBilling {
  if (globalForConfig.__autlanticBilling) {
    return globalForConfig.__autlanticBilling;
  }

  const c = getPortalConfig();

  if (isHostedMode()) {
    globalForConfig.__autlanticBilling = new AutlanticBilling({
      apiBaseUrl: c.apiUrl,
      apiKey: c.apiKey,
      merchantId: c.merchantId,
      sandbox: c.sandbox,
      webhookSecret: c.webhookSecret,
    });
  } else {
    globalForConfig.__autlanticBilling = AutlanticBilling.sandbox({
      merchantId: c.merchantId,
      webhookSecret: c.webhookSecret,
    });
  }

  return globalForConfig.__autlanticBilling;
}

export function getPayoutAddress(): string {
  return getPortalConfig().payoutAddressEvm;
}

export function getWebhookSecret(): string {
  return getPortalConfig().webhookSecret;
}

export function getModeLabel(): "sandbox" | "hosted" {
  return isHostedMode() ? "hosted" : "sandbox";
}
