import { listWebhookEvents } from "@/lib/webhook-log";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ events: listWebhookEvents() });
}
