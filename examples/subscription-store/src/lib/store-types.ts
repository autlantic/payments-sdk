export type PaymentMethod = "recurring" | "one-time" | "payment-link";

export type StoreTypeExample = {
  id: string;
  name: string;
  industry: string;
  pitch: string;
  method: PaymentMethod;
  methodLabel: string;
  amountLabel: string;
  whenToUse: string;
  sdkHint: string;
  href: string;
};

export const STORE_TYPE_EXAMPLES: StoreTypeExample[] = [
  {
    id: "saas",
    name: "Nova Analytics",
    industry: "B2B SaaS",
    pitch: "Usage dashboard with Starter and Pro seats that renew every month.",
    method: "recurring",
    methodLabel: "Recurring",
    amountLabel: "from $29 USDC / month",
    whenToUse: "Ongoing access, seats, or API quotas that renew on a schedule.",
    sdkHint: "createSubscription → /checkout/subscribe/:id",
    href: "/recurring?focus=plan_pro",
  },
  {
    id: "creator",
    name: "Signal Desk",
    industry: "Creator membership",
    pitch: "Paid newsletter and alpha room. Members pay monthly for private drops.",
    method: "recurring",
    methodLabel: "Recurring",
    amountLabel: "$12 USDC / month",
    whenToUse: "Community, content, or Discord access that should bill every cycle.",
    sdkHint: "createSubscription + invoice.paid webhooks",
    href: "/recurring?focus=plan_creator",
  },
  {
    id: "freelance",
    name: "Maya Studio",
    industry: "Freelance invoice",
    pitch: "Send a fixed consulting invoice. Client opens the link or scans a QR.",
    method: "payment-link",
    methodLabel: "Payment link",
    amountLabel: "$850 USDC once",
    whenToUse: "Custom amounts, deposits, or invoices you share over email or chat.",
    sdkHint: "createPaymentLink → /checkout/link/:id",
    href: "/payment-links?preset=invoice",
  },
  {
    id: "course",
    name: "Forge Course",
    industry: "Digital product",
    pitch: "Self-serve checkout for a recorded course. Pay once, unlock forever.",
    method: "one-time",
    methodLabel: "One-time",
    amountLabel: "$149 USDC once",
    whenToUse: "Downloads, courses, licenses, or any catalog SKU without renewals.",
    sdkHint: "createPayment → /checkout/pay/:id",
    href: "/one-time?focus=pass_course",
  },
  {
    id: "event",
    name: "Northside Workshop",
    industry: "Events & tickets",
    pitch: "Sell a Saturday seat from your site. Single charge, no membership vault.",
    method: "one-time",
    methodLabel: "One-time",
    amountLabel: "$45 USDC once",
    whenToUse: "Tickets, day passes, and limited SKUs buyers pick on your storefront.",
    sdkHint: "createPayment with product metadata",
    href: "/one-time?focus=pass_ticket",
  },
  {
    id: "popup",
    name: "Corner Pop-up",
    industry: "In-person / QR",
    pitch: "Print a QR at the counter. Customer scans, pays USDC, you settle on Base.",
    method: "payment-link",
    methodLabel: "Payment link",
    amountLabel: "$18 USDC once",
    whenToUse: "Tips, walk-up orders, or any amount you want payers to open from a phone.",
    sdkHint: "createPaymentLink → /checkout/link/:id",
    href: "/payment-links?preset=popup",
  },
];

export type PaymentLinkPreset = {
  id: string;
  label: string;
  description: string;
  amountUsdc: number;
  storeTypeId: string;
};

export const PAYMENT_LINK_PRESETS: PaymentLinkPreset[] = [
  {
    id: "invoice",
    label: "Consulting invoice",
    description: "Maya Studio · brand site rebuild deposit",
    amountUsdc: 850,
    storeTypeId: "freelance",
  },
  {
    id: "popup",
    label: "Counter QR order",
    description: "Corner Pop-up · walk-up coffee + pastry",
    amountUsdc: 18,
    storeTypeId: "popup",
  },
  {
    id: "deposit",
    label: "Project deposit",
    description: "Agency kickoff · 50% before work starts",
    amountUsdc: 1200,
    storeTypeId: "freelance",
  },
  {
    id: "tip",
    label: "Creator tip jar",
    description: "One-off tip shared in bio or stream overlay",
    amountUsdc: 5,
    storeTypeId: "popup",
  },
];

export function getPaymentLinkPreset(id: string): PaymentLinkPreset | undefined {
  return PAYMENT_LINK_PRESETS.find((p) => p.id === id);
}
