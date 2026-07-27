"use client";

import type { OneTimeProduct } from "@/lib/one-time-products";
import Link from "next/link";
import { useEffect, useState } from "react";

type CatalogProduct = OneTimeProduct & { priceId?: string; productId?: string };

type Payment = {
  id: string;
  productName?: string;
  amountUsdc: number;
  status: "open" | "paid" | "canceled";
  customerWallet: string;
  payoutAddress?: string;
  payoutAddressEvm?: string;
  usdcAddress?: string;
  transferCalldata?: string;
  txHash?: string;
  mode?: "sandbox" | "live";
};

const DEMO_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

export function OneTimeCheckout() {
  const [mode, setMode] = useState<"sandbox" | "hosted">("sandbox");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productId, setProductId] = useState("");
  const [catalogHint, setCatalogHint] = useState<string | null>(null);
  const [wallet, setWallet] = useState(DEMO_WALLET);
  const [busy, setBusy] = useState(false);
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
      if (meta.mode) setMode(meta.mode);
      const next = catalog.products ?? [];
      setProducts(next);
      setCatalogHint(catalog.hint ?? catalog.error ?? null);
      const preferred = next.find((p) => p.highlighted)?.id ?? next[0]?.id ?? "";
      setProductId((prev) => (next.some((p) => p.id === prev) ? prev : preferred));
    } catch {
      setCatalogHint("Could not load catalog");
    }
  }

  async function createIntent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setPayment(null);
    try {
      const selected = products.find((p) => p.id === productId);
      const res = await fetch("/api/one-time/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          priceId: selected?.priceId,
          customerWallet: wallet,
        }),
      });
      const data = (await res.json()) as {
        payment?: Payment;
        checkoutUrl?: string;
        mode?: string;
        error?: string;
      };
      if (!res.ok || !data.payment) throw new Error(data.error ?? "Create failed");

      // Hosted: redirect to Autlantic checkout (same pattern as subscribe).
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
      setBusy(false);
    }
  }

  async function sandboxPay() {
    if (!payment) return;
    setBusy(true);
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
      setBusy(false);
    }
  }

  const payout = payment?.payoutAddress ?? payment?.payoutAddressEvm ?? "";

  return (
    <>
      <section className="hero">
        <span className={`badge ${mode === "sandbox" ? "sandbox" : ""}`}>
          {mode === "sandbox" ? "Sandbox mode" : "Hosted API mode"}
        </span>
        <h1>Pay once. No mandate.</h1>
        <p>
          Zero config uses demo products. Connect an API key under{" "}
          <Link href="/settings">Settings</Link> to load{" "}
          <strong>Once</strong> prices from your billing portal, then checkout opens Autlantic{" "}
          <code>/checkout/pay/:id</code>.
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
        {products.map((product) => (
          <article
            key={product.id}
            className={`plan ${product.highlighted ? "highlighted" : ""}`}
          >
            <h2>{product.name}</h2>
            <p className="interval">{product.description}</p>
            <p className="price">
              ${product.amountUsdc.toFixed(2)}
              <span className="interval"> USDC once</span>
            </p>
            <ul>
              {product.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button
              type="button"
              className={productId === product.id ? "btn" : "btn secondary"}
              onClick={() => setProductId(product.id)}
            >
              {productId === product.id ? "Selected" : "Select"}
            </button>
          </article>
        ))}
      </div>

      <form className="panel" onSubmit={createIntent}>
        <h2>Create payment</h2>
        <p className="hint">
          {mode === "sandbox"
            ? "Sandbox keeps the intent local and lets you simulate a USDC transfer."
            : "Hosted mode creates a payment from your portal price and redirects to Autlantic checkout."}
        </p>

        <div className="field">
          <label htmlFor="product">Product</label>
          <select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={products.length === 0}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · ${p.amountUsdc} once
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="wallet">Customer wallet (Base)</label>
          <input
            id="wallet"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x…"
            required
            spellCheck={false}
          />
        </div>

        <button className="btn" type="submit" disabled={busy || !productId}>
          {busy ? "Creating…" : mode === "sandbox" ? "Create payment (sandbox)" : "Continue to checkout"}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </form>

      {payment ? (
        <div className="panel">
          <h2>
            Payment {payment.status === "paid" ? "paid" : "open"} · $
            {payment.amountUsdc.toFixed(2)} USDC
          </h2>
          <p className="mono">{payment.id}</p>
          {payout ? (
            <p className="hint" style={{ marginTop: 8 }}>
              Payout {payout}
            </p>
          ) : null}
          {payment.usdcAddress ? <p className="hint">USDC {payment.usdcAddress}</p> : null}
          {payment.transferCalldata ? (
            <>
              <p className="hint" style={{ marginTop: 8 }}>
                Transfer calldata
              </p>
              <p className="mono">{payment.transferCalldata.slice(0, 66)}…</p>
            </>
          ) : null}

          {payment.status === "open" && (payment.mode === "sandbox" || !payment.mode) ? (
            <div style={{ marginTop: 16 }}>
              <button className="btn" type="button" disabled={busy} onClick={() => void sandboxPay()}>
                {busy ? "Paying…" : "Simulate USDC transfer (sandbox)"}
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
