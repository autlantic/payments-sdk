/**
 * One-time catalog. Settled as a single USDC transfer to the merchant wallet
 * (see @autlantic/chain-evm UsdcPassPaymentIntent), not a recurring mandate.
 */
export type OneTimeProduct = {
  id: string;
  name: string;
  description: string;
  amountUsdc: number;
  features: string[];
  highlighted?: boolean;
};

export const ONE_TIME_PRODUCTS: OneTimeProduct[] = [
  {
    id: "pass_day",
    name: "Day pass",
    description: "24-hour access. Pay once, no renewal.",
    amountUsdc: 5,
    features: ["Instant unlock", "No mandate", "Single USDC transfer"],
  },
  {
    id: "pass_lifetime",
    name: "Lifetime unlock",
    description: "One payment for permanent access to the demo product.",
    amountUsdc: 49,
    features: ["Pay once", "Receipt + tx hash", "No recurring charges"],
    highlighted: true,
  },
  {
    id: "pass_credit_pack",
    name: "Credit pack",
    description: "One-shot purchase of demo credits.",
    amountUsdc: 15,
    features: ["100 demo credits", "No subscription", "Refundable in your own app logic"],
  },
];

export function getOneTimeProduct(id: string): OneTimeProduct | undefined {
  return ONE_TIME_PRODUCTS.find((p) => p.id === id);
}
