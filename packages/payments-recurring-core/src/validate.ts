export function isEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function normalizeEvmAddress(value: string): string {
  const trimmed = value.trim();
  if (!isEvmAddress(trimmed)) {
    throw new Error("Invalid EVM address");
  }
  return trimmed;
}

export function assertPositiveAmountUsdc(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amountUsdc must be a positive number");
  }
}
