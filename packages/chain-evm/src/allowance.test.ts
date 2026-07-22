import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  encodeAllowanceCalldata,
  parseAllowanceResult,
} from "../src/allowance";
import { microToUsdc } from "../src/constants";

describe("allowance", () => {
  it("encodes allowance(owner, spender) calldata", () => {
    const data = encodeAllowanceCalldata(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "0x1111111111111111111111111111111111111111",
    );
    assert.ok(data.startsWith("0xdd62ed3e"));
    assert.equal(data.length, 2 + 8 + 64 + 64);
  });

  it("parses allowance result", () => {
    const micro = 20_000_000n;
    const hex = `0x${micro.toString(16).padStart(64, "0")}`;
    assert.equal(microToUsdc(parseAllowanceResult(hex)), 20);
  });
});
