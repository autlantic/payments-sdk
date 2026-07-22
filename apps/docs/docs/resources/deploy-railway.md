# Deploy docs on Railway

This site is a static VitePress build served with `serve`. Deploy it as its own Railway service for `docs.autlantic.com`.

## 1. Railway service settings

1. Service name: `@autlantic/docs` (or any name you prefer)
2. **Settings → Config file path:** `/railway.docs.toml`
3. Root directory: leave empty (repo root)
4. Custom domain: `docs.autlantic.com`

## 2. Build & start

```bash
pnpm install --frozen-lockfile
pnpm --filter @autlantic/docs build
# start: serve static files on $PORT
```

No database or worker needed.

## 3. Custom domain

1. Railway service → **Settings → Networking → Custom Domain**
2. Add `docs.autlantic.com`
3. At your DNS host, add the CNAME Railway shows.

## 4. Health

Railway probes HTTP on `$PORT`. The `serve` process responds with 200 for static files.

## Local dev

```bash
pnpm --filter @autlantic/docs dev
pnpm --filter @autlantic/docs build
pnpm --filter @autlantic/docs preview
```

## Updating content

Edit markdown under `apps/docs/docs/`, then push to the branch Railway watches (typically `main`).
