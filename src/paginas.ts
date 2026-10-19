// The page behind a slug plus its SEO, shared by the routes and llms.txt.
import { getEmDashEntry, getSeoMeta, type SiteSettings } from "emdash";
import { PAGINA_COLLECTIES } from "./collecties.mjs";
import { SITE_NAME } from "./teksten";

export type PaginaCollectie = (typeof PAGINA_COLLECTIES)[number];

// The page on a slug, from the first collection in order that holds it. The loader also matches a database id, which
// is no address.
export async function vindPagina(slug: string) {
	const gevonden = await Promise.all(
		PAGINA_COLLECTIES.map(async (collectie) => {
			const { entry, cacheHint } = await getEmDashEntry(collectie, slug);
			return entry && entry.data.id !== slug ? { collectie, entry, cacheHint } : null;
		}),
	);
	return gevonden.find((pagina) => pagina !== null) ?? null;
}

// An SEO title carries the gym name already; without one the gym name goes behind the title, with the separator of
// the settings.
export function seoVoor(
	entry: Parameters<typeof getSeoMeta>[0],
	settings: Partial<SiteSettings>,
	pad: string,
	origin: string,
) {
	const eigen = (entry.data as { seo?: { title?: string | null } }).seo?.title;
	return getSeoMeta(entry, {
		siteTitle: eigen ? undefined : (settings.title ?? SITE_NAME),
		siteUrl: origin,
		path: pad,
		titleSeparator: settings.seo?.titleSeparator,
	});
}
