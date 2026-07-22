import {
  attemptInvoiceCharge,
  cancelSubscription,
  completeMandate,
  createMemoryBillingStore,
  createSubscription,
  refundInvoice,
  updateSubscription,
  voidInvoice,
  type BillingStore,
  type ChargeInvoiceResult,
  type CreateSubscriptionResult,
  type SandboxChargeMode,
} from "@autlantic/billing-engine";
import { defaultSandboxChainId, VAULT_PLACEHOLDER_BASE_SEPOLIA } from "@autlantic/chain-evm";
import type { BillingInterval, RecurringInvoice, RecurringSubscription } from "@autlantic/payments-recurring-core";
import type { AutlanticBillingConfig, CreateSubscriptionRequest } from "./config";

export const AUTLANTIC_BILLING_SDK_VERSION = "0.2.5";

type ApiEnvelope<T> = T & { error?: string };

export class AutlanticBilling {
  private readonly config: AutlanticBillingConfig;
  private readonly localStore: BillingStore | null;

  constructor(config: AutlanticBillingConfig) {
    this.config = config;
    this.localStore =
      !config.apiBaseUrl && config.sandbox !== false
        ? createMemoryBillingStore()
        : null;
  }

  static sandbox(input: { merchantId: string; webhookSecret?: string }): AutlanticBilling {
    return new AutlanticBilling({
      merchantId: input.merchantId,
      sandbox: true,
      webhookSecret: input.webhookSecret ?? "whsec_billing_test",
    });
  }

  static fromEnv(env: Record<string, string | undefined> = process.env): AutlanticBilling {
    return new AutlanticBilling({
      apiBaseUrl: env.AUTLANTIC_BILLING_API_URL?.trim(),
      apiKey: env.AUTLANTIC_BILLING_API_KEY?.trim(),
      merchantId: env.AUTLANTIC_BILLING_MERCHANT_ID?.trim() ?? "mer_default",
      sandbox:
        env.AUTLANTIC_BILLING_SANDBOX === "1" ||
        env.AUTLANTIC_BILLING_SANDBOX === "true",
      webhookSecret: env.AUTLANTIC_BILLING_WEBHOOK_SECRET?.trim(),
    });
  }

  async createSubscription(
    input: CreateSubscriptionRequest,
  ): Promise<CreateSubscriptionResult & { checkoutUrl?: string }> {
    if (this.localStore) {
      const result = createSubscription(this.localStore, {
        merchantId: this.config.merchantId,
        merchantRef: input.merchantRef,
        walletAddress: input.customerWallet,
        payoutAddressEvm: input.payoutAddressEvm,
        amountUsdc: input.amountUsdc,
        interval: input.interval,
        chainId: defaultSandboxChainId(),
        planId: input.planId,
        metadata: input.metadata,
        vaultAddress: VAULT_PLACEHOLDER_BASE_SEPOLIA,
      });
      return {
        ...result,
        checkoutUrl: `sandbox://complete/${result.subscription.id}`,
      };
    }

    return this.post("/v1/subscriptions", input);
  }

  async listSubscriptions(input?: { status?: string }): Promise<{ subscriptions: RecurringSubscription[] }> {
    if (this.localStore) {
      let subs = this.localStore.listSubscriptionsByMerchant(this.config.merchantId);
      if (input?.status) subs = subs.filter((s) => s.status === input.status);
      return { subscriptions: subs };
    }
    const query = input?.status ? `?status=${encodeURIComponent(input.status)}` : "";
    return this.get(`/v1/subscriptions${query}`);
  }

  async getCheckoutSession(id: string): Promise<{ session: unknown }> {
    const base = this.config.apiBaseUrl?.replace(/\/$/, "");
    if (!base) throw new Error("apiBaseUrl is required for remote mode");
    const res = await fetch(`${base}/checkout/subscribe/${id}.json`);
    const json = (await res.json()) as ApiEnvelope<{ session: unknown }>;
    if (!res.ok) throw new Error(json.error ?? `Session failed (${res.status})`);
    return json;
  }

  async activateSubscription(
    id: string,
    input: { onChainSubscriptionId?: string } = {},
  ): Promise<{
    subscription: RecurringSubscription;
    charge: ChargeInvoiceResult | null;
    txHash?: string;
  }> {
    if (this.localStore) {
      const { activateSubscriptionCheckout } = await import("@autlantic/billing-engine");
      const result = activateSubscriptionCheckout(this.localStore, id, { sandbox: true });
      if (!result) throw new Error("Could not activate subscription");
      return { subscription: result.subscription, charge: result.charge };
    }

    if (this.config.sandbox === false) {
      return this.post(`/v1/subscriptions/${id}/activate`, input);
    }

    const base = this.config.apiBaseUrl?.replace(/\/$/, "");
    if (!base) throw new Error("apiBaseUrl is required for remote mode");
    const res = await fetch(`${base}/checkout/subscribe/${id}/activate`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as ApiEnvelope<{
      subscription: RecurringSubscription;
      charge: ChargeInvoiceResult | null;
      txHash?: string;
    }>;
    if (!res.ok) throw new Error(json.error ?? `Activation failed (${res.status})`);
    return json;
  }

  async getSubscription(id: string): Promise<RecurringSubscription> {
    if (this.localStore) {
      const sub = this.localStore.getSubscription(id);
      if (!sub) throw new Error("Subscription not found");
      return sub;
    }
    return this.get(`/v1/subscriptions/${id}`);
  }

  async updateSubscription(
    id: string,
    input: {
      amountUsdc?: number;
      interval?: BillingInterval;
      planId?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<{ subscription: RecurringSubscription }> {
    if (this.localStore) {
      const result = updateSubscription(this.localStore, id, input);
      if (!result) throw new Error("Could not update subscription");
      return { subscription: result.subscription };
    }
    return this.patch(`/v1/subscriptions/${id}`, input);
  }

  async completeSubscription(id: string): Promise<{ subscription: RecurringSubscription }> {
    if (this.localStore) {
      const result = completeMandate(this.localStore, id);
      if (!result) throw new Error("Could not complete subscription");
      return { subscription: result.subscription };
    }
    return this.post(`/v1/subscriptions/${id}/complete`, {});
  }

  async cancelSubscription(
    id: string,
    immediate = false,
  ): Promise<{ subscription: RecurringSubscription }> {
    if (this.localStore) {
      const result = cancelSubscription(this.localStore, id, immediate);
      if (!result) throw new Error("Could not cancel subscription");
      return { subscription: result.subscription };
    }
    return this.post(`/v1/subscriptions/${id}/cancel`, { immediate });
  }

  async listInvoices(input?: { subscriptionId?: string }): Promise<{ invoices: RecurringInvoice[] }> {
    if (this.localStore) {
      let invoices = this.localStore.listInvoicesByMerchant(this.config.merchantId);
      if (input?.subscriptionId) {
        invoices = invoices.filter((i) => i.subscriptionId === input.subscriptionId);
      }
      return { invoices };
    }
    const query = input?.subscriptionId
      ? `?subscriptionId=${encodeURIComponent(input.subscriptionId)}`
      : "";
    return this.get(`/v1/invoices${query}`);
  }

  async chargeInvoice(
    invoiceId: string,
    sandboxMode?: SandboxChargeMode,
  ): Promise<ChargeInvoiceResult> {
    if (this.localStore) {
      const result = attemptInvoiceCharge(this.localStore, invoiceId, {
        sandbox: true,
        sandboxMode,
      });
      if (!result) throw new Error("Invoice not chargeable");
      return result;
    }
    return this.post(`/v1/invoices/${invoiceId}/charge`, { sandboxMode });
  }

  async refundInvoice(
    invoiceId: string,
    input: { amountUsdc?: number } = {},
  ): Promise<{ invoice: RecurringInvoice }> {
    if (this.localStore) {
      const result = refundInvoice(this.localStore, invoiceId, {
        sandbox: true,
        refundAmountUsdc: input.amountUsdc,
      });
      if (!result) throw new Error("Invoice not refundable");
      return { invoice: result.invoice };
    }
    return this.post(`/v1/invoices/${invoiceId}/refund`, input);
  }

  async voidInvoice(invoiceId: string): Promise<{ invoice: RecurringInvoice }> {
    if (this.localStore) {
      const result = voidInvoice(this.localStore, invoiceId);
      if (!result) throw new Error("Invoice not voidable");
      return { invoice: result.invoice };
    }
    return this.post(`/v1/invoices/${invoiceId}/void`, {});
  }

  async getInvoice(id: string): Promise<RecurringInvoice> {
    if (this.localStore) {
      const invoice = this.localStore.getInvoice(id);
      if (!invoice) throw new Error("Invoice not found");
      return invoice;
    }
    return this.get(`/v1/invoices/${id}`);
  }

  private headers(extra?: Record<string, string>): Headers {
    const headers = new Headers(extra);
    if (this.config.apiKey) {
      headers.set("X-Autlantic-Api-Key", this.config.apiKey);
    }
    return headers;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.fetch(path, { method: "GET" });
    return res as T;
  }

  private async post<T>(path: string, body: unknown, idempotent = true): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idempotent) {
      headers["Idempotency-Key"] = `sdk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
    const res = await this.fetch(path, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return res as T;
  }

  private async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res as T;
  }

  private async fetch(path: string, init: RequestInit): Promise<unknown> {
    const base = this.config.apiBaseUrl;
    if (!base) throw new Error("apiBaseUrl is required for remote mode");

    const headers = this.headers(
      init.headers ? Object.fromEntries(new Headers(init.headers).entries()) : undefined,
    );

    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      ...init,
      headers,
    });

    const json = (await res.json()) as ApiEnvelope<unknown>;
    if (!res.ok) {
      throw new Error(json.error ?? `Billing API error ${res.status}`);
    }
    return json;
  }
}
