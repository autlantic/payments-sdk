import type { BillingWebhookEvent } from "@autlantic/payments-recurring";

type LoggedEvent = {
  receivedAt: string;
  verified: boolean;
  event: BillingWebhookEvent | { raw: string; parseError: string };
};

const globalForLog = globalThis as unknown as {
  __autlanticWebhookLog?: LoggedEvent[];
};

function store(): LoggedEvent[] {
  if (!globalForLog.__autlanticWebhookLog) {
    globalForLog.__autlanticWebhookLog = [];
  }
  return globalForLog.__autlanticWebhookLog;
}

export function logWebhookEvent(entry: LoggedEvent) {
  const list = store();
  list.unshift(entry);
  if (list.length > 50) list.length = 50;
}

export function listWebhookEvents(): LoggedEvent[] {
  return [...store()];
}
