"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AccountPayload = {
  subscription: {
    id: string;
    status: string;
    walletAddress: string;
    amountUsdc: number;
    interval: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd?: boolean;
  };
  invoices: Array<{
    id: string;
    status: string;
    amountUsdc: number;
    dueAt: string;
    txHash?: string | null;
  }>;
  error?: string;
};

export function AccountClient({ initialId }: { initialId?: string }) {
  const [id, setId] = useState(initialId ?? "");
  const [data, setData] = useState<AccountPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialId && typeof window !== "undefined") {
      const saved = window.localStorage.getItem("acme_subscription_id");
      if (saved) setId(saved);
    }
  }, [initialId]);

  async function load(subId = id) {
    if (!subId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/subscriptions/${encodeURIComponent(subId.trim())}`);
      const json = (await res.json()) as AccountPayload;
      if (!res.ok) throw new Error(json.error ?? "Not found");
      setData(json);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("acme_subscription_id", subId.trim());
      }
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Could not load");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(immediate: boolean) {
    if (!id.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/subscriptions/${encodeURIComponent(id.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", immediate }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Cancel failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (id) void load(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Your subscription</h1>
        <p>Look up a subscription by ID from this example store (sandbox or hosted).</p>
      </section>

      <div className="panel">
        <div className="field">
          <label htmlFor="sub-id">Subscription ID</label>
          <input
            id="sub-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="sub_…"
            spellCheck={false}
          />
        </div>
        <button className="btn" type="button" disabled={busy || !id.trim()} onClick={() => void load()}>
          {busy ? "Loading…" : "Refresh"}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>

      {data ? (
        <div className="panel">
          <h2>Status: {data.subscription.status}</h2>
          <p className="hint">
            {data.subscription.amountUsdc.toFixed(2)} USDC / {data.subscription.interval}
            {data.subscription.cancelAtPeriodEnd ? " · cancels at period end" : ""}
          </p>
          <p className="mono">{data.subscription.walletAddress}</p>
          <p className="hint" style={{ marginTop: 8 }}>
            Period ends {new Date(data.subscription.currentPeriodEnd).toLocaleString()}
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <button
              className="btn secondary"
              type="button"
              disabled={busy || data.subscription.status === "canceled"}
              onClick={() => void cancel(false)}
            >
              Cancel at period end
            </button>
            <button
              className="btn secondary"
              type="button"
              disabled={busy || data.subscription.status === "canceled"}
              onClick={() => void cancel(true)}
            >
              Cancel now
            </button>
            <Link className="btn secondary" href="/">
              Back to plans
            </Link>
          </div>

          <h2 style={{ marginTop: 24 }}>Invoices</h2>
          {data.invoices.length === 0 ? (
            <p className="hint">No invoices yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="mono">{inv.id}</td>
                    <td>{inv.status}</td>
                    <td>${inv.amountUsdc.toFixed(2)} USDC</td>
                    <td>{new Date(inv.dueAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </>
  );
}
