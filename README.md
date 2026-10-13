# Benefit Gym

The website of Benefit Gym in Schijndel. It is built with [EmDash](https://github.com/emdash-cms/emdash) on Astro and runs on Cloudflare Workers, with D1 for content and R2 for media. The code started from the EmDash starter template for Cloudflare.

## Local development

```bash
pnpm install
pnpm emdash secrets generate --write=.env
pnpm dev
```

Then open http://localhost:4321/_emdash/admin and complete the setup wizard. It runs the database migrations and applies the seed in `seed/seed.json`. The site itself is at http://localhost:4321.

The fonts and the drawings come from a separate host, read from `STATIC_URL`. For local work put `STATIC_URL=http://localhost:4179` in `.dev.vars` and serve `fonts/` plus `tekeningen/<slug>/` on that port with a CORS header for the fonts. Each page draws itself from `src/layout/<slug>.json`, which holds the measured place and size of every field and no text. The menu bar and the footer draw themselves from `src/layout/algemeen/menu.json` and `src/layout/algemeen/footer.json`, with their labels from the menus, the widget area Footer and Social in the admin. Images outside the drawings are served as AVIF with a PNG fallback.

## Deploying

```bash
pnpm wrangler login
pnpm run deploy
```

This builds the site and deploys the Worker with Wrangler. The Worker only answers on its custom domain, which sits behind Cloudflare Access. The encryption key goes in as a secret with `pnpm wrangler secret put EMDASH_ENCRYPTION_KEY`.

## Docs

- [EmDash documentation](https://docs.emdashcms.com/)
- [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
