# Postman collection

Ready-made requests for the Autlantic Billing API (catalog, subscriptions, payments, payment links, public checkout).

## Download / import

<a href="https://docs.autlantic.com/postman/autlantic-billing.postman_collection.json" target="_blank" rel="noopener">Download Postman collection (JSON)</a>

Or import from URL in Postman → **Import** → **Link**:

```text
https://docs.autlantic.com/postman/autlantic-billing.postman_collection.json
```

```bash
curl -fsSL https://docs.autlantic.com/postman/autlantic-billing.postman_collection.json \
  -o autlantic-billing.postman_collection.json
```

## Setup

1. Set collection variable `apiKey` to a portal **Test** key (`abk_test_…`)
2. Optionally set `priceId`, wallets, and `baseUrl` (default production)
3. Run **List products**, then **Create subscription** / **Create payment link**

## Related

- [OpenAPI](/api/openapi)
- [Hosted HTTP API](/api/http)
- [Local webhooks](/guide/local-webhooks)
