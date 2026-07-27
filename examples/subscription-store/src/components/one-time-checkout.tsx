"use client";

import { ONE_TIME_PRODUCTS } from "@/lib/one-time-products";
import Link from "next/link";
import { useState } from "react";

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
  const [productId, setProductId] = useState(
    ONE_TIME_PRODUCTS.find((p) => p.highlighted)?.id ?? ONE_TIME_PRODUCTS[0].id,
  );
  const [wallet, setWallet] = useState(DEMO_WALLET);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  async function createIntent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setPayment(null);
    try {
      const res = await fetch("/api/one-time/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, customerWallet: wallet }),
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
        <span className="badge sandbox">One-time USDC</span>
        <h1>Pay once. No mandate.</h1>
        <p>
          Sandbox simulates a local USDC transfer. In hosted mode, checkout opens Autlantic{" "}
          <code>/checkout/pay/:id</code> (same pattern as subscriptions).
        </p>
      </section>

      <div className="plans">
        {ONE_TIME_PRODUCTS.map((product) => (
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
          Sandbox keeps the intent local. Hosted mode redirects to Autlantic checkout.
        </p>

        <div className="field">
          <label htmlFor="product">Product</label>
          <select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {ONE_TIME_PRODUCTS.map((p) => (
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

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create payment"}
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
