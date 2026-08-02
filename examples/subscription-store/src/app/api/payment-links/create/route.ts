import { getBilling, getModeLabel, getPayoutAddress, isHostedMode } from "@/lib/billing";
import { getPaymentLinkPreset } from "@/lib/store-types";
import { NextResponse } from "next/server";

/**
 * Create a payment link via SDK `createPaymentLink`.
 * Hosted: pass `priceId` (once catalog) and/or `amountUsdc`.
 * Sandbox: requires `amountUsdc` (preset or custom).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      presetId?: string;
      amountUsdc?: number;
      priceId?: string;
      description?: string;
      maxUses?: number | null;
      expiresAt?: string | null;
    };

    const hosted = isHostedMode();
    const billing = getBilling();
    const preset = body.presetId ? getPaymentLinkPreset(body.presetId) : undefined;
    const priceId = body.priceId?.trim() || undefined;

    let amountUsdc = body.amountUsdc ?? preset?.amountUsdc;
    let description =
      body.description?.trim() ||
      preset?.description ||
      undefined;
    let productName: string | undefined;

    if (hosted && priceId) {
      const { products } = await billing.listProducts();
      let matched = false;
      for (const product of products) {
        const price = product.prices.find((p) => p.id === priceId && p.active);
        if (price) {
          if (price.interval !== "once") {
            return NextResponse.json(
              { error: "priceId must have interval once for payment links" },
              { status: 400 },
            );
          }
          amountUsdc = price.amountUsdc;
          productName = product.name;
          description =
            description ||
            `${product.name} · $${price.amountUsdc} USDC`;
          matched = true;
          break;
        }
      }
      if (!matched) {
        return NextResponse.json({ error: "Unknown or inactive priceId" }, { status: 400 });
      }
    }

    if (amountUsdc == null || !(amountUsdc > 0)) {
      return NextResponse.json(
        {
          error: hosted
            ? "Provide priceId (once catalog) or amountUsdc"
            : "amountUsdc is required in sandbox (pick a preset or enter an amount)",
        },
        { status: 400 },
      );
    }

    let expiresAt: string | null | undefined = body.expiresAt;
    if (typeof expiresAt === "string" && expiresAt.trim()) {
      const parsed = new Date(expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "expiresAt must be a valid ISO date" }, { status: 400 });
      }
      expiresAt = parsed.toISOString();
    } else if (expiresAt === "") {
      expiresAt = null;
    }

    const maxUsesRaw = body.maxUses;
    const maxUses =
      maxUsesRaw === undefined
        ? undefined
        : maxUsesRaw === null
          ? null
          : Number(maxUsesRaw);

    if (maxUses != null && (!Number.isFinite(maxUses) || maxUses < 1)) {
      return NextResponse.json({ error: "maxUses must be a positive number or empty" }, { status: 400 });
    }

    const created = await billing.createPaymentLink({
      merchantRefPrefix: preset
        ? `store_${preset.id}`
        : priceId
          ? "store_price"
          : "store_link",
      payoutAddressEvm: getPayoutAddress(),
      ...(hosted && priceId
        ? { priceId, amountUsdc }
        : { amountUsdc }),
      description: description || `Payment link · $${amountUsdc} USDC`,
      maxUses,
      expiresAt,
      metadata: {
        source: "example-subscription-store",
        presetId: preset?.id ?? "",
        storeTypeId: preset?.storeTypeId ?? "",
        ...(priceId ? { priceId } : {}),
        ...(productName ? { productName } : {}),
      },
    });

    const origin = new URL(req.url).origin;
    const shareUrl = hosted
      ? created.url
      : `${origin}/pay/link/${created.paymentLink.id}`;

    return NextResponse.json({
      mode: getModeLabel(),
      paymentLink: created.paymentLink,
      url: shareUrl,
      sdkUrl: created.url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create payment link" },
      { status: 500 },
    );
  }
}
