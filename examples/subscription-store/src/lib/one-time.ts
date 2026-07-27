import {
  chainConfigFor,
  defaultSandboxChainId,
  encodeTransferCalldata,
  usdcToMicro,
  type UsdcPassPaymentIntent,
} from "@autlantic/chain-evm";
import { getPayoutAddress } from "@/lib/billing";
import { getOneTimeProduct } from "@/lib/one-time-products";

export type OneTimePayment = {
  id: string;
  productId: string;
  productName: string;
  amountUsdc: number;
  customerWallet: string;
  payoutAddress: string;
  chainId: UsdcPassPaymentIntent["chainId"];
  usdcAddress: string;
  status: "open" | "paid";
  /** Wallet calldata for a real USDC transfer (hosted / live). */
  transferCalldata: string;
  createdAt: string;
  paidAt?: string;
  txHash?: string;
  mode: "sandbox" | "live";
};

const globalForPayments = globalThis as unknown as {
  __autlanticOneTimePayments?: Map<string, OneTimePayment>;
};

function store(): Map<string, OneTimePayment> {
  if (!globalForPayments.__autlanticOneTimePayments) {
    globalForPayments.__autlanticOneTimePayments = new Map();
  }
  return globalForPayments.__autlanticOneTimePayments;
}

export function createOneTimePayment(input: {
  productId: string;
  customerWallet: string;
  mode?: "sandbox" | "live";
}): OneTimePayment {
  const product = getOneTimeProduct(input.productId);
  if (!product) throw new Error("Unknown productId");

  const wallet = input.customerWallet.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    throw new Error("customerWallet must be a valid 0x… address");
  }

  const chainId = defaultSandboxChainId();
  const chain = chainConfigFor(chainId);
  const payoutAddress = getPayoutAddress();
  const amountMicro = usdcToMicro(product.amountUsdc);
  const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const payment: OneTimePayment = {
    id,
    productId: product.id,
    productName: product.name,
    amountUsdc: product.amountUsdc,
    customerWallet: wallet,
    payoutAddress,
    chainId,
    usdcAddress: chain.usdcAddress,
    status: "open",
    transferCalldata: encodeTransferCalldata(payoutAddress, amountMicro),
    createdAt: new Date().toISOString(),
    mode: input.mode ?? "sandbox",
  };

  store().set(id, payment);
  return payment;
}

export function getOneTimePayment(id: string): OneTimePayment | undefined {
  return store().get(id);
}

export function markOneTimePaid(id: string, txHash?: string): OneTimePayment {
  const payment = store().get(id);
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "paid") return payment;

  payment.status = "paid";
  payment.paidAt = new Date().toISOString();
  payment.txHash = txHash ?? `sandbox_tx_${id}`;
  store().set(id, payment);
  return payment;
}

export function toPaymentIntent(payment: OneTimePayment): UsdcPassPaymentIntent {
  return {
    chainId: payment.chainId,
    usdcAddress: payment.usdcAddress,
    payoutAddress: payment.payoutAddress,
    expectedAmountUsdc: payment.amountUsdc,
  };
}
