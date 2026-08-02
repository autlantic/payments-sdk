"use client";

import { formatUsdc } from "@/lib/catalog";
import Link from "next/link";
import { useEffect, useState } from "react";

type LinkPayload = {
  mode: "sandbox" | "hosted";
  paymentLink: {
    id: string;
    status: string;
    amountUsdc: number;
    description?: string | null;
  };
  url: string;
  error?: string;
};

type Payment = {
  id: string;
  status: string;
  amountUsdc: number;
  txHash?: string | null;
};

export function PayLinkClient({ linkId }: { linkId: string }) {
  const [data, setData] = useState<LinkPayload | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/payment-links/${encodeURIComponent(linkId)}`)
      .then(async (res) => {
        const json = (await res.json()) as LinkPayload;
        if (!res.ok) throw new Error(json.error ?? "Not found");
        setData(json);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load link");
      });
  }, [linkId]);

  async function paySandbox() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/payment-links/${encodeURIComponent(linkId)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { payment?: Payment; error?: string };
      if (!res.ok || !json.payment) throw new Error(json.error ?? "Pay failed");
      setPayment(json.payment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pay failed");
    } finally {
      setBusy(false);
    }
  }

  async function openHosted() {
    if (!data?.url || data.url.startsWith("sandbox://")) {
      setError("No hosted checkout URL available");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <>
      <section className="hero">
        <p className="hero__eyebrow">Payer page</p>
        <h1>Pay with USDC</h1>
        <p>
          This is the page a customer opens from your shared URL or QR. In hosted mode Autlantic
          serves <code>/checkout/link/:id</code>.
        </p>
      </section>

      {!data && !error ? <div className="panel">Loading link…</div> : null}
      {error ? (
        <div className="panel">
          <p className="error" style={{ margin: 0 }}>
            {error}
          </p>
        </div>
      ) : null}

      {data ? (
        <div className="panel">
          <h2>{data.paymentLink.description || "Payment request"}</h2>
          <p className="price" style={{ marginTop: 12 }}>
            ${formatUsdc(data.paymentLink.amountUsdc)}
            <span className="interval"> USDC</span>
          </p>
          <p className="hint">Status {data.paymentLink.status}</p>
          <p className="mono">{data.paymentLink.id}</p>
          <div className="btn-row">
            {data.mode === "sandbox" ? (
              <button className="btn" type="button" disabled={busy} onClick={() => void paySandbox()}>
                {busy ? "Paying…" : "Simulate USDC payment (sandbox)"}
              </button>
            ) : (
              <button className="btn" type="button" disabled={busy} onClick={() => void openHosted()}>
                {busy ? "Opening…" : "Continue to Autlantic checkout"}
              </button>
            )}
            <Link className="btn secondary" href="/payment-links">
              Create another link
            </Link>
          </div>
          {payment ? (
            <div className="success">
              <strong>Paid · ${formatUsdc(payment.amountUsdc)} USDC</strong>
              <div className="mono" style={{ marginTop: 8 }}>
                {payment.id}
              </div>
              {payment.txHash ? (
                <div className="mono" style={{ marginTop: 4 }}>
                  tx {payment.txHash}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
