# OpenAPI

Machine-readable Autlantic Billing HTTP API (OpenAPI **3.1**).

## Download / import

<a href="https://docs.autlantic.com/openapi.yaml" target="_blank" rel="noopener">Open `openapi.yaml`</a> (raw file)

Import into Postman, Insomnia, Speakeasy, or your OpenAPI codegen.

```bash
curl -fsSL https://docs.autlantic.com/openapi.yaml -o openapi.yaml
```

## What’s covered

- Authenticated `/v1/*` (products, subscriptions, invoices, payments, payment links)
- Public `/checkout/*` (subscribe, pay, payment links)
- API key auth (`x-autlantic-api-key`) and optional `Idempotency-Key`

Base URL in the spec: `https://billing.autlantic.com`

## Related

- [Hosted HTTP API](/api/http) (human-readable tables)
- [Postman collection](/resources/postman)
- [15-minute integration](/guide/integration)
- [Node.js SDK](/api/nodejs)
