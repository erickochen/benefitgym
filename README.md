# Benefit Gym

The website of Benefit Gym in Schijndel.

## Stack

- [EmDash](https://docs.emdashcms.com/) as the CMS, on Astro 7
- Cloudflare Workers with D1 for content, R2 for media and KV for cached queries
- The EmDash forms plugin with Turnstile, mail through Cloudflare Email Sending
- pnpm and Prettier

## How it works

One Worker serves the site, the admin at `/_emdash/admin` and its API. Content lives in D1 and is edited in the admin or on the page itself. This repository holds the code plus the content model, never the content.

A page is a stack of sections. Most are a fixed drawing with the fields on top, placed by the layout file of the page. On narrow screens the fields flow as one column. Fonts and drawings come from a separate host in `STATIC_URL`. Pages are cached at the edge and purged on publish.

## What does what

| Path | Role |
| --- | --- |
| `astro.config.mjs` | EmDash, plugins and cache rules |
| `wrangler.jsonc` | Worker, bindings and domain |
| `seed/seed.json` | Content model, no content |
| `src/pages/` | Routes, with llms.txt and the key file of IndexNow |
| `src/components/` | Sections, fields, menu, footer, FAQ, reviews and forms |
| `src/layout/` | Generated: place, size and style of every field per page |
| `src/styles/` | Page scale and styles, with generated text styles in `tekst.css` |
| `src/scripts/` | Browser scripts, one per interactive part |
| `src/plugins/` | Structured data, IndexNow, checks on save, the admin dashboard and the page for search engines and AI |
| `src/teksten.ts` | The texts that stay in code |
| `src/worker.ts` | Worker entry: markdown for agents and cache headers |

## Local development

```bash
pnpm install
pnpm emdash secrets generate --write=.env
pnpm dev
```

The site runs at http://localhost:4321 and loads the model into a local database on the first request. `/_emdash/api/setup/dev-bypass?content=0` creates a local admin and `/_emdash/api/auth/dev-bypass` signs you in. Set `STATIC_URL` in `.dev.vars` to a local server for `fonts/` and `tekeningen/<slug>/`, with a CORS header for the fonts.

`pnpm typecheck` runs `astro check`. `pnpm format` runs Prettier.

## Deploying

A merge to `main` deploys through Workers Builds. By hand: `pnpm wrangler login`, then `pnpm run deploy`. The encryption key is a secret, set with `pnpm wrangler secret put EMDASH_ENCRYPTION_KEY`. `INDEXNOW_KEY`, 32 hex characters, is set the same way and turns on IndexNow on the production host.
