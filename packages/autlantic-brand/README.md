# Autlantic brand tokens

Single source of truth for colors used on:

- **App** — `apps/web` (`globals.css` imports `tokens.css`)
- **Docs** — `apps/docs` (VitePress `custom.css` maps `--vp-*` to these tokens)

Edit `tokens.css` only here when changing the brand palette.

**Accent:** VitePress indigo (purple-blue), not `#0666ff` flat blue.

| Role | Light | Dark |
|------|-------|------|
| Buttons / primary | `#5672cd` | `#5c73e7` |
| Links / emphasis | `#3451b2` | `#a8b1ff` |
| Hover | `#3a5ccc` | `#a8b1ff` |
