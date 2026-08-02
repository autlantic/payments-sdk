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

export function StoreHome({ focusPlanId }: { focusPlanId?: string }) {
  const [mode, setMode] = useState<"sandbox" | "hosted">("sandbox");
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [catalogHint, setCatalogHint] = useState<string | null>(null);
  const [planId, setPlanId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubscribeResult | null>(null);

  useEffect(() => {
    void loadCatalog();
  }, [focusPlanId]);

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
      const preferred =
        (focusPlanId && nextPlans.find((p) => p.id === focusPlanId)?.id) ||
        nextPlans.find((p) => p.highlighted)?.id ||
        nextPlans[0]?.id ||
        "";
      setPlanId(preferred);
    } catch {
      setCatalogHint("Could not load catalog");
    }
  }

  async function checkout(nextPlanId: string) {
    setPlanId(nextPlanId);
    setBusyId(nextPlanId);
    setError(null);
    setResult(null);
    try {
      const selected = plans.find((p) => p.id === nextPlanId);
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: nextPlanId,
          priceId: selected?.priceId,
          activate: mode === "sandbox",
        }),
      });
      const data = (await res.json()) as SubscribeResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Subscribe failed");
      setResult(data);

      if (typeof window !== "undefined" && data.subscription?.id) {
        window.localStorage.setItem("acme_subscription_id", data.subscription.id);
      }

      if (mode === "hosted" && data.checkoutUrl && !data.checkoutUrl.startsWith("sandbox://")) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscribe failed");
    } finally {
      setBusyId(null);
    }
  }

  const busy = Boolean(busyId);

  return (
    <>
      <section className="hero">
        <span className={`badge ${mode === "sandbox" ? "sandbox" : "hosted"}`}>
          {mode === "sandbox" ? "Sandbox mode" : "Hosted API mode"}
        </span>
        <p className="hero__eyebrow">Recurring</p>
        <h1>Ship USDC memberships</h1>
        <p>
          {mode === "sandbox" ? (
            <>
              Nova Analytics and Signal Desk style plans. Sandbox activates instantly. Connect an API
              key under <Link href="/settings">Settings</Link> for portal prices. Need an invoice or
              QR? See <Link href="/payment-links">payment links</Link>.
            </>
          ) : (
            <>
              Pick a plan to open Autlantic hosted checkout. For fixed invoices without a catalog
              pick, use <Link href="/payment-links">payment links</Link>.
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
        {plans.map((plan) => {
          const selected = planId === plan.id;
          const loading = busyId === plan.id;
          return (
            <article
              key={plan.id}
              className={`plan ${plan.highlighted || selected ? "highlighted" : ""} ${
                focusPlanId === plan.id ? "focus-ring" : ""
              }`}
            >
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
                className="btn"
                disabled={busy || plans.length === 0}
                onClick={() => void checkout(plan.id)}
              >
                {loading
                  ? "Opening…"
                  : mode === "sandbox"
                    ? "Subscribe (sandbox)"
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

      {result ? (
        <div className="panel">
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
        </div>
      ) : null}
    </>
  );
}
