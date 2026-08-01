import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  chainConfigFor,
  chainIdForBillingMode,
  usdcToMicro,
  microToUsdc,
  encodeApproveCalldata,
  CHAIN_BASE_SEPOLIA,
  CHAIN_BASE_MAINNET,
} from "./constants";

describe("chain-evm constants", () => {
  it("resolves Base Sepolia config", () => {
    const config = chainConfigFor(CHAIN_BASE_SEPOLIA);
    assert.equal(config.network, "base-sepolia");
    assert.match(config.usdcAddress, /^0x[a-fA-F0-9]{40}$/);
  });

  it("maps billing mode to chain id", () => {
    assert.equal(chainIdForBillingMode("test"), CHAIN_BASE_SEPOLIA);
    assert.equal(chainIdForBillingMode("live"), CHAIN_BASE_MAINNET);
  });

  it("converts USDC amounts", () => {
    assert.equal(usdcToMicro(20), 20_000_000n);
    assert.equal(microToUsdc(20_000_000n), 20);
  });

  it("encodes approve calldata", () => {
    const data = encodeApproveCalldata(
      "0x0000000000000000000000000000000000000001",
      1000n,
    );
    assert.match(data, /^0x095ea7b3/);
  });
});
