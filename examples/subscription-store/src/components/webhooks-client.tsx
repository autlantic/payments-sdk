"use client";

import { useCallback, useEffect, useState } from "react";

type EventRow = {
  receivedAt: string;
  verified: boolean;
  event: { type?: string; id?: string; raw?: string; parseError?: string };
};

export function WebhooksClient() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/events");
      const data = (await res.json()) as { events: EventRow[] };
      setEvents(data.events ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load events");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <>
      <section className="hero">
        <h1>Webhook inbox</h1>
        <p>
          Point your billing portal webhook endpoint to{" "}
          <code className="mono">/api/webhooks/billing</code> on this store. Events are verified with{" "}
          <code>verifyBillingWebhook</code> and listed here.
        </p>
      </section>

      <div className="panel">
        <h2>Recent deliveries</h2>
        <p className="hint">Auto-refreshes every few seconds. Max 50 events kept in memory.</p>
        <button className="btn secondary" type="button" onClick={() => void refresh()}>
          Refresh now
        </button>
        {error ? <p className="error">{error}</p> : null}

        {events.length === 0 ? (
          <p className="hint" style={{ marginTop: 16 }}>
            No events yet. In sandbox mode, activate a subscription then POST a signed event, or
            configure an endpoint in the portal for hosted mode.
          </p>
        ) : (
          <table className="table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Received</th>
                <th>Verified</th>
                <th>Type</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {events.map((row, i) => (
                <tr key={`${row.receivedAt}-${i}`}>
                  <td>{new Date(row.receivedAt).toLocaleString()}</td>
                  <td>{row.verified ? "yes" : "no"}</td>
                  <td>{row.event.type ?? row.event.parseError ?? "—"}</td>
                  <td className="mono">{row.event.id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
