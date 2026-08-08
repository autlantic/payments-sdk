"use strict";

const CHARGE_SELECTOR = "0xe457e1e5";
const CANCEL_SELECTOR = "0x40e58ee5";
const REFUND_SELECTOR = "0x5af36e3e";

/** Defaults sized for Base contract calls (cents–low dollars), not L1 NFT mints. */
const DEFAULT_MAX_FEE_GWEI = 50;
const DEFAULT_MAX_PRIORITY_GWEI = 2;
/** ~0.005 ETH worst-case per tx at default caps. */
const DEFAULT_MAX_TX_COST_WEI = 5_000_000_000_000_000n;

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

function parsePositiveNumber(raw, fallback) {
  if (raw == null || String(raw).trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function gweiToWei(gwei) {
  return BigInt(Math.ceil(gwei * 1e9));
}

/**
 * Resolve fee + gas ceilings. Exported for unit tests via module.exports.
 * @returns {{ maxFeePerGas: bigint, maxPriorityFeePerGas: bigint, gasLimit: bigint, maxTxCostWei: bigint } | { error: string }}
 */
function resolveFeeCaps(estimateGas, feeData) {
  const maxFeeGwei = parsePositiveNumber(
    process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI,
    DEFAULT_MAX_FEE_GWEI,
  );
  const maxPriorityGwei = parsePositiveNumber(
    process.env.AUTLANTIC_RELAYER_MAX_PRIORITY_GWEI,
    DEFAULT_MAX_PRIORITY_GWEI,
  );
  const maxTxCostWei = (() => {
    const raw = process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI?.trim();
    if (raw && /^\d+$/.test(raw)) return BigInt(raw);
    return DEFAULT_MAX_TX_COST_WEI;
  })();

  const networkMaxFee = feeData?.maxFeePerGas ?? feeData?.gasPrice ?? null;
  const networkPriority = feeData?.maxPriorityFeePerGas ?? null;

  const ceilingMaxFee = gweiToWei(maxFeeGwei);
  const ceilingPriority = gweiToWei(maxPriorityGwei);

  let maxFeePerGas = networkMaxFee != null ? BigInt(networkMaxFee) : ceilingMaxFee;
  let maxPriorityFeePerGas =
    networkPriority != null ? BigInt(networkPriority) : ceilingPriority;

  if (maxFeePerGas > ceilingMaxFee) {
    return {
      error: `Relayer maxFeePerGas ${maxFeePerGas} exceeds cap ${ceilingMaxFee} wei (${maxFeeGwei} gwei)`,
    };
  }
  if (maxPriorityFeePerGas > ceilingPriority) {
    maxPriorityFeePerGas = ceilingPriority;
  }
  if (maxPriorityFeePerGas > maxFeePerGas) {
    maxPriorityFeePerGas = maxFeePerGas;
  }

  // Small buffer over estimate; hard ceiling at 2x estimate or 500k.
  const estimated = BigInt(estimateGas);
  const buffered = estimated + estimated / 5n;
  const hardGasCap = estimated * 2n > 500_000n ? estimated * 2n : 500_000n;
  const gasLimit = buffered > hardGasCap ? hardGasCap : buffered;
  if (gasLimit <= 0n) {
    return { error: "Relayer gas estimate is zero" };
  }

  const worstCase = gasLimit * maxFeePerGas;
  if (worstCase > maxTxCostWei) {
    return {
      error: `Relayer worst-case tx cost ${worstCase} wei exceeds cap ${maxTxCostWei} wei`,
    };
  }

  return { maxFeePerGas, maxPriorityFeePerGas, gasLimit, maxTxCostWei };
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
    const { wallet, publicClient, account } = await createClient(chainId, privateKey);
    const estimateGas = await publicClient.estimateGas({
      account: account.address,
      to: vaultAddress,
      data,
    });
    const feeData = await publicClient.estimateFeesPerGas().catch(async () => {
      const gasPrice = await publicClient.getGasPrice();
      return { maxFeePerGas: gasPrice, maxPriorityFeePerGas: gasPrice / 10n, gasPrice };
    });

    const caps = resolveFeeCaps(estimateGas, feeData);
    if (caps.error) {
      return { ok: false, error: caps.error, sandbox: false };
    }

    const hash = await wallet.sendTransaction({
      to: vaultAddress,
      data,
      gas: caps.gasLimit,
      maxFeePerGas: caps.maxFeePerGas,
      maxPriorityFeePerGas: caps.maxPriorityFeePerGas,
    });
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
  resolveFeeCaps,
};
