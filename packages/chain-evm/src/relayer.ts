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

export type RelayerLogFn = (message: string, meta?: Record<string, unknown>) => void;

/**
 * Format a relayer charge intent for ops logs.
 * Silent by default; pass `log` to emit (e.g. your BillingLogger.info).
 */
export function logRelayerIntent(intent: RelayerChargeIntent, log?: RelayerLogFn): void {
  if (!log) return;
  log(`[relayer${intent.sandbox ? "-sandbox" : ""}] charge`, {
    onChainSubscriptionId: intent.onChainSubscriptionId,
    engineSubscriptionId: intent.engineSubscriptionId ?? null,
    amountUsdc: intent.amountUsdc,
    customerWallet: intent.customerWallet,
    merchantWallet: intent.merchantWallet,
    calldataPrefix: `${intent.chargeCalldata.slice(0, 18)}…`,
    sandbox: intent.sandbox,
  });
}
