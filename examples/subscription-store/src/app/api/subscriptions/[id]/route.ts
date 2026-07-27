import { getBilling } from "@/lib/billing";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const billing = getBilling();
    const subscription = await billing.getSubscription(id);
    const { invoices } = await billing.listInvoices({ subscriptionId: id });
    return NextResponse.json({ subscription, invoices });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Not found" },
      { status: 404 },
    );
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { action?: string; immediate?: boolean };
    const billing = getBilling();

    if (body.action === "cancel") {
      const result = await billing.cancelSubscription(id, Boolean(body.immediate));
      return NextResponse.json(result);
    }

    if (body.action === "activate") {
      const result = await billing.activateSubscription(id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Action failed" },
      { status: 500 },
    );
  }
}
