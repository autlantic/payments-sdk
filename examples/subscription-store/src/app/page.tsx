"use client";

import { ModeBadge } from "@/components/mode-badge";
import { STORE_TYPE_EXAMPLES } from "@/lib/store-types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [mode, setMode] = useState<"sandbox" | "hosted" | null>(null);

  useEffect(() => {
    void fetch("/api/meta")
      .then((r) => r.json())
      .then((data: { mode?: "sandbox" | "hosted" }) => {
        if (data.mode) setMode(data.mode);
      })
      .catch(() => setMode("sandbox"));
  }, []);

  return (
    <>
      <section className="hero hero--home">
        <ModeBadge />
        <p className="hero__eyebrow">Autlantic Billing</p>
        <h1>Six stores. Three ways to get paid.</h1>
        <p>
          {mode === "hosted"
            ? "Connected to your billing API. Pick a store type and run the matching checkout against your catalog."
            : "Real merchant patterns for recurring memberships, one-time catalog checkout, and shareable payment links."}
        </p>
        <div className="hero__actions">
          <Link className="btn" href="#stores">
            Browse store types
          </Link>
        </div>
      </section>

      <section id="stores">
        <div className="section-head">
          <h2>Store types</h2>
          <p>Each one maps to an Autlantic method. Open it to run the flow.</p>
        </div>
        <div className="store-grid">
          {STORE_TYPE_EXAMPLES.map((store) => (
            <Link key={store.id} href={store.href} className="store-card">
              <p className="store-card__industry">
                {store.industry} · {store.methodLabel}
              </p>
              <h3>{store.name}</h3>
              <p className="store-card__pitch">{store.pitch}</p>
              <p className="store-card__amount">{store.amountLabel}</p>
              <p className="store-card__when">
                <strong>Use when</strong> {store.whenToUse}
              </p>
              <span className="btn">Try this flow</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="methods-strip">
        <Link className="method-block" href="/recurring">
          <h3>Subscriptions</h3>
          <p>SaaS seats and creator memberships that renew on Base.</p>
          <span className="method-block__go">Open recurring</span>
        </Link>
        <Link className="method-block" href="/one-time">
          <h3>Catalog pay</h3>
          <p>Courses, tickets, and downloads with a single charge.</p>
          <span className="method-block__go">Open one-time</span>
        </Link>
        <Link className="method-block" href="/payment-links">
          <h3>Payment links</h3>
          <p>Invoices and counter QR codes you can share anywhere.</p>
          <span className="method-block__go">Open links</span>
        </Link>
      </div>

      <div className="panel">
        <h2>Connect your portal</h2>
        <p className="hint" style={{ marginBottom: 0 }}>
          Open <Link href="/settings">Settings</Link> and paste your API key, merchant ID, payout
          wallet, and webhook secret from{" "}
          <a href="https://portal.autlantic.com">portal.autlantic.com</a>. Leave the API key empty to
          stay in sandbox.
        </p>
      </div>
    </>
  );
}
