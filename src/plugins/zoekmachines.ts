// The structured data of the site through the page:metadata hook, the route the EmDash docs give for replacing
// JSON-LD. On / the graph of the gym plus the website, on a sport page a Service or a Course, elsewhere no block.
// Every address follows EMDASH_SITE_URL. The site name stays in og:site_name.
import { definePlugin, getEmDashEntry, getSiteSettings, type PageMetadataContribution, type PublicPageContext } from "emdash";
import { GEGEVENS_SLUG, type GegevensData, internationaal, profielen } from "../gegevens";
import { siteUrl } from "../site-url";
import { ZOEKMACHINES_ID, ZOEKMACHINES_VERSIE } from "./zoekmachines-id.mjs";

const SCHEMA = "https://schema.org";
const TAAL = "nl";
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

const leeg = (w: unknown) => w === undefined || w === null || w === "";

// Validators prefer an absent key over an empty one.
function schoon<T>(w: T): T {
	if (Array.isArray(w)) return w.map(schoon) as T;
	if (w && typeof w === "object") {
		return Object.fromEntries(Object.entries(w).filter(([, v]) => !leeg(v)).map(([k, v]) => [k, schoon(v)])) as T;
	}
	return w;
}

async function gegevens(): Promise<GegevensData | undefined> {
	return (await getEmDashEntry("gegevens", GEGEVENS_SLUG)).entry?.data as GegevensData | undefined;
}

async function graaf(site: string, g: GegevensData) {
	const settings = await getSiteSettings();
	const gym = `${site}/#gym`;
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
				telephone: g.telefoon ? internationaal(g.telefoon) : undefined,
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
				geo: leeg(g.breedtegraad) || leeg(g.lengtegraad) ? undefined : { "@type": "GeoCoordinates", latitude: g.breedtegraad, longitude: g.lengtegraad },
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
	const leeftijd = leeg(d.zoek_leeftijd_van) && leeg(d.zoek_leeftijd_tot) ? undefined
		: { "@type": "PeopleAudience", suggestedMinAge: d.zoek_leeftijd_van, suggestedMaxAge: d.zoek_leeftijd_tot };
	const aanbod = leeg(d.zoek_prijs) ? undefined
		: { "@type": "Offer", price: String(d.zoek_prijs), priceCurrency: MUNT, description: d.zoek_prijs_uitleg, url: `${site}${TARIEVEN}` };
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
	const soort = page.content?.collection;
	if (soort !== "home" && soort !== "sportpaginas") return uit;
	const g = await gegevens();
	if (!g) return uit;
	const site = siteUrl();
	if (soort === "home") {
		uit.push({ kind: "jsonld", id: BLOK, graph: schoon(await graaf(site, g)) });
		return uit;
	}
	const slug = page.content?.slug;
	const entry = slug ? (await getEmDashEntry("sportpaginas", slug)).entry : undefined;
	if (entry) uit.push({ kind: "jsonld", id: BLOK, graph: schoon(les(site, page, entry.data as Zoekmachines, g)) });
	return uit;
}

export function createPlugin() {
	return definePlugin({
		id: ZOEKMACHINES_ID,
		version: ZOEKMACHINES_VERSIE,
		hooks: { "page:metadata": ({ page }) => bijdragen(page) },
	});
}
