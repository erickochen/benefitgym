// The structured data through the page:metadata hook: the graph of the gym on /, a Service or a Course on a sport
// page, nothing elsewhere. After a publish on the production host the page goes to IndexNow.
import { env } from "cloudflare:workers";
import {
	definePlugin,
	getEmDashEntry,
	getSiteSettings,
	type ContentPublishStateChangeEvent,
	type PageMetadataContribution,
	type PluginContext,
	type PublicPageContext,
	type RouteContext,
} from "emdash";
import { GEGEVENS_SLUG, type GegevensData, internationaal, profielen } from "../gegevens";
import { siteUrl } from "../site-url";
import { adresVan, indexNowVerzoek, leeg, magMelden } from "./vindbaarheid-regels";
import { ZOEKMACHINES_ID, ZOEKMACHINES_VERSIE } from "./zoekmachines-id.mjs";

const SCHEMA = "https://schema.org";
const TAAL = "nl";
// Open Graph writes a locale as language_TERRITORY.
const OG_TAAL = "nl_NL";
const MUNT = "EUR";
// The page that lists every price; an offer points there.
const TARIEVEN = "/tarieven";
// The block EmDash itself would put out on a page; this one takes its place.
const BLOK = "primary";

interface Zoekmachines {
	title?: string;
	zoek_soort?: string;
	zoek_soort_les?: string;
	zoek_samenvatting?: string;
	zoek_leeftijd_van?: number;
	zoek_leeftijd_tot?: number;
	zoek_prijs?: number;
	zoek_prijs_uitleg?: string;
	zoek_duur?: number;
	zoek_andere_naam?: string;
}

// Validators prefer an absent key over an empty one.
function schoon<T>(w: T): T {
	if (Array.isArray(w)) return w.map(schoon) as T;
	if (w && typeof w === "object") {
		return Object.fromEntries(
			Object.entries(w)
				.filter(([, v]) => !leeg(v))
				.map(([k, v]) => [k, schoon(v)]),
		) as T;
	}
	return w;
}

async function gegevens(): Promise<GegevensData | undefined> {
	return (await getEmDashEntry("gegevens", GEGEVENS_SLUG)).entry?.data as GegevensData | undefined;
}

// An address on the host that served the page moves onto EMDASH_SITE_URL; an address elsewhere stays as it is.
function opSite(adres: string, page: PublicPageContext, site: string): string {
	const url = new URL(adres, site);
	return url.origin === new URL(page.url).origin ? new URL(`${url.pathname}${url.search}`, site).href : url.href;
}

async function graaf(site: string, page: PublicPageContext, g: GegevensData) {
	const settings = await getSiteSettings();
	const gym = `${site}/#gym`;
	// The image of the gym is the social image of /, with the fallback og:image takes.
	const beeld = page.image || settings.seo?.defaultOgImage?.url;
	return {
		"@context": SCHEMA,
		"@graph": [
			{
				"@type": "ExerciseGym",
				"@id": gym,
				name: g.naam,
				alternateName: g.andere_naam,
				url: `${site}/`,
				logo: settings.logo?.url ? new URL(settings.logo.url, site).href : undefined,
				image: beeld ? opSite(beeld, page, site) : undefined,
				telephone: g.telefoon ? internationaal(g.telefoon) : undefined,
				email: g.email,
				foundingDate: g.oprichtingsjaar,
				priceRange: g.prijsbereik,
				address: {
					"@type": "PostalAddress",
					streetAddress: g.straat,
					postalCode: g.postcode,
					addressLocality: g.plaats,
					addressRegion: g.provincie,
					addressCountry: g.land,
				},
				geo:
					leeg(g.breedtegraad) || leeg(g.lengtegraad)
						? undefined
						: { "@type": "GeoCoordinates", latitude: g.breedtegraad, longitude: g.lengtegraad },
				hasMap: g.kaartlink,
				sameAs: profielen(settings.social).map((p) => p.href),
			},
			{
				"@type": "WebSite",
				"@id": `${site}/#website`,
				name: settings.title,
				alternateName: g.andere_naam,
				url: `${site}/`,
				publisher: { "@id": gym },
			},
		],
	};
}

function les(site: string, page: PublicPageContext, d: Zoekmachines, g: GegevensData) {
	const cursus = d.zoek_soort === "Cursus";
	const leeftijd =
		leeg(d.zoek_leeftijd_van) && leeg(d.zoek_leeftijd_tot)
			? undefined
			: { "@type": "PeopleAudience", suggestedMinAge: d.zoek_leeftijd_van, suggestedMaxAge: d.zoek_leeftijd_tot };
	const aanbod = leeg(d.zoek_prijs)
		? undefined
		: {
				"@type": "Offer",
				price: String(d.zoek_prijs),
				priceCurrency: MUNT,
				description: d.zoek_prijs_uitleg,
				url: `${site}${TARIEVEN}`,
			};
	return {
		"@context": SCHEMA,
		"@type": cursus ? "Course" : "Service",
		name: d.title,
		alternateName: d.zoek_andere_naam,
		serviceType: cursus ? undefined : d.zoek_soort_les,
		url: `${site}${page.path.replace(/\/$/, "")}`,
		description: d.zoek_samenvatting,
		timeRequired: leeg(d.zoek_duur) ? undefined : `PT${d.zoek_duur}H`,
		inLanguage: cursus ? TAAL : undefined,
		audience: leeftijd,
		provider: { "@type": "ExerciseGym", "@id": `${site}/#gym`, name: g.naam },
		offers: aanbod,
	};
}

async function bijdragen(page: PublicPageContext): Promise<PageMetadataContribution[]> {
	const settings = await getSiteSettings();
	const uit: PageMetadataContribution[] = [];
	if (settings.title) uit.push({ kind: "property", property: "og:site_name", content: settings.title });
	uit.push({ kind: "property", property: "og:locale", content: OG_TAAL });
	const soort = page.content?.collection;
	if (soort !== "home" && soort !== "sportpaginas") return uit;
	const g = await gegevens();
	if (!g) return uit;
	const site = siteUrl();
	if (soort === "home") {
		uit.push({ kind: "jsonld", id: BLOK, graph: schoon(await graaf(site, page, g)) });
		return uit;
	}
	const slug = page.content?.slug;
	const entry = slug ? (await getEmDashEntry("sportpaginas", slug)).entry : undefined;
	if (entry) uit.push({ kind: "jsonld", id: BLOK, graph: schoon(les(site, page, entry.data as Zoekmachines, g)) });
	return uit;
}

// IndexNow keeps the last ping plus one timestamp per address in the kv of the plugin.
const KV_LAATSTE = "indexnow:laatste";
const KV_PAD = "indexnow:pad:";
// IndexNow answers 200 when it took the address and 202 while it still checks the key.
const GEMELD = new Set([200, 202]);

interface Melding {
	pad: string;
	tijd: string;
	status: number | "fout";
}

const sleutel = () => env.INDEXNOW_KEY;

// Three gates, each with its own reason; a closed gate sends nothing and only logs why.
async function meld(event: ContentPublishStateChangeEvent, ctx: PluginContext): Promise<void> {
	const c = await ctx.schema?.getCollection(event.collection);
	const slug = typeof event.content.slug === "string" ? event.content.slug : null;
	const pad = c ? adresVan({ routable: c.routable, urlPattern: c.urlPattern }, { slug }) : null;
	if (!pad) return;
	const site = siteUrl();
	const key = sleutel();
	const laatst = await ctx.kv.get<number>(`${KV_PAD}${pad}`);
	const poort = magMelden({ host: new URL(site).host, sleutel: key, laatst, nu: Date.now() });
	if (poort !== "open" || !key) {
		ctx.log.debug(`indexnow: ${poort} for ${pad}`);
		return;
	}
	// The host only lets a plugin out through ctx.http, which keeps it to allowedHosts.
	if (!ctx.http) {
		ctx.log.warn(`indexnow: no http access for ${pad}`);
		return;
	}
	// The timestamp goes in first, so a second publish during the request finds the gate closed.
	await ctx.kv.set(`${KV_PAD}${pad}`, Date.now());
	const { url, init } = indexNowVerzoek({ site, sleutel: key, pad });
	let status: Melding["status"];
	try {
		status = (await ctx.http.fetch(url, init)).status;
	} catch {
		status = "fout";
	}
	const melding: Melding = { pad, tijd: new Date().toISOString(), status };
	await ctx.kv.set(KV_LAATSTE, melding);
}

// What the page Vindbaarheid shows about IndexNow.
async function status(ctx: RouteContext) {
	const poort = magMelden({ host: new URL(siteUrl()).host, sleutel: sleutel(), laatst: null, nu: Date.now() });
	const laatste = await ctx.kv.get<Melding>(KV_LAATSTE);
	return {
		actief: poort === "open",
		reden: poort === "open" ? null : poort,
		laatste,
		geslaagd: laatste ? typeof laatste.status === "number" && GEMELD.has(laatste.status) : null,
	};
}

export function createPlugin() {
	return definePlugin({
		id: ZOEKMACHINES_ID,
		version: ZOEKMACHINES_VERSIE,
		// The hooks after a publish need content:read, the collection schema:read and the ping network:request;
		// EmDash registers a hook only with its capability.
		capabilities: ["content:read", "schema:read", "network:request"],
		allowedHosts: ["api.indexnow.org"],
		hooks: {
			"page:metadata": ({ page }) => bijdragen(page),
			"content:afterPublish": meld,
			"content:afterUnpublish": meld,
		},
		routes: { status: { handler: status } },
	});
}
