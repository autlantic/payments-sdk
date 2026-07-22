import { keccak_256 } from "@noble/hashes/sha3";
import { usdcToMicro, type ChainConfig } from "./constants";
import type { BillingChainId } from "@autlantic/payments-recurring-core";
import { chainConfigFor } from "./constants";

/** keccak256("subscribe(bytes32,address,uint256,uint256,uint64,uint256,uint64)") first 4 bytes */
export const SUBSCRIBE_SELECTOR = "0xcdbc533a";

export const CANCEL_SELECTOR = "0x40e58ee5";
export const REFUND_SELECTOR = "0x5af36e3e";
export const SUBSCRIPTIONS_VIEW_SELECTOR = "0x2d5bbf60";

/** keccak256("Subscribed(uint256,address,address,bytes32,uint256)") */
export const SUBSCRIBED_EVENT_TOPIC =
  "0x4c3b347d86acba6b8747b8a1f8414219762eeba92d0cb280878441ac60499023";

function keccak256Utf8(value: string): string {
  const hash = keccak_256(new TextEncoder().encode(value));
  return `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function planRefBytes32(planRef: string): string {
  const trimmed = planRef.trim();
  if (trimmed.startsWith("0x") && trimmed.length === 66) {
    return trimmed.toLowerCase();
  }
  return keccak256Utf8(trimmed);
}

function pad32(hex: string): string {
  return hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
}

export function encodeSubscribeCalldata(input: {
  planRef: string;
  merchant: string;
  amountPerPeriodMicro: bigint;
  maxChargeAmountMicro: bigint;
  periodEndUnix: bigint;
  allowanceCapMicro: bigint;
  periodDurationSeconds: bigint;
}): string {
  const planRef = pad32(planRefBytes32(input.planRef));
  const merchant = pad32(input.merchant);
  const amount = pad32(input.amountPerPeriodMicro.toString(16));
  const maxCharge = pad32(input.maxChargeAmountMicro.toString(16));
  const periodEnd = pad32(input.periodEndUnix.toString(16));
  const allowanceCap = pad32(input.allowanceCapMicro.toString(16));
  const duration = pad32(input.periodDurationSeconds.toString(16));
  return `${SUBSCRIBE_SELECTOR}${planRef}${merchant}${amount}${maxCharge}${periodEnd}${allowanceCap}${duration}`;
}

export function encodeCancelCalldata(onChainSubscriptionId: bigint): string {
  return `${CANCEL_SELECTOR}${pad32(onChainSubscriptionId.toString(16))}`;
}

export function encodeRefundCalldata(onChainSubscriptionId: bigint, amountMicro: bigint): string {
  return `${REFUND_SELECTOR}${pad32(onChainSubscriptionId.toString(16))}${pad32(amountMicro.toString(16))}`;
}

export function encodeSubscriptionsViewCalldata(onChainSubscriptionId: bigint): string {
  return `${SUBSCRIPTIONS_VIEW_SELECTOR}${pad32(onChainSubscriptionId.toString(16))}`;
}

export type VaultSubscriptionView = {
  customer: string;
  merchant: string;
  amountPerPeriodMicro: bigint;
  maxChargeAmountMicro: bigint;
  periodStart: number;
  periodEnd: number;
  periodDurationSeconds: number;
  active: boolean;
  cancelAtPeriodEnd: boolean;
};

export function parseSubscriptionsViewResult(hex: string): VaultSubscriptionView | null {
  const raw = hex.replace(/^0x/, "");
  if (raw.length < 64 * 10) return null;

  const word = (index: number) => raw.slice(index * 64, (index + 1) * 64);
  const addressAt = (index: number) => `0x${word(index).slice(24)}`;
  const u64At = (index: number) => Number(BigInt(`0x${word(index)}`));
  const boolAt = (index: number) => BigInt(`0x${word(index)}`) !== 0n;

  return {
    customer: addressAt(0),
    merchant: addressAt(1),
    amountPerPeriodMicro: BigInt(`0x${word(3)}`),
    maxChargeAmountMicro: BigInt(`0x${word(4)}`),
    periodStart: u64At(5),
    periodEnd: u64At(6),
    periodDurationSeconds: u64At(7),
    active: boolAt(8),
    cancelAtPeriodEnd: boolAt(9),
  };
}

export function buildSubscribeTransaction(input: {
  chainId: BillingChainId;
  vaultAddress: string;
  planRef: string;
  merchant: string;
  amountPerPeriodUsdc: number;
  maxChargeUsdc: number;
  periodEndUnix: number;
  allowanceCapUsdc: number;
  periodDurationSeconds: number;
}): { to: string; data: string; chain: ChainConfig } {
  const chain = chainConfigFor(input.chainId);
  return {
    to: input.vaultAddress,
    data: encodeSubscribeCalldata({
      planRef: input.planRef,
      merchant: input.merchant,
      amountPerPeriodMicro: usdcToMicro(input.amountPerPeriodUsdc),
      maxChargeAmountMicro: usdcToMicro(input.maxChargeUsdc),
      periodEndUnix: BigInt(Math.max(0, Math.floor(input.periodEndUnix))),
      allowanceCapMicro: usdcToMicro(input.allowanceCapUsdc),
      periodDurationSeconds: BigInt(Math.max(1, Math.floor(input.periodDurationSeconds))),
    }),
    chain,
  };
}

export function buildCancelTransaction(input: {
  chainId: BillingChainId;
  vaultAddress: string;
  onChainSubscriptionId: string;
}): { to: string; data: string; chain: ChainConfig } {
  const chain = chainConfigFor(input.chainId);
  const id = BigInt(input.onChainSubscriptionId.replace(/\D/g, "") || "0");
  return { to: input.vaultAddress, data: encodeCancelCalldata(id), chain };
}

export type EvmTxLog = { topics?: string[]; data?: string };

/** Parse on-chain subscription id from a Subscribed event log. */
export function parseSubscribedSubscriptionId(logs: EvmTxLog[]): string | null {
  for (const log of logs) {
    const topic0 = log.topics?.[0]?.toLowerCase();
    if (topic0 !== SUBSCRIBED_EVENT_TOPIC.toLowerCase()) continue;
    const idTopic = log.topics?.[1];
    if (!idTopic) continue;
    const id = BigInt(idTopic).toString(10);
    return id === "0" ? null : id;
  }
  return null;
}
