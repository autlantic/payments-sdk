/**
 * Storefront plan card. In sandbox these are demo plans.
 * In hosted mode they come from GET /v1/products (one card per active price).
 */
export type StorePlan = {
  id: string;
  name: string;
  description: string;
  amountUsdc: number;
  interval: "month" | "year";
  features: string[];
  highlighted?: boolean;
  /** Set when the plan maps to a portal catalog price. */
  priceId?: string;
  productId?: string;
};

export const DEMO_PLANS: StorePlan[] = [
  {
    id: "plan_starter",
    name: "Starter",
    description: "For indie products shipping their first paid plan.",
    amountUsdc: 9,
    interval: "month",
    features: ["Unlimited API calls (demo)", "Email support", "Cancel anytime"],
  },
  {
    id: "plan_pro",
    name: "Pro",
    description: "The plan most merchants pick for production workloads.",
    amountUsdc: 29,
    interval: "month",
    features: ["Everything in Starter", "Priority webhooks", "Invoice PDFs", "Team seats"],
    highlighted: true,
  },
  {
    id: "plan_pro_yearly",
    name: "Pro Yearly",
    description: "Two months free when billed annually.",
    amountUsdc: 290,
    interval: "year",
    features: ["Everything in Pro", "Annual discount", "Dedicated onboarding"],
  },
];

export function getDemoPlan(planId: string): StorePlan | undefined {
  return DEMO_PLANS.find((p) => p.id === planId);
}
