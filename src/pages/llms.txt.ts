// llms.txt from the panel: the site title, the introduction in Gegevens, then each page of menu primary that carries
// a line for llms.txt, in menu order. The lessons go first, the other pages under Praktisch.
import type { APIRoute } from "astro";
import {
	getEmDashCollection,
	getEmDashEntry,
	getMenuWithCacheHint,
	getSiteSettingsWithCacheHint,
	type MenuItem,
} from "emdash";
import { PAGINA_COLLECTIES } from "../collecties.mjs";
import { GEGEVENS_SLUG, type GegevensData } from "../gegevens";
import type { PaginaCollectie } from "../paginas";
import { siteUrl } from "../site-url";
import { SITE_NAME } from "../teksten";

export const prerender = false;

// The two lists of the file and the collection the first takes its pages from.
const LESSEN = "Lessen";
const PRAKTISCH = "Praktisch";
const LES_COLLECTIE = "sportpaginas";

interface Pagina {
	collectie: PaginaCollectie;
	data: { slug?: string | null; title?: string; llms_regel?: string };
}

// Every item of the menu that links a page of the site on its own path, in menu order.
const paden = (items: MenuItem[]): string[] =>
	items.flatMap((item) => [...(/^\/[^/#?]+$/.test(item.url) ? [item.url] : []), ...paden(item.children)]);

export const GET: APIRoute = async ({ cache }) => {
	const site = siteUrl();
	const [[instellingen, menu, gegevens], collecties] = await Promise.all([
		Promise.all([
			getSiteSettingsWithCacheHint(),
			getMenuWithCacheHint("primary"),
			getEmDashEntry("gegevens", GEGEVENS_SLUG),
		]),
		Promise.all(PAGINA_COLLECTIES.map((collectie) => getEmDashCollection(collectie))),
	]);
	const settings = instellingen.data;
	const hints = [instellingen.cacheHint, menu.cacheHint, gegevens.cacheHint, ...collecties.map((c) => c.cacheHint)];
	if (cache?.enabled) for (const hint of hints) cache.set(hint);
	// Every page by its slug; the first collection in order wins, as the route does.
	const paginas = new Map<string, Pagina>();
	PAGINA_COLLECTIES.forEach((collectie, i) => {
		for (const entry of collecties[i].entries) {
			const data = entry.data as Pagina["data"];
			if (data.slug && !paginas.has(data.slug)) paginas.set(data.slug, { collectie, data });
		}
	});
	const lijsten = { [LESSEN]: [] as string[], [PRAKTISCH]: [] as string[] };
	for (const pad of new Set(paden(menu.data?.items ?? []))) {
		const pagina = paginas.get(pad.slice(1));
		if (!pagina?.data.llms_regel || !pagina.data.title) continue;
		lijsten[pagina.collectie === LES_COLLECTIE ? LESSEN : PRAKTISCH].push(
			`- [${pagina.data.title}](${site}${pad}): ${pagina.data.llms_regel}`,
		);
	}
	const inleiding = ((gegevens.entry?.data as GegevensData | undefined)?.llms_inleiding ?? "")
		.split("\n")
		.filter((r) => r.trim());
	const delen = [
		`# ${settings.title ?? SITE_NAME}`,
		...(inleiding.length ? [inleiding.map((r) => `> ${r}`).join("\n")] : []),
		...Object.entries(lijsten)
			.filter(([, regels]) => regels.length)
			.map(([kop, regels]) => `## ${kop}\n\n${regels.join("\n")}`),
	];
	// Markdown in a text file, so a browser shows it as it is.
	return new Response(`${delen.join("\n\n")}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
