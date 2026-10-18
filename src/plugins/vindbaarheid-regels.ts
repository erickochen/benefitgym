// The rules of the findability page, without React: what a page misses, the counters, the address of a page,
// whether llms.txt lists a page plus the two IndexNow decisions. The tests in emdash/ import this file directly.

export interface Seo {
	title: string | null;
	description: string | null;
	image: string | null;
	canonical: string | null;
	noIndex: boolean;
}

export interface VeldInfo {
	kind: string;
	label: string;
	validation?: { maxLength?: number; options?: string[] };
	options?: Array<{ value: string; label: string }>;
}

export interface CollectieInfo {
	label: string;
	titleField?: string;
	group?: string;
	urlPattern?: string | null;
	routable?: boolean;
	hidden?: boolean;
	fields: Record<string, VeldInfo>;
}

export interface Item {
	id: string;
	slug: string | null;
	status: string;
	data: Record<string, unknown>;
	seo?: Seo | null;
	updatedAt: string;
	liveRevisionId: string | null;
	draftRevisionId: string | null;
	translationGroup?: string | null;
}

export interface MenuItem {
	type: string;
	referenceCollection: string | null;
	referenceId: string | null;
	customUrl: string | null;
}

export interface Stand {
	ontbreekt: string[];
	info: string[];
	compleet: boolean;
}

// Chapter 3 of VINDBAARHEID.md: Google usually cuts a longer title or text.
export const TITEL_RICHTLIJN = 60;
export const TEKST_RICHTLIJN = 160;
// A field for AI and search engines carries this prefix in its label.
export const VOORVOEGSEL = "AI en zoekmachines";
export const SCHEIDING = " · ";
// The placeholder for the slug in the URL pattern of a collection.
export const SLUG = "{slug}";
// getSeoMeta puts this between the page title and the site title when the site passes no separator.
export const TITEL_SCHEIDING = " | ";
// The paths paden() in llms.txt.ts takes from the menu: a page of the site on a path of its own.
const EIGEN_PAD = /^\/[^/#?]+$/;
export const GEMIS = {
	titel: "Titel ontbreekt",
	tekst: "Tekst onder de titel ontbreekt",
	beeld: "Deelbeeld ontbreekt",
	soort: "Les of cursus ontbreekt",
	samenvatting: "Samenvatting ontbreekt",
	aiRegel: "AI-regel ontbreekt",
} as const;
export const INFO = {
	verborgen: "Verborgen voor Google",
	concept: "Wijziging klaar",
	buitenLijst: "Niet in de AI-lijst",
} as const;
export const COMPLEET = "Compleet";
export const SEO_LEEG: Seo = {
	title: null,
	description: null,
	image: null,
	canonical: null,
	noIndex: false,
};

export const leeg = (w: unknown) => w === undefined || w === null || (typeof w === "string" && !w.trim());

// A draft newer than the live version, as the dashboard counts it; a page never published has none.
export const heeftConcept = (item: Pick<Item, "liveRevisionId" | "draftRevisionId">) =>
	Boolean(item.liveRevisionId && item.draftRevisionId && item.draftRevisionId !== item.liveRevisionId);

export const isAiVeld = (label: string) => label.startsWith(`${VOORVOEGSEL}${SCHEIDING}`);

// The label without its group, so the strip shows the words of the form.
export function korteLabel(label: string): string {
	const i = label.indexOf(SCHEIDING);
	return i < 0 ? label : label.slice(i + SCHEIDING.length);
}

// The AI fields of a collection, in the order of the form.
export const aiVelden = (c: CollectieInfo): Array<[string, VeldInfo]> =>
	Object.entries(c.fields).filter(([, v]) => isAiVeld(v.label));

// The public path of a page, from the pattern of its collection. A page without a slug has none.
export function adresVan(c: Pick<CollectieInfo, "routable" | "urlPattern">, item: Pick<Item, "slug">): string | null {
	if (!c.routable || !c.urlPattern) return null;
	if (c.urlPattern.includes(SLUG) && !item.slug) return null;
	return c.urlPattern.replace(SLUG, item.slug ?? "");
}

// As the menu resolver of EmDash reads it: every item but a custom link or a taxonomy links an entry, by its
// translation group or its id.
const linktNaar = (m: MenuItem, collectie: string, item: Pick<Item, "id" | "translationGroup">) =>
	m.type !== "custom" &&
	m.type !== "taxonomy" &&
	m.referenceCollection === collectie &&
	m.referenceId !== null &&
	(m.referenceId === item.id || m.referenceId === item.translationGroup);

// Whether llms.txt lists the page: an item of menu primary that links it or its path, on a path of its own.
export function inMenu(
	menu: MenuItem[],
	collectie: string,
	item: Pick<Item, "id" | "translationGroup">,
	pad: string | null,
): boolean {
	if (pad === null || !EIGEN_PAD.test(pad)) return false;
	return menu.some((m) => linktNaar(m, collectie, item) || (m.type === "custom" && m.customUrl === pad));
}

// A rule only counts when the collection has the field; Home has no line for llms.txt.
export function stand(item: Item, c: CollectieInfo, collectie: string, menu: MenuItem[]): Stand {
	const seo = item.seo ?? SEO_LEEG;
	const ontbreekt: string[] = [];
	const info: string[] = [];
	if (leeg(seo.title)) ontbreekt.push(GEMIS.titel);
	if (leeg(seo.description)) ontbreekt.push(GEMIS.tekst);
	if (leeg(seo.image)) ontbreekt.push(GEMIS.beeld);
	if ("zoek_soort" in c.fields && leeg(item.data.zoek_soort)) ontbreekt.push(GEMIS.soort);
	if ("zoek_samenvatting" in c.fields && leeg(item.data.zoek_samenvatting)) ontbreekt.push(GEMIS.samenvatting);
	if ("llms_regel" in c.fields) {
		const erin = inMenu(menu, collectie, item, adresVan(c, item));
		if (erin && leeg(item.data.llms_regel)) ontbreekt.push(GEMIS.aiRegel);
		if (!erin) info.push(INFO.buitenLijst);
	}
	if (seo.noIndex) info.push(INFO.verborgen);
	if (heeftConcept(item)) info.push(INFO.concept);
	return { ontbreekt, info, compleet: ontbreekt.length === 0 };
}

export const lengte = (w: unknown) => (typeof w === "string" ? w.length : 0);
export const maxLengte = (veld?: VeldInfo) => veld?.validation?.maxLength;

// The name of a page as the admin lists it: the title field, else the slug, else the id.
export function naamVan(item: Item, c: CollectieInfo): string {
	const w = item.data[c.titleField ?? "title"];
	return (typeof w === "string" && w.trim()) || item.slug || item.id;
}

// The title getSeoMeta makes when the SEO panel has none: the title field, with the site title behind it.
export function terugvalTitel(item: Pick<Item, "data">, siteTitel: string): string {
	const kop = typeof item.data.title === "string" ? item.data.title : "";
	return siteTitel && kop ? `${kop}${TITEL_SCHEIDING}${siteTitel}` : kop;
}

const gelijk = (a: unknown, b: unknown) => (leeg(a) && leeg(b)) || JSON.stringify(a) === JSON.stringify(b);

// Only the fields whose value changed, so a save never touches the rest.
export function wijzigingen(voor: Record<string, unknown>, na: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(na).filter(([k, w]) => !gelijk(voor[k], w)));
}

// IndexNow goes out from the production host alone.
export const PRODUCTIE_HOST = "benefitgym.nl";
export const INDEXNOW_EINDPUNT = "https://api.indexnow.org/indexnow";
// The FAQ of IndexNow asks for five minutes between two pings of one address.
export const INDEXNOW_WACHT_MS = 5 * 60 * 1000;
export type Poort = "open" | "andere-host" | "geen-sleutel" | "te-snel";

export function magMelden(a: { host: string; sleutel: string | undefined; laatst: number | null; nu: number }): Poort {
	if (a.host !== PRODUCTIE_HOST) return "andere-host";
	if (!a.sleutel) return "geen-sleutel";
	if (a.laatst !== null && a.nu - a.laatst < INDEXNOW_WACHT_MS) return "te-snel";
	return "open";
}

export function indexNowVerzoek(a: { site: string; sleutel: string; pad: string }) {
	const body = {
		host: new URL(a.site).host,
		key: a.sleutel,
		keyLocation: `${a.site}/${a.sleutel}.txt`,
		urlList: [`${a.site}${a.pad}`],
	};
	return {
		url: INDEXNOW_EINDPUNT,
		init: {
			method: "POST",
			headers: { "Content-Type": "application/json; charset=utf-8" },
			body: JSON.stringify(body),
		},
	};
}
