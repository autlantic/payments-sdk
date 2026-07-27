"use client";

import { formatUsdc } from "@/lib/catalog";
import type { StorePlan } from "@/lib/plans";
import Link from "next/link";
import { useEffect, useState } from "react";

type SubscribeResult = {
  mode: "sandbox" | "hosted";
  plan: StorePlan;
  subscription: { id: string; status: string };
  invoice?: { id: string; status: string; amountUsdc: number; txHash?: string | null };
  checkoutUrl?: string;
  error?: string;
};

const DEMO_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

export function StoreHome() {
  const [mode, setMode] = useState<"sandbox" | "hosted">("sandbox");
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [catalogHint, setCatalogHint] = useState<string | null>(null);
  const [planId, setPlanId] = useState("");
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubscribeResult | null>(null);

  useEffect(() => {
    void loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      const [metaRes, plansRes] = await Promise.all([fetch("/api/meta"), fetch("/api/plans")]);
      const meta = (await metaRes.json()) as { mode?: "sandbox" | "hosted" };
      const catalog = (await plansRes.json()) as {
        source?: string;
        plans?: StorePlan[];
        hint?: string;
        error?: string;
      };
      const nextMode = meta.mode ?? "sandbox";
      setMode(nextMode);
      const nextPlans = catalog.plans ?? [];
      setPlans(nextPlans);
      setCatalogHint(catalog.hint ?? catalog.error ?? null);
      const preferred = nextPlans.find((p) => p.highlighted)?.id ?? nextPlans[0]?.id ?? "";
      setPlanId((prev) => (nextPlans.some((p) => p.id === prev) ? prev : preferred));
      setWallet((prev) => {
        if (prev) return prev;
        if (typeof window !== "undefined") {
          const saved = window.localStorage.getItem("acme_customer_wallet");
          if (saved) return saved;
        }
        return nextMode === "sandbox" ? DEMO_WALLET : "";
      });
    } catch {
      setCatalogHint("Could not load catalog");
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const selected = plans.find((p) => p.id === planId);
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          priceId: selected?.priceId,
          customerWallet: wallet,
          activate: mode === "sandbox",
        }),
      });
      const data = (await res.json()) as SubscribeResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Subscribe failed");
      setResult(data);

      if (typeof window !== "undefined" && data.subscription?.id) {
        window.localStorage.setItem("acme_subscription_id", data.subscription.id);
        window.localStorage.setItem("acme_customer_wallet", wallet);
      }

      if (mode === "hosted" && data.checkoutUrl && !data.checkoutUrl.startsWith("sandbox://")) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscribe failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="hero">
        <span className={`badge ${mode === "sandbox" ? "sandbox" : "hosted"}`}>
          {mode === "sandbox" ? "Sandbox mode" : "Hosted API mode"}
        </span>
        <h1>Ship recurring USDC memberships</h1>
        <p>
          {mode === "sandbox" ? (
            <>
              Demo plans below run in-process. Connect an API key under{" "}
              <Link href="/settings">Settings</Link> to load monthly and yearly prices from your{" "}
              <a href="https://portal.autlantic.com" target="_blank" rel="noreferrer">
                billing portal
              </a>
              . Prefer a single purchase? See the <Link href="/one-time">one-time example</Link>.
            </>
          ) : (
            <>
              Plans below come from your portal catalog. Subscribe creates a subscription and opens
              Autlantic checkout. Prefer a single purchase? See the{" "}
              <Link href="/one-time">one-time example</Link>.
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
        {plans.map((plan) => (
          <article key={plan.id} className={`plan ${plan.highlighted ? "highlighted" : ""}`}>
            <h2>{plan.name}</h2>
            {plan.description ? <p className="interval">{plan.description}</p> : null}
            <p className="price">
              ${formatUsdc(plan.amountUsdc)}
              <span className="interval"> USDC / {plan.interval}</span>
            </p>
            {plan.features.length > 0 ? (
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              className={planId === plan.id ? "btn" : "btn secondary"}
              onClick={() => setPlanId(plan.id)}
            >
              {planId === plan.id ? "Selected" : "Select"}
            </button>
          </article>
        ))}
      </div>

      <form className="panel" onSubmit={subscribe}>
        <h2>Subscribe with wallet</h2>
        <p className="hint">
          {mode === "sandbox"
            ? "Sandbox activates the mandate and pays the first invoice instantly."
            : "Creates a subscription from your portal price and redirects to Autlantic checkout."}
        </p>

        <div className="field">
          <label htmlFor="plan">Plan</label>
          <select
            id="plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            disabled={plans.length === 0}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · ${formatUsdc(p.amountUsdc)} / {p.interval}
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

        <button className="btn" type="submit" disabled={busy || plans.length === 0}>
          {busy ? "Creating…" : mode === "sandbox" ? "Subscribe (sandbox)" : "Continue to checkout"}
        </button>

        {error ? <p className="error">{error}</p> : null}

        {result ? (
          <div className="success">
            <strong>
              {result.plan.name} · {result.subscription.status}
            </strong>
            <div className="mono" style={{ marginTop: 8 }}>
              {result.subscription.id}
            </div>
            {result.invoice ? (
              <div style={{ marginTop: 8 }}>
                Invoice {result.invoice.status} · ${formatUsdc(result.invoice.amountUsdc)} USDC
                {result.invoice.txHash ? (
                  <div className="mono" style={{ marginTop: 4 }}>
                    tx {result.invoice.txHash}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div style={{ marginTop: 12 }}>
              <Link href={`/account?id=${encodeURIComponent(result.subscription.id)}`}>
                View account →
              </Link>
            </div>
          </div>
        ) : null}
      </form>
    </>
  );
}
