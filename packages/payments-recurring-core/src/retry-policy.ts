import { MS_DAY } from "./intervals";
import { DEFAULT_RETRY_POLICY, type DefaultRetryPolicy } from "./types";

/** Zero-based attempt index after a failure (0 = first failure, schedule retry 1). */
export function nextAttemptAtAfterFailure(
  failedAt: Date,
  attemptCountAfterFailure: number,
  policy: DefaultRetryPolicy = DEFAULT_RETRY_POLICY,
): Date | null {
  if (attemptCountAfterFailure >= policy.maxAttempts) {
    return null;
  }
  const delayDays = policy.retryDelaysDays[attemptCountAfterFailure] ?? 0;
  return new Date(failedAt.getTime() + delayDays * MS_DAY);
}

export function shouldMarkPastDue(
  attemptCount: number,
  policy: DefaultRetryPolicy = DEFAULT_RETRY_POLICY,
): boolean {
  return attemptCount >= policy.maxAttempts;
}

export function hasMoreAttempts(
  attemptCount: number,
  policy: DefaultRetryPolicy = DEFAULT_RETRY_POLICY,
): boolean {
  return attemptCount < policy.maxAttempts;
}
