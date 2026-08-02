"use client";

import { ModeBadge } from "@/components/mode-badge";
import { formatUsdc } from "@/lib/catalog";
import { PAYMENT_LINK_PRESETS } from "@/lib/store-types";
import Link from "next/link";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState } from "react";

type LinkRow = {
  id: string;
  status: string;
  amountUsdc: number;
  description?: string | null;
  maxUses?: number | null;
  useCount?: number;
  expiresAt?: string | Date | null;
  priceId?: string;
  productName?: string;
  url: string;
  sdkUrl?: string;
};

type CreatedLink = {
  mode: "sandbox" | "hosted";
  paymentLink: LinkRow;
  url: string;
};

type CatalogPrice = {
  id: string;
  priceId?: string;
  name: string;
  amountUsdc: number;
  description?: string;
};

function formatExpiry(value?: string | Date | null): string {
  if (!value) return "No expiry";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "No expiry";
  return d.toLocaleString();
}

export function PaymentLinksClient({ initialPreset }: { initialPreset?: string }) {
  const preferred = useMemo(() => {
    if (initialPreset && PAYMENT_LINK_PRESETS.some((p) => p.id === initialPreset)) {
      return initialPreset;
    }
    return PAYMENT_LINK_PRESETS[0]?.id ?? "invoice";
  }, [initialPreset]);

  const [mode, setMode] = useState<"sandbox" | "hosted">("sandbox");
  const [presetId, setPresetId] = useState(preferred);
  const [priceId, setPriceId] = useState("");
  const [catalogPrices, setCatalogPrices] = useState<CatalogPrice[]>([]);
  const [catalogHint, setCatalogHint] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [listBusy, setListBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPresetId(preferred);
  }, [preferred]);

  const refreshList = useCallback(async () => {
    setListBusy(true);
    try {
      const res = await fetch("/api/payment-links");
      const data = (await res.json()) as {
        mode?: "sandbox" | "hosted";
        paymentLinks?: LinkRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not list links");
      if (data.mode) setMode(data.mode);
      setLinks(data.paymentLinks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not list links");
    } finally {
      setListBusy(false);
    }
  }, []);

  useEffect(() => {
    void refreshList();
    void (async () => {
      try {
        const [metaRes, productsRes] = await Promise.all([
          fetch("/api/meta"),
          fetch("/api/one-time/products"),
        ]);
        const meta = (await metaRes.json()) as { mode?: "sandbox" | "hosted" };
        const catalog = (await productsRes.json()) as {
          products?: CatalogPrice[];
          hint?: string;
          error?: string;
        };
        if (meta.mode) setMode(meta.mode);
        setCatalogPrices(catalog.products ?? []);
        setCatalogHint(catalog.hint ?? catalog.error ?? null);
        const first = catalog.products?.[0];
        if (meta.mode === "hosted" && first) {
          setPriceId(first.priceId ?? first.id);
        }
      } catch {
        /* ignore catalog probe */
      }
    })();
  }, [refreshList]);

  useEffect(() => {
    let cancelled = false;
    async function buildQr(url: string) {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 220,
          margin: 2,
          color: { dark: "#191c1f", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }
    if (created?.url) void buildQr(created.url);
    else setQrDataUrl(null);
    return () => {
      cancelled = true;
    };
  }, [created?.url]);

  async function createLink() {
    setBusy(true);
    setError(null);
    setCreated(null);
    setCopied(false);
    try {
      const amount = customAmount.trim() ? Number(customAmount) : undefined;
      if (amount != null && (!Number.isFinite(amount) || amount <= 0)) {
        throw new Error("Enter a valid custom amount, or leave it blank.");
      }
      const uses = maxUses.trim() ? Number(maxUses) : undefined;
      if (uses != null && (!Number.isFinite(uses) || uses < 1)) {
        throw new Error("Max uses must be a positive number, or leave blank for unlimited.");
      }

      const payload: Record<string, unknown> = {
        maxUses: uses ?? null,
        expiresAt: expiresAt.trim() ? new Date(expiresAt).toISOString() : null,
      };

      if (mode === "hosted" && priceId && !amount) {
        payload.priceId = priceId;
      } else {
        payload.presetId = presetId;
        if (amount != null) payload.amountUsdc = amount;
        if (mode === "hosted" && priceId) payload.priceId = priceId;
      }

      const res = await fetch("/api/payment-links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as CreatedLink & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setCreated(data);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function disableLink(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/payment-links/${encodeURIComponent(id)}/disable`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Disable failed");
      if (created?.paymentLink.id === id) {
        setCreated((prev) =>
          prev
            ? {
                ...prev,
                paymentLink: { ...prev.paymentLink, status: "disabled" },
              }
            : prev,
        );
      }
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disable failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const activePreset = PAYMENT_LINK_PRESETS.find((p) => p.id === presetId);
  const selectedPrice = catalogPrices.find((p) => (p.priceId ?? p.id) === priceId);

  return (
    <>
      <section className="hero">
        <ModeBadge />
        <p className="hero__eyebrow">Payment links</p>
        <h1>Share a link. Scan to pay.</h1>
        <p>
          Fixed-amount USDC URLs for invoices and in-person QR. Uses SDK{" "}
          <code>createPaymentLink</code>, <code>listPaymentLinks</code>, and{" "}
          <code>disablePaymentLink</code>. Hosted checkout is{" "}
          <code>/checkout/link/:id</code>.
        </p>
      </section>

      {mode === "hosted" && catalogPrices.length > 0 ? (
        <div className="panel">
          <h2>Portal once prices</h2>
          <p className="hint">
            Hosted mode can create links from your catalog <code>priceId</code> (interval once).
          </p>
          <div className="field">
            <label htmlFor="price-id">Catalog price</label>
            <select
              id="price-id"
              value={priceId}
              onChange={(e) => {
                setPriceId(e.target.value);
                setCustomAmount("");
              }}
            >
              {catalogPrices.map((p) => (
                <option key={p.id} value={p.priceId ?? p.id}>
                  {p.name} · ${formatUsdc(p.amountUsdc)} USDC
                </option>
              ))}
            </select>
          </div>
          {catalogHint ? <p className="hint">{catalogHint}</p> : null}
        </div>
      ) : null}

      {mode === "sandbox" || catalogPrices.length === 0 ? (
        <div className="plans">
          {PAYMENT_LINK_PRESETS.map((preset) => {
            const selected = presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`plan plan-selectable ${selected ? "highlighted" : ""}`}
                onClick={() => {
                  setPresetId(preset.id);
                  setPriceId("");
                }}
              >
                <h2>{preset.label}</h2>
                <p className="interval">{preset.description}</p>
                <p className="price">
                  ${formatUsdc(preset.amountUsdc)}
                  <span className="interval"> USDC once</span>
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="panel">
        <h2>Create shareable link</h2>
        <p className="hint">
          {mode === "hosted" && selectedPrice
            ? `Using catalog ${selectedPrice.name}. Optional custom amount overrides the catalog price.`
            : activePreset
              ? `Using ${activePreset.label}. Optional custom amount overrides the preset.`
              : "Pick a preset or catalog price."}
        </p>
        <div className="field">
          <label htmlFor="custom-amount">Custom amount (USDC, optional)</label>
          <input
            id="custom-amount"
            inputMode="decimal"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={
              selectedPrice
                ? String(selectedPrice.amountUsdc)
                : activePreset
                  ? String(activePreset.amountUsdc)
                  : "42"
            }
          />
        </div>
        <div className="field">
          <label htmlFor="max-uses">Max uses (optional)</label>
          <input
            id="max-uses"
            inputMode="numeric"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="field">
          <label htmlFor="expires-at">Expires at (optional)</label>
          <input
            id="expires-at"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <div className="btn-row">
          <button className="btn" type="button" disabled={busy} onClick={() => void createLink()}>
            {busy ? "Creating…" : "Create link + QR"}
          </button>
          <Link className="btn secondary" href="/">
            Back to store types
          </Link>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </div>

      {created ? (
        <div className="panel link-result">
          <div>
            <h2>
              {created.paymentLink.description || "Payment link"} · $
              {formatUsdc(created.paymentLink.amountUsdc)} USDC
            </h2>
            <p className="hint">
              Status {created.paymentLink.status}
              {created.paymentLink.maxUses != null
                ? ` · max ${created.paymentLink.maxUses} uses`
                : " · unlimited uses"}
              {" · "}
              {formatExpiry(created.paymentLink.expiresAt)}
            </p>
            <p className="mono">{created.paymentLink.id}</p>
            <p className="mono" style={{ marginTop: 10 }}>
              {created.url}
            </p>
            <div className="btn-row">
              <button className="btn" type="button" onClick={() => void copyUrl(created.url)}>
                {copied ? "Copied" : "Copy URL"}
              </button>
              <a className="btn secondary" href={created.url}>
                Open payer page
              </a>
              {created.paymentLink.status === "active" ? (
                <button
                  className="btn secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void disableLink(created.paymentLink.id)}
                >
                  Disable link
                </button>
              ) : null}
            </div>
          </div>
          <div className="link-result__qr">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Payment link QR code" width={220} height={220} />
            ) : (
              <p className="hint">Generating QR…</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="panel">
        <h2>Your payment links</h2>
        <p className="hint">
          From <code>listPaymentLinks</code>. Disable with <code>disablePaymentLink</code>.
        </p>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button
            className="btn secondary"
            type="button"
            disabled={listBusy}
            onClick={() => void refreshList()}
          >
            {listBusy ? "Refreshing…" : "Refresh list"}
          </button>
        </div>
        {links.length === 0 ? (
          <p className="hint" style={{ marginTop: 16, marginBottom: 0 }}>
            No links yet. Create one above.
          </p>
        ) : (
          <table className="table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Amount</th>
                <th>Uses</th>
                <th>Expires</th>
                <th>Link</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td>{link.status}</td>
                  <td>${formatUsdc(link.amountUsdc)} USDC</td>
                  <td>
                    {link.useCount ?? 0}
                    {link.maxUses != null ? ` / ${link.maxUses}` : " / ∞"}
                  </td>
                  <td>{formatExpiry(link.expiresAt)}</td>
                  <td className="mono">{link.id}</td>
                  <td>
                    <div className="btn-row" style={{ marginTop: 0 }}>
                      <a className="btn secondary" href={link.url}>
                        Open
                      </a>
                      {link.status === "active" ? (
                        <button
                          className="btn secondary"
                          type="button"
                          disabled={busy}
                          onClick={() => void disableLink(link.id)}
                        >
                          Disable
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
