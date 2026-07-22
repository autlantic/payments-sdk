import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  encodeSubscribeCalldata,
  parseSubscribedSubscriptionId,
  planRefBytes32,
  SUBSCRIBE_SELECTOR,
  SUBSCRIBED_EVENT_TOPIC,
} from "./vault";

describe("vault", () => {
  it("encodes subscribe calldata with selector", () => {
    const data = encodeSubscribeCalldata({
      planRef: "plan_monthly",
      merchant: "0x1111111111111111111111111111111111111111",
      amountPerPeriodMicro: 20_000_000n,
      maxChargeAmountMicro: 20_000_000n,
      periodEndUnix: 1_700_000_000n,
      allowanceCapMicro: 240_000_000n,
      periodDurationSeconds: 2_592_000n,
    });

    assert.ok(data.startsWith(SUBSCRIBE_SELECTOR));
    assert.match(data, /^0x[0-9a-f]+$/);
  });

  it("derives stable planRef bytes32", () => {
    const a = planRefBytes32("plan_abc");
    const b = planRefBytes32("plan_abc");
    assert.equal(a, b);
    assert.match(a, /^0x[0-9a-f]{64}$/);
  });

  it("parses Subscribed event subscription id", () => {
    const id = parseSubscribedSubscriptionId([
      {
        topics: [
          SUBSCRIBED_EVENT_TOPIC,
          "0x0000000000000000000000000000000000000000000000000000000000000042",
        ],
      },
    ]);
    assert.equal(id, "66");
  });
});
