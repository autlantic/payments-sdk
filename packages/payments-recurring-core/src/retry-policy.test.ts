import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasMoreAttempts,
  nextAttemptAtAfterFailure,
  shouldMarkPastDue,
} from "./retry-policy";

describe("retry-policy", () => {
  it("schedules retry delays 1, 2, 4 days", () => {
    const failedAt = new Date("2026-06-01T12:00:00.000Z");
    const retry1 = nextAttemptAtAfterFailure(failedAt, 1);
    assert.equal(retry1?.toISOString(), "2026-06-02T12:00:00.000Z");
    const retry2 = nextAttemptAtAfterFailure(failedAt, 2);
    assert.equal(retry2?.toISOString(), "2026-06-03T12:00:00.000Z");
    const retry3 = nextAttemptAtAfterFailure(failedAt, 3);
    assert.equal(retry3?.toISOString(), "2026-06-05T12:00:00.000Z");
  });

  it("returns null after max attempts", () => {
    const failedAt = new Date("2026-06-01T12:00:00.000Z");
    assert.equal(nextAttemptAtAfterFailure(failedAt, 4), null);
    assert.equal(shouldMarkPastDue(4), true);
    assert.equal(hasMoreAttempts(3), true);
    assert.equal(hasMoreAttempts(4), false);
  });
});
