"use client";

import { ModeBadge } from "@/components/mode-badge";
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
      <section className="hero">
        <ModeBadge />
        <h1>One-time and recurring USDC on Base</h1>
        <p>
          {mode === "hosted"
            ? "Connected to your billing API. Open one-time or recurring to shop from your portal catalog."
            : "Two runnable flows in one demo store. Use sandbox products out of the box, or connect your portal under Settings."}
        </p>
      </section>

      <div className="plans">
        <article className="plan highlighted">
          <h2>One-time payment</h2>
          <p className="interval">
            Single USDC charge. Hosted mode loads Once prices from your portal and opens Autlantic
            checkout.
          </p>
          <ul>
            <li>createPayment</li>
            <li>Hosted /checkout/pay</li>
            <li>No renewals</li>
          </ul>
          <Link className="btn" href="/one-time">
            Open one-time example
          </Link>
        </article>

        <article className="plan">
          <h2>Recurring subscription</h2>
          <p className="interval">
            Monthly or yearly membership. Hosted mode loads portal prices and opens Autlantic
            checkout.
          </p>
          <ul>
            <li>createSubscription</li>
            <li>Hosted /checkout/subscribe</li>
            <li>Webhooks + cancel</li>
          </ul>
          <Link className="btn secondary" href="/recurring">
            Open recurring example
          </Link>
        </article>
      </div>

      <div className="panel">
        <h2>How this pairs with the portal</h2>
        <p className="hint">
          Open <Link href="/settings">Settings</Link> and paste your API key, merchant ID, payout
          wallet, and webhook secret from{" "}
          <a href="https://portal.autlantic.com">portal.autlantic.com</a>. Leave the API key empty to
          stay in sandbox with demo products.
        </p>
      </div>
    </>
  );
}
