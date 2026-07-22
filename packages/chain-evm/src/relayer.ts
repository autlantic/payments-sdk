import {
  chainConfigFor,
  encodeApproveCalldata,
  usdcToMicro,
  type ChainConfig,
} from "./constants";
import type { BillingChainId } from "@autlantic/payments-recurring-core";

export type RelayerChargeIntent = {
  chainId: BillingChainId;
  vaultAddress: string;
  /** Vault `subscriptions` mapping key (uint256). */
  onChainSubscriptionId: string;
  /** Billing-engine subscription id for logs. */
  engineSubscriptionId?: string;
  customerWallet: string;
  merchantWallet: string;
  amountUsdc: number;
  /** ABI-encoded charge(uint256 subscriptionId) call data. */
  chargeCalldata: string;
  sandbox: boolean;
};

/** keccak256("charge(uint256)") first 4 bytes */
const CHARGE_SELECTOR = "0xe457e1e5";

export function encodeChargeCalldata(subscriptionIdNumeric: bigint): string {
  const idHex = subscriptionIdNumeric.toString(16).padStart(64, "0");
  return `${CHARGE_SELECTOR}${idHex}`;
}

export function normalizeOnChainSubscriptionId(value: string): bigint {
  const digits = String(value).replace(/\D/g, "");
  if (!digits || digits === "0") {
    throw new Error("Invalid on-chain subscription id");
  }
  return BigInt(digits);
}

export function buildRelayerChargeIntent(input: {
  chainId: BillingChainId;
  vaultAddress: string;
  onChainSubscriptionId: string;
  engineSubscriptionId?: string;
  customerWallet: string;
  merchantWallet: string;
  amountUsdc: number;
  sandbox: boolean;
}): RelayerChargeIntent {
  const numericId = normalizeOnChainSubscriptionId(input.onChainSubscriptionId);
  return {
    chainId: input.chainId,
    vaultAddress: input.vaultAddress,
    onChainSubscriptionId: numericId.toString(10),
    engineSubscriptionId: input.engineSubscriptionId,
    customerWallet: input.customerWallet,
    merchantWallet: input.merchantWallet,
    amountUsdc: input.amountUsdc,
    chargeCalldata: encodeChargeCalldata(numericId),
    sandbox: input.sandbox,
  };
}

export function buildApproveTransaction(input: {
  chainId: BillingChainId;
  vaultAddress: string;
  allowanceCapUsdc: number;
}): { to: string; data: string; chain: ChainConfig } {
  const chain = chainConfigFor(input.chainId);
  return {
    to: chain.usdcAddress,
    data: encodeApproveCalldata(input.vaultAddress, usdcToMicro(input.allowanceCapUsdc)),
    chain,
  };
}

export function logRelayerIntent(intent: RelayerChargeIntent): void {
  console.log(
    `[relayer${intent.sandbox ? "-sandbox" : ""}] charge`,
    `onChain=${intent.onChainSubscriptionId}`,
    intent.engineSubscriptionId ? `engine=${intent.engineSubscriptionId}` : "",
    `${intent.amountUsdc} USDC`,
    intent.customerWallet,
    "→",
    intent.merchantWallet,
    intent.chargeCalldata.slice(0, 18) + "…",
  );
}
