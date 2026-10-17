# Benefit Gym

The website of Benefit Gym in Schijndel. It is built with [EmDash](https://github.com/emdash-cms/emdash) on Astro and runs on Cloudflare Workers, with D1 for content and R2 for media. The code started from the EmDash starter template for Cloudflare.

## Local development

```bash
pnpm install
pnpm emdash secrets generate --write=.env
pnpm dev
```

Then open http://localhost:4321/_emdash/admin and complete the setup wizard. It runs the database migrations and applies the seed in `seed/seed.json`. The site itself is at http://localhost:4321.

The fonts and the drawings come from a separate host, read from `STATIC_URL`. For local work put `STATIC_URL=http://localhost:4179` in `.dev.vars` and serve `fonts/` plus `tekeningen/<slug>/` on that port with a CORS header for the fonts. Each page draws itself from `src/layout/<slug>.json`, which holds the measured place and size of every field and no text. The menu bar and the footer draw themselves from `src/layout/algemeen/menu.json` and `src/layout/algemeen/footer.json`, with their labels from the menus, the list Gegevens, the widget area Footer and Social in the admin. Images outside the drawings are served as AVIF with a PNG fallback.

The code is formatted with Prettier and its Astro plugin: `pnpm format` writes, `pnpm format:check` only checks. Generated files stay out of it, as `.prettierignore` lists.

## Caching

Public pages are cached at the edge in the Workers Cache through Astro's Cloudflare cache provider. `astro.config.mjs` gives every public route a rule with its lifetime and the collections it renders as tags, and each page adds the tags of the entries, menus and settings it reads. EmDash purges those tags when content is published, so a change shows within seconds. Query results are cached in the KV namespace behind the `CACHE` binding. The toolbar runs in client mode: a signed-in editor sees an Edit button on a cached page, which opens the page fresh with the toolbar.

## Search engines and agents

The structured data comes from a small native plugin in `src/plugins/`, through the `page:metadata` hook. On `/` it is the graph of the gym from the list Gegevens plus Settings, with the social image of `/` as its image. Every page carries `og:locale`. On each sport page it is a Service or a Course from its group Zoekmachines. Other pages carry no block. Every address in it follows `EMDASH_SITE_URL`. `/llms.txt` is built from the site title, Gegevens and menu `primary`. A request that asks for `text/markdown` gets the `main` of a page as markdown from the Worker in `src/worker.ts`, with a `Vary: Accept` on both answers. The favicon, the logo and the social image of each page are media, set in Settings and in the SEO panel. The page for an address that does not exist reads its text from the widget area Niet gevonden.

## Admin dashboard

A second native plugin in `src/plugins/` puts one widget on the admin dashboard: every page of the collections in the sidebar folder Pagina's in one table, with its status and last change. A row opens the page in its editor. The widget uses React plus the admin's own CSS classes, so it needs no package beside `emdash`. No collection shows a quick button on the dashboard.

## Deploying

```bash
pnpm wrangler login
pnpm run deploy
```

This builds the site and deploys the Worker with Wrangler. The Worker only answers on its custom domain, which sits behind Cloudflare Access. The encryption key goes in as a secret with `pnpm wrangler secret put EMDASH_ENCRYPTION_KEY`.

## Docs

- [EmDash documentation](https://docs.emdashcms.com/)
- [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
