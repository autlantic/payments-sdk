import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <span className="badge">Autlantic Payments SDK examples</span>
        <h1>One-time and recurring USDC on Base</h1>
        <p>
          Two runnable flows in one demo store. Pick the pattern that matches your product, then
          copy the API routes into your own app.
        </p>
      </section>

      <div className="plans">
        <article className="plan highlighted">
          <h2>One-time payment</h2>
          <p className="interval">
            Day pass, lifetime unlock, credit pack. Single USDC transfer to your wallet. No
            mandate, no renewals.
          </p>
          <p className="price" style={{ fontSize: "1.35rem" }}>
            @autlantic/chain-evm
          </p>
          <ul>
            <li>UsdcPassPaymentIntent</li>
            <li>encodeTransferCalldata</li>
            <li>verifyUsdcPassPaymentFromTxHash</li>
          </ul>
          <Link className="btn" href="/one-time">
            Open one-time example
          </Link>
        </article>

        <article className="plan">
          <h2>Recurring subscription</h2>
          <p className="interval">
            Monthly or yearly membership. Create subscription, activate mandate, charge invoices,
            handle webhooks.
          </p>
          <p className="price" style={{ fontSize: "1.35rem" }}>
            @autlantic/payments-recurring
          </p>
          <ul>
            <li>createSubscription</li>
            <li>activateSubscription</li>
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
          Open{" "}
          <Link href="/settings">Settings</Link> and paste your API key, merchant ID, payout wallet,
          and webhook secret from{" "}
          <a href="https://portal.autlantic.com">portal.autlantic.com</a>. Leave the API key empty to
          stay in sandbox.
        </p>
      </div>
    </>
  );
}
