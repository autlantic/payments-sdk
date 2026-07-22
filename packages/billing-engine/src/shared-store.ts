import { createFileBillingStore } from "./file-store";
import { createMemoryBillingStore } from "./memory-store";
import type { BillingStore } from "./types";

let sharedStore: BillingStore | null = null;

export function billingStorePath(): string | null {
  const path = process.env.AUTLANTIC_BILLING_STORE_PATH?.trim();
  return path || null;
}

export function getSharedBillingStore(): BillingStore {
  if (!sharedStore) {
    const path = billingStorePath();
    sharedStore = path ? createFileBillingStore(path) : createMemoryBillingStore();
  }
  return sharedStore;
}

/** Tests only. */
export function resetSharedBillingStore(): void {
  sharedStore = null;
}

export function defaultBillingStorePath(): string {
  return ".autlantic/billing-store.json";
}
