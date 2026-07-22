import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ERC20_TRANSFER_TOPIC,
  encodeTransferCalldata,
  findUsdcTransfersInLogs,
  verifyUsdcTransferAgainstIntent,
} from "./usdc-transfer.js";
import { usdcToMicro } from "./constants.js";

describe("encodeTransferCalldata", () => {
  it("encodes ERC-20 transfer calldata", () => {
    const data = encodeTransferCalldata(
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      usdcToMicro(10.25),
    );
    assert.match(data, /^0xa9059cbb/);
    assert.equal(data.length, 2 + 8 + 64 + 64);
  });
});

describe("findUsdcTransfersInLogs", () => {
  const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const payout = "0x1111111111111111111111111111111111111111";
  const from = "0x2222222222222222222222222222222222222222";

  it("parses a USDC Transfer log to the payout address", () => {
    const amountMicro = usdcToMicro(12.340001);
    const logs = [
      {
        address: usdc,
        topics: [
          ERC20_TRANSFER_TOPIC,
          `0x${"0".repeat(24)}${from.slice(2).toLowerCase()}`,
          `0x${"0".repeat(24)}${payout.slice(2).toLowerCase()}`,
        ],
        data: `0x${amountMicro.toString(16).padStart(64, "0")}`,
      },
    ];

    const matches = findUsdcTransfersInLogs(logs, { usdcAddress: usdc, payoutAddress: payout });
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.from, from.toLowerCase());
    assert.equal(matches[0]?.to, payout.toLowerCase());
    assert.equal(matches[0]?.amountMicro, amountMicro);
  });
});

describe("verifyUsdcTransferAgainstIntent", () => {
  it("accepts exact and overpayments", () => {
    const intent = {
      chainId: 8453 as const,
      usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      payoutAddress: "0x1111111111111111111111111111111111111111",
      expectedAmountUsdc: 10,
    };

    const exact = verifyUsdcTransferAgainstIntent(intent, {
      from: "0x2222222222222222222222222222222222222222",
      to: intent.payoutAddress,
      amountUsdc: 10,
      amountMicro: usdcToMicro(10),
    });
    assert.equal(exact.ok, true);

    const over = verifyUsdcTransferAgainstIntent(intent, {
      from: "0x2222222222222222222222222222222222222222",
      to: intent.payoutAddress,
      amountUsdc: 10.000001,
      amountMicro: usdcToMicro(10.000001),
    });
    assert.equal(over.ok, true);
  });

  it("rejects short payments", () => {
    const intent = {
      chainId: 8453 as const,
      usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      payoutAddress: "0x1111111111111111111111111111111111111111",
      expectedAmountUsdc: 10,
    };

    const result = verifyUsdcTransferAgainstIntent(intent, {
      from: "0x2222222222222222222222222222222222222222",
      to: intent.payoutAddress,
      amountUsdc: 9.99,
      amountMicro: usdcToMicro(9.99),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "PAYMENT_SHORT");
    }
  });
});
