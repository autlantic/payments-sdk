import { getWebhookSecret } from "@/lib/billing";
import { logWebhookEvent } from "@/lib/webhook-log";
import {
  BILLING_WEBHOOK_SIGNATURE_HEADER,
  parseBillingWebhookEvent,
  verifyBillingWebhook,
} from "@autlantic/payments-recurring";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get(BILLING_WEBHOOK_SIGNATURE_HEADER);
  const secret = getWebhookSecret();
  const verified = verifyBillingWebhook(secret, rawBody, signature);
  const event = parseBillingWebhookEvent(rawBody);

  logWebhookEvent({
    receivedAt: new Date().toISOString(),
    verified,
    event: event ?? { raw: rawBody.slice(0, 500), parseError: "Could not parse event" },
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Example: unlock access on invoice.paid / revoke on subscription.canceled
  // if (event?.type === "invoice.paid") { ... }

  return NextResponse.json({ received: true });
}
