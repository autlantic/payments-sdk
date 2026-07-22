import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultSandboxChainId } from "@autlantic/chain-evm";
import { VAULT_PLACEHOLDER_BASE_SEPOLIA } from "@autlantic/chain-evm";
import { createFileBillingStore } from "./file-store";
import { createSubscription } from "./subscriptions";

describe("file-store", () => {
  it("persists subscriptions across store instances", () => {
    const dir = mkdtempSync(join(tmpdir(), "billing-store-"));
    const file = join(dir, "store.json");

    try {
      const a = createFileBillingStore(file);
      const created = createSubscription(a, {
        merchantId: "mer_test",
        merchantRef: "order_persist",
        walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        payoutAddressEvm: "0x1111111111111111111111111111111111111111",
        amountUsdc: 12,
        interval: "month",
        chainId: defaultSandboxChainId(),
        vaultAddress: VAULT_PLACEHOLDER_BASE_SEPOLIA,
      });

      const b = createFileBillingStore(file);
      const loaded = b.getSubscription(created.subscription.id);
      assert.equal(loaded?.merchantRef, "order_persist");
      assert.equal(loaded?.amountUsdc, 12);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
