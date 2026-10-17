// The dashboard cards of the site: the tasks the owner does most with the rules a label cannot carry, what is saved
// but not yet on the site plus every page in one table. The cards borrow the classes of the admin's own lists, which
// its stylesheet carries. A row opens the page in its usual editor.
import { apiFetch, parseApiResponse } from "emdash/plugin-utils";
import { type ComponentType, useEffect, useState } from "react";

const ADMIN = "/_emdash/admin";
const API = "/_emdash/api";
// The sidebar folder that holds the page collections.
const GROEP = "Pagina's";
// The largest page the list route hands out.
const PER_KEER = 100;
// The site with the editing bar: the toolbar renders this address fresh for a signed in editor.
const SITE_BEWERKEN = "/?_edit";
// The placeholder for the slug in a collection's URL pattern.
const SLUG = "{slug}";
// Cards that mount together share one load; a later visit to the dashboard loads again.
const DEEL_MS = 5000;
// The card is half the dashboard wide, so a long list stops here and names the rest.
const MAX_RIJEN = 20;
// A review is titled by its quote; the row shows this much of it.
const MAX_TITEL = 60;
const AFKAP = "…";
const FOUT = "De gegevens konden niet geladen worden.";
const BADGE =
	"inline-flex w-fit flex-none shrink-0 items-center justify-self-start rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";
// The colors of the admin's own status badges.
const GROEN = "bg-kumo-success-tint/70 text-kumo-success";
const ORANJE = "bg-kumo-warning-tint/70 text-kumo-warning";
const BLAUW = "bg-kumo-info-tint/70 text-kumo-info";
const GRIJS = "bg-kumo-fill text-kumo-badge-neutral-subtle";
const STATUS: Record<string, { label: string; kleur: string }> = {
	published: { label: "Live", kleur: GROEN },
	draft: { label: "Concept", kleur: ORANJE },
	scheduled: { label: "Ingepland", kleur: BLAUW },
};
// A live entry whose newer draft is saved but not published.
const WIJZIGING = { label: "Wijziging klaar", kleur: ORANJE };
const OPEN_CONCEPT = "Er staat een wijziging klaar die nog niet gepubliceerd is";
const DIT_JAAR = new Intl.DateTimeFormat("nl-NL", {
	day: "numeric",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});
const EERDER = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const KOPPEN = ["Pagina", "Status", "Gewijzigd", "Site"];
// The cells are tighter than in the admin's own lists and stay on one line.
const CEL = "px-3 py-2";
const DATUM = "px-3 py-2 whitespace-nowrap text-sm text-kumo-subtle";
const KOP = "px-3 py-2 text-start text-sm font-medium";
const SOORT = "px-3 pt-4 pb-1 text-start text-xs font-medium uppercase tracking-wide text-kumo-subtle";
const MELDING = "px-3 text-sm leading-6 text-kumo-subtle";
const KNOP =
	"inline-flex items-center justify-center rounded-md border bg-kumo-base px-3 py-2 text-sm font-medium transition-colors hover:bg-kumo-tint/50";
const LINK = "font-medium hover:text-kumo-link";

// The rules of the panel that a label cannot carry, under the buttons, in the order the owner meets them.
const REGELS = [
	"Opslaan bewaart een concept. Pas na Publiceren staat het op de site.",
	"Tekst op een pagina pas je het makkelijkst aan op de site zelf: Site bekijken, dan Edit.",
	"Plaats in de lijst: een laag getal staat bovenaan, tel in tientallen.",
	"Een vraag krijgt zijn categorie rechts in het formulier, na de eerste keer opslaan.",
	"Een lesdag die voorbij is verdwijnt vanzelf van de site. Een vakantie haal je zelf weg.",
];
const REGEL = "px-3 text-sm leading-5";

// The tasks the owner does most, in that order. A task on a collection the manifest lacks shows no button.
const TAKEN: { label: string; href?: string; collectie?: string; nieuw?: boolean }[] = [
	{ label: "Tekst op de site wijzigen", href: SITE_BEWERKEN },
	{ label: "Review toevoegen", collectie: "reviews", nieuw: true },
	{ label: "Vraag toevoegen", collectie: "vragen", nieuw: true },
	{ label: "Groep vol of weer plek", collectie: "groepen" },
	{ label: "Cursusdatum toevoegen", collectie: "cursusdata" },
	{ label: "Vakanties bijwerken", collectie: "vakanties" },
];

interface Collectie {
	label: string;
	titleField?: string;
	group?: string;
	urlPattern?: string;
	routable?: boolean;
	hidden?: boolean;
}

interface Item {
	id: string;
	slug: string | null;
	status: string;
	data: Record<string, unknown>;
	updatedAt: string;
	liveRevisionId: string | null;
	draftRevisionId: string | null;
}

interface Lading {
	collecties: Record<string, Collectie>;
	items: Record<string, Item[]>;
}

// A change from this year shows its time, an older one its year.
function wanneer(iso: string): string {
	const datum = new Date(iso);
	return (datum.getFullYear() === new Date().getFullYear() ? DIT_JAAR : EERDER).format(datum);
}

async function lees<T>(pad: string): Promise<T> {
	return parseApiResponse<T>(await apiFetch(`${API}${pad}`), FOUT);
}

async function itemsVan(collectie: string): Promise<Item[]> {
	const uit: Item[] = [];
	let cursor: string | undefined;
	do {
		const vervolg = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
		const deel = await lees<{ items: Item[]; nextCursor?: string | null }>(
			`/content/${collectie}?status=all&limit=${PER_KEER}${vervolg}`,
		);
		uit.push(...deel.items);
		cursor = deel.nextCursor ?? undefined;
	} while (cursor);
	return uit;
}

// Every collection the sidebar shows, with all its entries.
async function laadAlles(): Promise<Lading> {
	const manifest = await lees<{ collections: Record<string, Collectie> }>("/manifest");
	const zichtbaar = Object.entries(manifest.collections).filter(([, c]) => !c.hidden);
	const items = Object.fromEntries(
		await Promise.all(zichtbaar.map(async ([slug]) => [slug, await itemsVan(slug)] as const)),
	);
	return { collecties: Object.fromEntries(zichtbaar), items };
}

let gedeeld: { belofte: Promise<Lading>; sinds: number } | null = null;

function lading(): Promise<Lading> {
	const nu = Date.now();
	if (gedeeld && nu - gedeeld.sinds <= DEEL_MS) return gedeeld.belofte;
	const belofte = laadAlles();
	gedeeld = { belofte, sinds: nu };
	// A failed load is not kept, so the next card loads again instead of repeating the error.
	belofte.catch(() => {
		if (gedeeld?.belofte === belofte) gedeeld = null;
	});
	return belofte;
}

function useLading(): { lading: Lading | null; fout: string | null } {
	const [staat, setStaat] = useState<{ lading: Lading | null; fout: string | null }>({ lading: null, fout: null });
	useEffect(() => {
		let actief = true;
		lading().then(
			(l) => actief && setStaat({ lading: l, fout: null }),
			(e: unknown) => actief && setStaat({ lading: null, fout: e instanceof Error ? e.message : FOUT }),
		);
		return () => {
			actief = false;
		};
	}, []);
	return staat;
}

// An empty title falls back to the slug, as the admin's own list does; a title field that holds no text does too.
function titel(item: Item, c: Collectie): string {
	const w = item.data[c.titleField ?? "title"];
	return (typeof w === "string" && w.trim()) || item.slug || item.id;
}
const kort = (tekst: string) => (tekst.length > MAX_TITEL ? `${tekst.slice(0, MAX_TITEL).trimEnd()}${AFKAP}` : tekst);
const bewerk = (collectie: string, item: Item) => `${ADMIN}/content/${collectie}/${item.id}`;
const heeftConcept = (item: Item) =>
	Boolean(item.liveRevisionId && item.draftRevisionId && item.draftRevisionId !== item.liveRevisionId);

// The public address of a live page, from the pattern of its collection. A page without a slug has no address.
function opSite(c: Collectie, item: Item): string | null {
	if (!c.routable || !c.urlPattern || item.status !== "published") return null;
	if (c.urlPattern.includes(SLUG) && !item.slug) return null;
	return c.urlPattern.replace(SLUG, item.slug ?? "");
}

// The status as the admin's list shows it: a live page with a newer draft carries a second badge.
function Status({ item }: { item: Item }) {
	const status = STATUS[item.status] ?? { label: item.status, kleur: GRIJS };
	return (
		<span className="inline-flex items-center gap-1.5">
			<span className={`${BADGE} ${status.kleur}`}>{status.label}</span>
			{heeftConcept(item) && (
				<span className={`${BADGE} ${ORANJE} cursor-help`} title={OPEN_CONCEPT}>
					{STATUS.draft.label}
				</span>
			)}
		</span>
	);
}

// Six buttons. A list with one entry opens that entry; a list with more opens the list.
function SnelDoen() {
	const { lading, fout } = useLading();
	if (fout) return <p className={MELDING}>{fout}</p>;
	if (!lading) return <p className={MELDING}>Laden…</p>;
	const knoppen = TAKEN.flatMap((taak) => {
		if (taak.href) return [{ label: taak.label, href: taak.href, nieuwTab: true }];
		const c = taak.collectie ?? "";
		if (!lading.collecties[c]) return [];
		const items = lading.items[c] ?? [];
		const href = taak.nieuw
			? `${ADMIN}/content/${c}/new`
			: items.length === 1
				? bewerk(c, items[0])
				: `${ADMIN}/content/${c}`;
		return [{ label: taak.label, href, nieuwTab: false }];
	});
	return (
		<div className="space-y-2">
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{knoppen.map((k) => (
					<a
						key={k.label}
						href={k.href}
						className={KNOP}
						target={k.nieuwTab ? "_blank" : undefined}
						rel={k.nieuwTab ? "noopener" : undefined}
					>
						{k.label}
					</a>
				))}
			</div>
			<p className={SOORT}>Zo werkt het</p>
			{REGELS.map((regel) => (
				<p key={regel} className={REGEL}>
					{regel}
				</p>
			))}
		</div>
	);
}

// What the owner saved but visitors do not see yet: a draft, a scheduled entry or a live entry with a newer draft.
function nogNiet(item: Item): { label: string; kleur: string } | null {
	if (item.status === "scheduled" || item.status === "draft") return STATUS[item.status];
	return heeftConcept(item) ? WIJZIGING : null;
}

function NogNietOpDeSite() {
	const { lading, fout } = useLading();
	if (fout) return <p className={MELDING}>{fout}</p>;
	if (!lading) return <p className={MELDING}>Laden…</p>;
	const rijen = Object.entries(lading.items)
		.flatMap(([collectie, items]) =>
			items.flatMap((item) => {
				const stand = nogNiet(item);
				return stand ? [{ collectie, item, stand }] : [];
			}),
		)
		.sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt));
	if (!rijen.length) return <p className={MELDING}>Alles wat je bewaarde staat op de site.</p>;
	const rest = rijen.length - MAX_RIJEN;
	return (
		<div className="rounded-md border bg-kumo-base overflow-x-auto">
			<table className="w-full">
				<tbody className="divide-y divide-kumo-line">
					{rijen.slice(0, MAX_RIJEN).map(({ collectie, item, stand }) => (
						<tr key={`${collectie}/${item.id}`} className="hover:bg-kumo-tint/25">
							<td className={CEL}>
								<a href={bewerk(collectie, item)} className={LINK} title={titel(item, lading.collecties[collectie])}>
									{kort(titel(item, lading.collecties[collectie]))}
								</a>
								<span className="ms-2 text-xs text-kumo-subtle">{lading.collecties[collectie].label}</span>
							</td>
							<td className={CEL}>
								<span className={`${BADGE} ${stand.kleur}`}>{stand.label}</span>
							</td>
							<td className={DATUM}>
								<bdi>{wanneer(item.updatedAt)}</bdi>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{rest > 0 && <p className={`${MELDING} py-2`}>En nog {rest} meer.</p>}
		</div>
	);
}

// Every page under a heading per kind, as the sidebar names them, with its status, its last change plus a link to it
// on the site.
function Paginas() {
	const { lading, fout } = useLading();
	if (fout) return <p className={MELDING}>{fout}</p>;
	if (!lading) return <p className={MELDING}>Pagina's laden…</p>;
	const soorten = Object.entries(lading.collecties)
		.filter(([, c]) => c.group?.trim() === GROEP)
		.map(([collectie, c]) => ({
			collectie,
			c,
			paginas: (lading.items[collectie] ?? [])
				.map((item) => ({ titel: titel(item, c), item }))
				.sort((a, b) => a.titel.localeCompare(b.titel, "nl")),
		}));
	return (
		<div className="rounded-md border bg-kumo-base overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-b bg-kumo-tint/50">
						{KOPPEN.map((kop) => (
							<th key={kop} scope="col" className={KOP}>
								{kop}
							</th>
						))}
					</tr>
				</thead>
				{soorten.map(({ collectie, c, paginas }) => (
					<tbody key={collectie} className="divide-y divide-kumo-line">
						<tr>
							<th colSpan={KOPPEN.length} scope="rowgroup" className={SOORT}>
								{c.label}
							</th>
						</tr>
						{paginas.map(({ titel: naam, item }) => {
							const url = opSite(c, item);
							return (
								<tr key={item.id} className="hover:bg-kumo-tint/25">
									<td className={CEL}>
										<a href={bewerk(collectie, item)} className={LINK}>
											{naam}
										</a>
									</td>
									<td className={CEL}>
										<Status item={item} />
									</td>
									<td className={DATUM}>
										<bdi>{wanneer(item.updatedAt)}</bdi>
									</td>
									<td className={DATUM}>
										{url && (
											<a href={url} target="_blank" rel="noopener" className="hover:text-kumo-link">
												Bekijk
											</a>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				))}
			</table>
		</div>
	);
}

export const widgets: Record<string, ComponentType> = { snel: SnelDoen, concepten: NogNietOpDeSite, paginas: Paginas };
