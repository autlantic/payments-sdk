export type AutlanticBillingConfig = {
  /** REST API base URL (no trailing slash). Omit for in-process sandbox. */
  apiBaseUrl?: string;
  apiKey?: string;
  merchantId: string;
  sandbox?: boolean;
  webhookSecret?: string;
};

export type CreateSubscriptionRequest = {
  merchantRef: string;
  customerWallet: string;
  payoutAddressEvm: string;
  amountUsdc: number;
  interval: "month" | "year";
  planId?: string;
  metadata?: Record<string, string>;
};
