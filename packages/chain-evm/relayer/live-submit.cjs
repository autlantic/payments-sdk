"use strict";

const CHARGE_SELECTOR = "0xe457e1e5";
const CANCEL_SELECTOR = "0x40e58ee5";
const REFUND_SELECTOR = "0x5af36e3e";

function chainRpcUrl(chainId) {
  if (chainId === 8453) {
    return process.env.AUTLANTIC_BASE_RPC_URL?.trim() || "https://mainnet.base.org";
  }
  return process.env.AUTLANTIC_BASE_SEPOLIA_RPC_URL?.trim() || "https://sepolia.base.org";
}

function pad32(value) {
  return BigInt(value).toString(16).padStart(64, "0");
}

function encodeChargeCalldata(onChainSubscriptionId) {
  return `${CHARGE_SELECTOR}${pad32(onChainSubscriptionId)}`;
}

function encodeCancelCalldata(onChainSubscriptionId) {
  return `${CANCEL_SELECTOR}${pad32(onChainSubscriptionId)}`;
}

function encodeRefundCalldata(onChainSubscriptionId, amountMicro) {
  return `${REFUND_SELECTOR}${pad32(onChainSubscriptionId)}${pad32(amountMicro)}`;
}

async function createClient(chainId, privateKey) {
  const { createWalletClient, http, createPublicClient } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");
  const { base, baseSepolia } = await import("viem/chains");

  const viemChain = chainId === 8453 ? base : baseSepolia;
  const account = privateKeyToAccount(privateKey);
  const transport = http(chainRpcUrl(chainId));
  const wallet = createWalletClient({ account, chain: viemChain, transport });
  const publicClient = createPublicClient({ chain: viemChain, transport });
  return { wallet, publicClient, account };
}

async function submitTx(chainId, vaultAddress, data) {
  const privateKey = process.env.AUTLANTIC_RELAYER_PRIVATE_KEY?.trim();
  if (!privateKey) {
    return { ok: false, error: "AUTLANTIC_RELAYER_PRIVATE_KEY not set", sandbox: false };
  }

  try {
    const { wallet, publicClient } = await createClient(chainId, privateKey);
    const hash = await wallet.sendTransaction({ to: vaultAddress, data });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "reverted") {
      return { ok: false, error: "Transaction reverted", sandbox: false };
    }
    return { ok: true, txHash: hash, sandbox: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Relayer submit failed",
      sandbox: false,
    };
  }
}

async function submitCharge(input) {
  return submitTx(
    input.chainId,
    input.vaultAddress,
    encodeChargeCalldata(input.onChainSubscriptionId),
  );
}

async function submitCancel(input) {
  return submitTx(
    input.chainId,
    input.vaultAddress,
    encodeCancelCalldata(input.onChainSubscriptionId),
  );
}

async function submitRefund(input) {
  const amountMicro = BigInt(Math.round(input.amountUsdc * 1_000_000));
  return submitTx(
    input.chainId,
    input.vaultAddress,
    encodeRefundCalldata(input.onChainSubscriptionId, amountMicro),
  );
}

module.exports = {
  submitCharge,
  submitCancel,
  submitRefund,
  encodeChargeCalldata,
  encodeCancelCalldata,
  encodeRefundCalldata,
};
