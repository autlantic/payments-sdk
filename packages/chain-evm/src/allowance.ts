import type { BillingChainId } from "@autlantic/payments-recurring-core";
import { chainConfigFor, microToUsdc } from "./constants";

/** allowance(address owner, address spender) selector */
const ALLOWANCE_SELECTOR = "0xdd62ed3e";

function padAddress(address: string): string {
  return address.slice(2).toLowerCase().padStart(64, "0");
}

export function encodeAllowanceCalldata(owner: string, spender: string): string {
  return `${ALLOWANCE_SELECTOR}${padAddress(owner)}${padAddress(spender)}`;
}

export function parseAllowanceResult(hex: string): bigint {
  const raw = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!raw || raw === "0".repeat(raw.length)) return 0n;
  return BigInt(`0x${raw}`);
}

export async function readUsdcAllowance(input: {
  chainId: BillingChainId;
  usdcAddress: string;
  owner: string;
  spender: string;
  rpcUrl?: string;
}): Promise<number> {
  const chain = chainConfigFor(input.chainId);
  const rpc = input.rpcUrl?.trim() || chain.rpcUrl;
  const data = encodeAllowanceCalldata(input.owner, input.spender);

  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: input.usdcAddress, data }, "latest"],
    }),
  });

  const json = (await res.json()) as { result?: string; error?: { message?: string } };
  if (!json.result) {
    throw new Error(json.error?.message ?? "Could not read USDC allowance");
  }

  return microToUsdc(parseAllowanceResult(json.result));
}
