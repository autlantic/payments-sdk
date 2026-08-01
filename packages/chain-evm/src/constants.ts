import type { BillingChainId, BillingNetwork } from "@autlantic/payments-recurring-core";

export const USDC_DECIMALS = 6;

/** Circle USDC on Base mainnet. */
export const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/** Circle USDC on Base Sepolia (testnet). */
export const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

/** Placeholder vault until deploy; override via env in worker. */
export const VAULT_PLACEHOLDER_BASE_SEPOLIA =
  "0x0000000000000000000000000000000000000001";

export const CHAIN_BASE_MAINNET: BillingChainId = 8453;
export const CHAIN_BASE_SEPOLIA: BillingChainId = 84532;

export type ChainConfig = {
  chainId: BillingChainId;
  network: BillingNetwork;
  name: string;
  usdcAddress: string;
  rpcUrl: string;
  blockExplorerTxUrl: (txHash: string) => string;
};

export const CHAIN_CONFIG: Record<BillingChainId, ChainConfig> = {
  [CHAIN_BASE_MAINNET]: {
    chainId: CHAIN_BASE_MAINNET,
    network: "base",
    name: "Base",
    usdcAddress: USDC_BASE_MAINNET,
    rpcUrl: process.env.AUTLANTIC_BASE_RPC_URL?.trim() || "https://mainnet.base.org",
    blockExplorerTxUrl: (tx) => `https://basescan.org/tx/${tx}`,
  },
  [CHAIN_BASE_SEPOLIA]: {
    chainId: CHAIN_BASE_SEPOLIA,
    network: "base-sepolia",
    name: "Base Sepolia",
    usdcAddress: USDC_BASE_SEPOLIA,
    rpcUrl:
      process.env.AUTLANTIC_BASE_SEPOLIA_RPC_URL?.trim() || "https://sepolia.base.org",
    blockExplorerTxUrl: (tx) => `https://sepolia.basescan.org/tx/${tx}`,
  },
};

export function chainConfigFor(chainId: BillingChainId): ChainConfig {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
  return config;
}

export function defaultSandboxChainId(): BillingChainId {
  return CHAIN_BASE_SEPOLIA;
}

/** Stripe-style: test → Base Sepolia, live → Base mainnet. */
export function chainIdForBillingMode(mode: "test" | "live"): BillingChainId {
  return mode === "live" ? CHAIN_BASE_MAINNET : CHAIN_BASE_SEPOLIA;
}

export function usdcToMicro(amountUsdc: number): bigint {
  if (!Number.isFinite(amountUsdc) || amountUsdc < 0) {
    throw new Error("Invalid USDC amount");
  }
  return BigInt(Math.round(amountUsdc * 10 ** USDC_DECIMALS));
}

export function microToUsdc(micro: bigint): number {
  return Number(micro) / 10 ** USDC_DECIMALS;
}

/** ERC-20 approve(address spender, uint256 amount) selector + encoding stub for checkout UI. */
export function encodeApproveCalldata(spender: string, amountMicro: bigint): string {
  const selector = "095ea7b3";
  const spenderPadded = spender.slice(2).toLowerCase().padStart(64, "0");
  const amountHex = amountMicro.toString(16).padStart(64, "0");
  return `0x${selector}${spenderPadded}${amountHex}`;
}
