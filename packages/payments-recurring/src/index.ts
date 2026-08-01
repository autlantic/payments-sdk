export { AutlanticBilling, AUTLANTIC_BILLING_SDK_VERSION } from "./client";
export type {
  AutlanticBillingConfig,
  BillingCatalogPrice,
  BillingCatalogProduct,
  CreatePaymentLinkRequest,
  CreatePaymentRequest,
  CreateSubscriptionRequest,
} from "./config";
export {
  signBillingWebhook,
  verifyBillingWebhook,
  parseBillingWebhookEvent,
  BILLING_WEBHOOK_SIGNATURE_HEADER,
} from "./webhook";

export type {
  BillingInterval,
  BillingWebhookEvent,
  RecurringInvoice,
  RecurringSubscription,
  SubscriptionStatus,
} from "@autlantic/payments-recurring-core";

export type {
  OneTimePayment,
  OneTimePaymentStatus,
  CreateOneTimePaymentResult,
  PaymentLink,
  PaymentLinkStatus,
} from "@autlantic/billing-engine";

export {
  defaultSandboxChainId,
  chainConfigFor,
  usdcToMicro,
  encodeApproveCalldata,
} from "@autlantic/chain-evm";
