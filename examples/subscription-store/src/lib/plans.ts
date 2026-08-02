export type StorePlan = {
  id: string;
  name: string;
  description: string;
  amountUsdc: number;
  interval: "month" | "year";
  features: string[];
  highlighted?: boolean;
  storeTypeId?: string;
  priceId?: string;
  productId?: string;
};

export const DEMO_PLANS: StorePlan[] = [
  {
    id: "plan_starter",
    name: "Nova Starter",
    description: "SaaS starter seat for indie teams shipping their first paid plan.",
    amountUsdc: 9,
    interval: "month",
    storeTypeId: "saas",
    features: ["1 project", "Email support", "Cancel anytime"],
  },
  {
    id: "plan_pro",
    name: "Nova Pro",
    description: "B2B analytics seat most merchants pick for production workloads.",
    amountUsdc: 29,
    interval: "month",
    storeTypeId: "saas",
    features: ["Unlimited projects", "Priority webhooks", "Invoice PDFs", "Team seats"],
    highlighted: true,
  },
  {
    id: "plan_creator",
    name: "Signal Desk",
    description: "Creator membership. Private drops and alpha chat every month.",
    amountUsdc: 12,
    interval: "month",
    storeTypeId: "creator",
    features: ["Weekly brief", "Member Discord", "Cancel at period end"],
  },
  {
    id: "plan_pro_yearly",
    name: "Nova Pro Yearly",
    description: "Same Pro seat billed yearly. Two months free.",
    amountUsdc: 290,
    interval: "year",
    storeTypeId: "saas",
    features: ["Everything in Pro", "Annual discount", "Dedicated onboarding"],
  },
];

export function getDemoPlan(planId: string): StorePlan | undefined {
  return DEMO_PLANS.find((p) => p.id === planId);
}
