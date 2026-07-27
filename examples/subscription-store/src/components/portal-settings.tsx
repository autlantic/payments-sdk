"use client";

import { useEffect, useState } from "react";

type ConfigForm = {
  portalUrl: string;
  apiUrl: string;
  apiKey: string;
  merchantId: string;
  payoutAddressEvm: string;
  webhookSecret: string;
  sandbox: boolean;
  mode: "sandbox" | "hosted";
  apiKeySet: boolean;
  webhookSecretSet: boolean;
  webhookUrlHint: string;
};

const empty: ConfigForm = {
  portalUrl: "https://portal.autlantic.com",
  apiUrl: "https://billing.autlantic.com",
  apiKey: "",
  merchantId: "",
  payoutAddressEvm: "",
  webhookSecret: "",
  sandbox: true,
  mode: "sandbox",
  apiKeySet: false,
  webhookSecretSet: false,
  webhookUrlHint: "/api/webhooks/billing",
};

export function PortalSettings() {
  const [form, setForm] = useState<ConfigForm>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [catalogCount, setCatalogCount] = useState<number | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/config");
      const data = (await res.json()) as ConfigForm;
      setForm({
        portalUrl: data.portalUrl || "https://portal.autlantic.com",
        apiUrl: data.apiUrl || "https://billing.autlantic.com",
        apiKey: data.apiKey || "",
        merchantId: data.merchantId || "",
        payoutAddressEvm: data.payoutAddressEvm || "",
        webhookSecret: data.webhookSecret || "",
        sandbox: data.sandbox !== false,
        mode: data.mode || "sandbox",
        apiKeySet: Boolean(data.apiKeySet),
        webhookSecretSet: Boolean(data.webhookSecretSet),
        webhookUrlHint: data.webhookUrlHint || "/api/webhooks/billing",
      });
      if (data.mode === "hosted") {
        void probeCatalog();
      } else {
        setCatalogCount(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load settings");
    }
  }

  async function probeCatalog() {
    try {
      const [plansRes, onceRes] = await Promise.all([
        fetch("/api/plans"),
        fetch("/api/one-time/products"),
      ]);
      const plans = (await plansRes.json()) as { plans?: unknown[] };
      const once = (await onceRes.json()) as { products?: unknown[] };
      setCatalogCount((plans.plans?.length ?? 0) + (once.products?.length ?? 0));
    } catch {
      setCatalogCount(null);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalUrl: form.portalUrl,
          apiUrl: form.apiUrl,
          apiKey: form.apiKey,
          merchantId: form.merchantId,
          payoutAddressEvm: form.payoutAddressEvm,
          webhookSecret: form.webhookSecret,
          sandbox: form.sandbox,
        }),
      });
      const data = (await res.json()) as ConfigForm & { error?: string; mode?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage(
        data.mode === "hosted"
          ? "Connected. Recurring and one-time pages now load your portal catalog."
          : "Saved. Still in sandbox (paste an API key to connect the billing API).",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetToSandbox() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      });
      if (!res.ok) throw new Error("Could not reset");
      setMessage("Cleared. Back to in-process sandbox with demo products.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  const webhookFullUrl = origin ? `${origin}${form.webhookUrlHint}` : form.webhookUrlHint;
  const portalHref = form.portalUrl || "https://portal.autlantic.com";

  return (
    <>
      <section className="hero">
        <span className={`badge ${form.mode === "sandbox" ? "sandbox" : "hosted"}`}>
          {form.mode === "sandbox" ? "Sandbox mode" : "Hosted API mode"}
        </span>
        <h1>Portal connection</h1>
        <p>
          Paste credentials from the{" "}
          <a href={portalHref} target="_blank" rel="noreferrer">
            merchant portal
          </a>
          . An API key switches this store to hosted mode so Recurring and One-time load your real
          catalog.
        </p>
        {form.mode === "hosted" && catalogCount != null ? (
          <p className="hint" style={{ marginTop: 12 }}>
            Catalog connected · {catalogCount} active price{catalogCount === 1 ? "" : "s"} visible
            across recurring and one-time.
          </p>
        ) : null}
      </section>

      <div className="panel">
        <h2>Where to find each field</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Where</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>API URL</td>
              <td>
                <code>https://billing.autlantic.com</code> (not the portal UI host)
              </td>
            </tr>
            <tr>
              <td>API key</td>
              <td>Portal → Developers → API keys</td>
            </tr>
            <tr>
              <td>Merchant ID</td>
              <td>Portal → Settings → Profile</td>
            </tr>
            <tr>
              <td>Payout address</td>
              <td>Portal → Settings → Billing → Base USDC payout</td>
            </tr>
            <tr>
              <td>Webhook secret</td>
              <td>Portal → Settings → Webhooks</td>
            </tr>
          </tbody>
        </table>
      </div>

      <form
        className="panel"
        onSubmit={(e) => {
          void save(e);
        }}
      >
        <h2>Credentials</h2>
        <p className="hint">
          Stored in this example server&apos;s memory for the current process. Prefer Railway /{" "}
          <code>.env</code> for durable config.
        </p>

        <div className="field">
          <label htmlFor="apiUrl">Billing API URL</label>
          <input
            id="apiUrl"
            value={form.apiUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, apiUrl: e.target.value }))}
            placeholder="https://billing.autlantic.com"
            spellCheck={false}
          />
        </div>

        <div className="field">
          <label htmlFor="apiKey">
            API key {form.apiKeySet ? "(saved · leave blank to keep)" : "(required for hosted mode)"}
          </label>
          <input
            id="apiKey"
            type="password"
            autoComplete="off"
            value={form.apiKey}
            onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
            placeholder="abk_…"
            spellCheck={false}
          />
        </div>

        <div className="field">
          <label htmlFor="merchantId">Merchant ID</label>
          <input
            id="merchantId"
            value={form.merchantId}
            onChange={(e) => setForm((prev) => ({ ...prev, merchantId: e.target.value }))}
            placeholder="mer_…"
            spellCheck={false}
          />
        </div>

        <div className="field">
          <label htmlFor="payout">Payout wallet (Base)</label>
          <input
            id="payout"
            value={form.payoutAddressEvm}
            onChange={(e) => setForm((prev) => ({ ...prev, payoutAddressEvm: e.target.value }))}
            placeholder="0x…"
            spellCheck={false}
          />
        </div>

        <div className="field">
          <label htmlFor="webhookSecret">
            Webhook signing secret {form.webhookSecretSet ? "(saved · leave blank to keep)" : ""}
          </label>
          <input
            id="webhookSecret"
            type="password"
            autoComplete="off"
            value={form.webhookSecret}
            onChange={(e) => setForm((prev) => ({ ...prev, webhookSecret: e.target.value }))}
            placeholder="whsec_…"
            spellCheck={false}
          />
        </div>

        <div className="field">
          <label htmlFor="portalUrl">Portal URL (links only)</label>
          <input
            id="portalUrl"
            value={form.portalUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, portalUrl: e.target.value }))}
            placeholder="https://portal.autlantic.com"
            spellCheck={false}
          />
        </div>

        <label className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            checked={form.sandbox}
            onChange={(e) => setForm((prev) => ({ ...prev, sandbox: e.target.checked }))}
          />
          <span>
            <strong>Test API key</strong>
            <span className="hint" style={{ display: "block", margin: 0 }}>
              Keep on when using a portal test key. This is separate from Sandbox vs Hosted store
              mode (which depends on whether an API key is set).
            </span>
          </span>
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save and connect"}
          </button>
          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={() => void resetToSandbox()}
          >
            Reset to sandbox
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {message ? <div className="success">{message}</div> : null}
      </form>

      <div className="panel">
        <h2>Webhook endpoint for the portal</h2>
        <p className="hint">
          In portal → Webhooks → Add endpoint, paste this URL (use a tunnel like ngrok for local
          dev):
        </p>
        <p className="mono">{webhookFullUrl}</p>
      </div>
    </>
  );
}
