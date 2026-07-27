"use client";

import { formatUsdc } from "@/lib/catalog";
import type { OneTimeProduct } from "@/lib/one-time-products";
import Link from "next/link";
import { useEffect, useState } from "react";

type CatalogProduct = OneTimeProduct & { priceId?: string; productId?: string };

type Payment = {
  id: string;
  productName?: string;
  amountUsdc: number;
  status: "open" | "paid" | "canceled";
  customerWallet?: string | null;
  payoutAddress?: string;
  payoutAddressEvm?: string;
  usdcAddress?: string;
  transferCalldata?: string;
  txHash?: string;
  mode?: "sandbox" | "live";
  metadata?: Record<string, string>;
};

export function OneTimeCheckout() {
  const [mode, setMode] = useState<"sandbox" | "hosted">("sandbox");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productId, setProductId] = useState("");
  const [catalogHint, setCatalogHint] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    void loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      const [metaRes, productsRes] = await Promise.all([
        fetch("/api/meta"),
        fetch("/api/one-time/products"),
      ]);
      const meta = (await metaRes.json()) as { mode?: "sandbox" | "hosted" };
      const catalog = (await productsRes.json()) as {
        source?: string;
        products?: CatalogProduct[];
        hint?: string;
        error?: string;
      };
      const nextMode = meta.mode ?? "sandbox";
      setMode(nextMode);
      const next = catalog.products ?? [];
      setProducts(next);
      setCatalogHint(catalog.hint ?? catalog.error ?? null);
      const preferred = next.find((p) => p.highlighted)?.id ?? next[0]?.id ?? "";
      setProductId((prev) => (next.some((p) => p.id === prev) ? prev : preferred));
    } catch {
      setCatalogHint("Could not load catalog");
    }
  }

  async function checkout(nextProductId: string) {
    setProductId(nextProductId);
    setBusyId(nextProductId);
    setError(null);
    setPayment(null);
    try {
      const selected = products.find((p) => p.id === nextProductId);
      const res = await fetch("/api/one-time/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: nextProductId,
          priceId: selected?.priceId,
        }),
      });
      const data = (await res.json()) as {
        payment?: Payment;
        checkoutUrl?: string;
        mode?: string;
        error?: string;
      };
      if (!res.ok || !data.payment) throw new Error(data.error ?? "Create failed");

      if (data.checkoutUrl && data.mode === "hosted" && !data.checkoutUrl.startsWith("sandbox://")) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setPayment(data.payment);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("acme_one_time_payment_id", data.payment.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  async function sandboxPay() {
    if (!payment) return;
    setBusyId(payment.id);
    setError(null);
    try {
      const res = await fetch("/api/one-time/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id }),
      });
      const data = (await res.json()) as { payment?: Payment; error?: string };
      if (!res.ok || !data.payment) throw new Error(data.error ?? "Pay failed");
      setPayment(data.payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pay failed");
    } finally {
      setBusyId(null);
    }
  }

  const payout = payment?.payoutAddress ?? payment?.payoutAddressEvm ?? "";
  const busy = Boolean(busyId);

  return (
    <>
      <section className="hero">
        <span className={`badge ${mode === "sandbox" ? "sandbox" : "hosted"}`}>
          {mode === "sandbox" ? "Sandbox mode" : "Hosted API mode"}
        </span>
        <h1>Pay once. No mandate.</h1>
        <p>
          {mode === "sandbox" ? (
            <>
              Pick a product and pay. Sandbox stays local. Connect an API key under{" "}
              <Link href="/settings">Settings</Link> to use portal Once prices and Autlantic wallet
              checkout.
            </>
          ) : (
            <>
              Pick a product to open Autlantic hosted checkout. Buyers connect their wallet there.
              Payout uses your portal Settings address.
            </>
          )}
        </p>
      </section>

      {catalogHint ? (
        <div className="panel">
          <p className="hint" style={{ margin: 0 }}>
            {catalogHint}{" "}
            {mode === "hosted" ? (
              <>
                <Link href="/settings">Settings</Link> ·{" "}
                <button type="button" className="btn secondary" onClick={() => void loadCatalog()}>
                  Refresh catalog
                </button>
              </>
            ) : (
              <>
                <Link href="/settings">Open Settings</Link> to connect your portal.
              </>
            )}
          </p>
        </div>
      ) : null}

      <div className="plans">
        {products.map((product) => {
          const selected = productId === product.id;
          const loading = busyId === product.id;
          return (
            <article
              key={product.id}
              className={`plan ${product.highlighted || selected ? "highlighted" : ""}`}
            >
              <h2>{product.name}</h2>
              {product.description ? <p className="interval">{product.description}</p> : null}
              <p className="price">
                ${formatUsdc(product.amountUsdc)}
                <span className="interval"> USDC once</span>
              </p>
              {product.features.length > 0 ? (
                <ul>
                  {product.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                className="btn"
                disabled={busy || products.length === 0}
                onClick={() => void checkout(product.id)}
              >
                {loading
                  ? "Opening…"
                  : mode === "sandbox"
                    ? "Pay (sandbox)"
                    : "Continue to checkout"}
              </button>
            </article>
          );
        })}
      </div>

      {error ? (
        <div className="panel">
          <p className="error" style={{ margin: 0 }}>
            {error}
          </p>
        </div>
      ) : null}

      {payment ? (
        <div className="panel">
          <h2>
            {payment.productName ?? "Payment"} · {payment.status} · $
            {formatUsdc(payment.amountUsdc)} USDC
          </h2>
          <p className="mono">{payment.id}</p>
          {payout ? (
            <p className="hint" style={{ marginTop: 8 }}>
              Payout {payout}
            </p>
          ) : null}

          {payment.status === "open" && (payment.mode === "sandbox" || !payment.mode) ? (
            <div style={{ marginTop: 16 }}>
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => void sandboxPay()}
              >
                {busyId === payment.id ? "Paying…" : "Simulate USDC transfer (sandbox)"}
              </button>
            </div>
          ) : null}

          {payment.status === "paid" ? (
            <div className="success">
              <strong>Paid · {payment.productName ?? "One-time"}</strong>
              {payment.txHash ? (
                <div className="mono" style={{ marginTop: 8 }}>
                  tx {payment.txHash}
                </div>
              ) : null}
              <div style={{ marginTop: 12 }}>
                <Link href="/recurring">Also try recurring →</Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
