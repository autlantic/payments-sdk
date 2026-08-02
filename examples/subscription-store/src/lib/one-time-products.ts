export type OneTimeProduct = {
  id: string;
  name: string;
  description: string;
  amountUsdc: number;
  features: string[];
  highlighted?: boolean;
  storeTypeId?: string;
};

export const ONE_TIME_PRODUCTS: OneTimeProduct[] = [
  {
    id: "pass_course",
    name: "Forge Course",
    description: "Recorded shipping course. Pay once, unlock forever.",
    amountUsdc: 149,
    storeTypeId: "course",
    features: ["Lifetime access", "No mandate", "Receipt + tx hash"],
    highlighted: true,
  },
  {
    id: "pass_ticket",
    name: "Workshop ticket",
    description: "Northside Saturday seat. Single charge, no renewal.",
    amountUsdc: 45,
    storeTypeId: "event",
    features: ["One seat", "Instant unlock", "No subscription"],
  },
  {
    id: "pass_day",
    name: "Day pass",
    description: "24-hour access for a coworking or product trial.",
    amountUsdc: 5,
    storeTypeId: "event",
    features: ["Instant unlock", "No mandate", "Single USDC transfer"],
  },
  {
    id: "pass_credit_pack",
    name: "Credit pack",
    description: "One-shot purchase of demo credits for your own app logic.",
    amountUsdc: 15,
    storeTypeId: "course",
    features: ["100 demo credits", "No subscription", "Refundable in your app"],
  },
];

export function getOneTimeProduct(id: string): OneTimeProduct | undefined {
  return ONE_TIME_PRODUCTS.find((p) => p.id === id);
}
