# Local webhooks

Receive Autlantic webhooks on your laptop while developing. Always verify the **raw** body with your portal endpoint secret.

## 1. Add a Test webhook in the portal

1. [portal.autlantic.com](https://portal.autlantic.com) → **Test** mode → **Webhooks**  
2. Add endpoint URL (you will fill this after the tunnel starts)  
3. Copy the **signing secret** → `AUTLANTIC_BILLING_WEBHOOK_SECRET`  
4. Keep Test secret with Test API keys only  

## 2. Run a public tunnel to localhost

### Cloudflare Tunnel (recommended)

```bash
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/
cloudflared tunnel --url http://localhost:3000
```

Copy the `https://….trycloudflare.com` URL.

### ngrok

```bash
ngrok http 3000
```

Copy the `https://….ngrok-free.app` (or similar) URL.

Point the portal webhook to:

```text
https://YOUR-TUNNEL/api/webhooks/billing
```

(or whatever path your app uses).

## 3. Minimal receiver (Next.js App Router)

```ts
// app/api/webhooks/billing/route.ts
import {
  verifyBillingWebhookDetailed,
  parseBillingWebhookEventDetailed,
} from "@autlantic/payments-recurring";

export async function POST(req: Request) {
  const rawBody = await req.text(); // must be raw, not re-serialized JSON
  const signature = req.headers.get("x-autlantic-signature");

  const verified = verifyBillingWebhookDetailed(
    process.env.AUTLANTIC_BILLING_WEBHOOK_SECRET!,
    rawBody,
    signature,
  );
  if (!verified.ok) {
    console.warn("webhook.verify_failed", verified.reason);
    return new Response("bad signature", { status: 400 });
  }

  const parsed = parseBillingWebhookEventDetailed(rawBody);
  if (!parsed.ok) {
    console.warn("webhook.parse_failed", parsed.reason);
    return new Response("bad body", { status: 400 });
  }

  console.log("webhook.ok", parsed.event.type, parsed.event.id);
  // grant access / update order here
  return new Response("ok");
}
```

Disable body parsers that consume the stream before you call `.text()` (framework-dependent).

## 4. Trigger an event

Fastest:

1. Create a **payment link** in the portal (or SDK)  
2. Open the checkout URL and pay in Test  
3. Watch your terminal for `payment.created` / `payment.paid`  
4. In the portal → **Webhooks** → confirm **DELIVERED** / HTTP 200  

If delivery is **Failed**, open the Failed filter, read the error, fix your URL / signature, then **Retry now**.

## 5. Common failures

| Symptom | Fix |
|---------|-----|
| `missing_header` / always invalid | Wrong secret (Test vs Live), or body was parsed/restringified |
| Tunnel 502 | Local server not running on the tunneled port |
| 401 on API, webhooks fine | API key mode ≠ webhook endpoint mode |
| Event never arrives | Endpoint disabled, wrong URL, or firewall blocking POSTs |

## Related

- [Webhooks](/guide/webhooks)  
- [Debugging](/guide/debugging)  
- [15-minute integration](/guide/integration)
