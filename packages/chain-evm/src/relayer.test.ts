import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildRelayerChargeIntent, encodeChargeCalldata } from "./relayer";

describe("relayer", () => {
  it("builds charge calldata with 4-byte selector", () => {
    const data = encodeChargeCalldata(42n);
    assert.match(data, /^0x[0-9a-f]{8}[0-9a-f]{64}$/);
    assert.equal(data.slice(0, 10), "0xe457e1e5");
  });

  it("builds relayer charge intent", () => {
    const intent = buildRelayerChargeIntent({
      chainId: 84532,
      vaultAddress: "0x0000000000000000000000000000000000000001",
      onChainSubscriptionId: "42",
      engineSubscriptionId: "sub_123456",
      customerWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      merchantWallet: "0x1111111111111111111111111111111111111111",
      amountUsdc: 20,
      sandbox: true,
    });
    assert.equal(intent.onChainSubscriptionId, "42");
    assert.equal(intent.amountUsdc, 20);
    assert.ok(intent.chargeCalldata.startsWith("0x"));
  });
});
