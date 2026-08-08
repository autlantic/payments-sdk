import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveFeeCaps } = require("../relayer/live-submit.cjs");

describe("relayer fee caps", () => {
  it("accepts normal Base-scale fees", () => {
    const prevFee = process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI;
    const prevCost = process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI;
    delete process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI;
    delete process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI;
    const caps = resolveFeeCaps(80_000n, {
      maxFeePerGas: 1_000_000_000n, // 1 gwei
      maxPriorityFeePerGas: 100_000_000n,
    });
    assert.ok(!caps.error);
    assert.ok(caps.gasLimit > 0n);
    if (prevFee === undefined) delete process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI;
    else process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI = prevFee;
    if (prevCost === undefined) delete process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI;
    else process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI = prevCost;
  });

  it("refuses when network maxFee exceeds gwei cap", () => {
    const prev = process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI;
    process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI = "5";
    const caps = resolveFeeCaps(80_000n, {
      maxFeePerGas: 20_000_000_000n, // 20 gwei > 5
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    assert.ok(caps.error);
    assert.match(caps.error, /exceeds cap/);
    if (prev === undefined) delete process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI;
    else process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI = prev;
  });

  it("refuses when worst-case cost exceeds wei cap", () => {
    const prevFee = process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI;
    const prevCost = process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI;
    process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI = "50";
    process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI = "1000";
    const caps = resolveFeeCaps(80_000n, {
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
    });
    assert.ok(caps.error);
    assert.match(caps.error, /worst-case tx cost/);
    if (prevFee === undefined) delete process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI;
    else process.env.AUTLANTIC_RELAYER_MAX_FEE_GWEI = prevFee;
    if (prevCost === undefined) delete process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI;
    else process.env.AUTLANTIC_RELAYER_MAX_TX_COST_WEI = prevCost;
  });
});
