import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, kvCache, r2, sandbox } from "@emdash-cms/cloudflare";
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { PAGINA_COLLECTIES } from "./src/collecties.mjs";
import { DASHBOARD_ADMIN, DASHBOARD_ID, DASHBOARD_VERSIE } from "./src/plugins/dashboard-id.mjs";
import { PANEEL_ID, PANEEL_VERSIE } from "./src/plugins/paneel-id.mjs";
import { ZOEKMACHINES_ID, ZOEKMACHINES_VERSIE } from "./src/plugins/zoekmachines-id.mjs";

const pad = (bestand) => fileURLToPath(new URL(bestand, import.meta.url));

// The structured data of the site, as a native plugin in this repo.
const zoekmachines = {
	id: ZOEKMACHINES_ID,
	version: ZOEKMACHINES_VERSIE,
	format: "native",
	entrypoint: pad("./src/plugins/zoekmachines.ts"),
};

// The safety nets of the panel: one entry per single page collection, a name for every group.
const paneel = {
	id: PANEEL_ID,
	version: PANEEL_VERSIE,
	format: "native",
	entrypoint: pad("./src/plugins/paneel.ts"),
};

// The table of pages on the dashboard of the admin, as a native plugin with a React widget.
const dashboard = {
	id: DASHBOARD_ID,
	version: DASHBOARD_VERSIE,
	format: "native",
	entrypoint: pad("./src/plugins/dashboard.ts"),
	adminEntry: pad(DASHBOARD_ADMIN),
};

// A cached page lives five minutes, then a day as a stale copy while it renders again in the background. A publish
// purges by tag, so the short lifetime only covers what changes outside the content API.
const VIJF_MINUTEN = 300;
const DAG = 86_400;
// The tag on every cached route that EmDash never purges by itself: the switch to clear everything at once.
const ALLES = "alles";
// The lists the sections read. Every route also carries the page collections, which the menu plus the footer link.
const PAGINAS = PAGINA_COLLECTIES;
const LIJSTEN = ["reviews", "vragen", "groepen", "cursusdata", "vakanties", "gegevens"];
const regel = (...tags) => ({ maxAge: VIJF_MINUTEN, swr: DAG, tags: [...tags, ALLES] });

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	// Pages are cached at the edge in the Workers Cache. Every public route has a rule; the routes under /_emdash/ stay
	// out, as does the key file of IndexNow, so a 404 from before its key is set never lingers.
	cache: { provider: cacheCloudflare() },
	routeRules: {
		"/": regel("home", ...PAGINAS, "reviews", "gegevens"),
		"/[slug]": regel(...PAGINAS, ...LIJSTEN),
		"/llms.txt": regel(...PAGINAS, "gegevens"),
		"/robots.txt": regel("emdash:settings"),
		"/favicon.ico": regel("emdash:settings"),
		"/sitemap.xml": regel("home", ...PAGINAS),
		"/sitemap-[collection].xml": regel("home", ...PAGINAS),
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto", coalesce: true }),
			storage: r2({ binding: "MEDIA" }),
			// Query results in KV, so a render that does run reads less from D1.
			objectCache: kvCache({ binding: "CACHE" }),
			// Public HTML is the same for everyone; an editor gets an Edit button that opens the page fresh.
			toolbar: "client",
			// The language picker offers Dutch plus the English fallback instead of every language EmDash ships.
			admin: { locales: ["nl"] },
			sandboxRunner: sandbox(),
			// The dashboard widgets follow this order, so the pages come first.
			plugins: [
				dashboard,
				cloudflareEmail({
					from: { email: "website@benefitgym.nl", name: "Benefit Gym" },
				}),
				formsPlugin(),
				zoekmachines,
				paneel,
			],
		}),
	],
	devToolbar: { enabled: false },
});
