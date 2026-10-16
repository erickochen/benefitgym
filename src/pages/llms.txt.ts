// llms.txt from the panel: the site title, the introduction in Gegevens, then each page of menu primary that carries
// a line for llms.txt, in menu order. The lessons go first, the other pages under Praktisch.
import type { APIRoute } from "astro";
import { getEmDashEntry, getMenuWithCacheHint, getSiteSettingsWithCacheHint, type MenuItem } from "emdash";
import { GEGEVENS_SLUG, type GegevensData } from "../gegevens";
import { siteUrl } from "../site-url";
import { SITE_NAME } from "../teksten";

export const prerender = false;

// The two lists of the file and the collections they take their pages from.
const LESSEN = "Lessen";
const PRAKTISCH = "Praktisch";
const LES_COLLECTIE = "sportpaginas";
// The collections that hold a page on /<slug>, in the order [slug].astro tries them.
const COLLECTIES = ["sportpaginas", "over_ons", "praktisch"] as const;

// Every item of the menu that links a page of the site on its own path, in menu order.
const paden = (items: MenuItem[]): string[] =>
	items.flatMap((item) => [...(/^\/[^/#?]+$/.test(item.url) ? [item.url] : []), ...paden(item.children)]);

async function pagina(slug: string) {
	for (const collectie of COLLECTIES) {
		const { entry, cacheHint } = await getEmDashEntry(collectie, slug);
		if (entry && entry.data.id !== slug) return { collectie, entry, cacheHint };
	}
	return null;
}

export const GET: APIRoute = async ({ cache }) => {
	const site = siteUrl();
	const [instellingen, menu, gegevens] = await Promise.all([
		getSiteSettingsWithCacheHint(),
		getMenuWithCacheHint("primary"),
		getEmDashEntry("gegevens", GEGEVENS_SLUG),
	]);
	const settings = instellingen.data;
	const hints = [instellingen.cacheHint, menu.cacheHint, gegevens.cacheHint];
	const lijsten = { [LESSEN]: [] as string[], [PRAKTISCH]: [] as string[] };
	for (const pad of [...new Set(paden(menu.data?.items ?? []))]) {
		const gevonden = await pagina(pad.slice(1));
		if (!gevonden) continue;
		hints.push(gevonden.cacheHint);
		const data = gevonden.entry.data as { title?: string; llms_regel?: string };
		if (!data.llms_regel || !data.title) continue;
		lijsten[gevonden.collectie === LES_COLLECTIE ? LESSEN : PRAKTISCH].push(
			`- [${data.title}](${site}${pad}): ${data.llms_regel}`,
		);
	}
	if (cache?.enabled) for (const hint of hints) cache.set(hint);
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
