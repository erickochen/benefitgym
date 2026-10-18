// The dashboard cards of the site: the tasks the owner does most with the rules a label cannot carry, what is saved
// but not yet on the site plus every page in one table. The cards borrow the classes of the admin's own lists, which
// its stylesheet carries. A row opens the page in its usual editor.
import { type ComponentType } from "react";
import { ADMIN, bewerkPad, useLading } from "./paneel-data";
import {
	BADGE,
	BLAUW,
	CEL,
	DATUM,
	GRIJS,
	GROEN,
	KNOP,
	KOP,
	LINK,
	MELDING,
	ORANJE,
	REGEL,
	SOORT,
} from "./paneel-klassen";
import { Uitleg, type Veld } from "./uitleg";
import { Vindbaarheid } from "./vindbaarheid";
import { adresVan, heeftConcept, naamVan, type CollectieInfo, type Item } from "./vindbaarheid-regels";

// The sidebar folder that holds the page collections.
const GROEP = "Pagina's";
// The site with the editing bar: the toolbar renders this address fresh for a signed in editor.
const SITE_BEWERKEN = "/?_edit";
// The card is half the dashboard wide, so a long list stops here and names the rest.
const MAX_RIJEN = 20;
// A review is titled by its quote; the row shows this much of it.
const MAX_TITEL = 60;
const AFKAP = "…";
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

// The rules of the panel that a label cannot carry, under the buttons, in the order the owner meets them.
const REGELS = [
	"Opslaan bewaart een concept. Pas na Publiceren staat het op de site.",
	"Tekst op een pagina pas je het makkelijkst aan op de site zelf: Site bekijken, dan Edit.",
	"Plaats in de lijst: een laag getal staat bovenaan, tel in tientallen.",
	"Een vraag krijgt zijn categorie rechts in het formulier, na de eerste keer opslaan.",
	"Een lesdag die voorbij is verdwijnt vanzelf van de site. Een vakantie haal je zelf weg.",
];

// The tasks the owner does most, in that order. A task on a collection the manifest lacks shows no button.
const TAKEN: { label: string; href?: string; collectie?: string; nieuw?: boolean }[] = [
	{ label: "Tekst op de site wijzigen", href: SITE_BEWERKEN },
	{ label: "Review toevoegen", collectie: "reviews", nieuw: true },
	{ label: "Vraag toevoegen", collectie: "vragen", nieuw: true },
	{ label: "Groep vol of weer plek", collectie: "groepen" },
	{ label: "Cursusdatum toevoegen", collectie: "cursusdata" },
	{ label: "Vakanties bijwerken", collectie: "vakanties" },
];

// A change from this year shows its time, an older one its year.
function wanneer(iso: string): string {
	const datum = new Date(iso);
	return (datum.getFullYear() === new Date().getFullYear() ? DIT_JAAR : EERDER).format(datum);
}

// An empty title falls back to the slug, as the admin's own list does; a title field that holds no text does too.
const titel = naamVan;
const kort = (tekst: string) => (tekst.length > MAX_TITEL ? `${tekst.slice(0, MAX_TITEL).trimEnd()}${AFKAP}` : tekst);
const bewerk = (collectie: string, item: Item) => bewerkPad(collectie, item.id);

// The public address of a live page; a page that is not published has none.
const opSite = (c: CollectieInfo, item: Item) => (item.status === "published" ? adresVan(c, item) : null);

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
// The field widgets of the plugin; a schema field names one as "<plugin id>:<name>".
export const fields: Record<string, ComponentType<Veld>> = { uitleg: Uitleg };
// The admin pages of the plugin, keyed by the path dashboard.ts declares.
export const pages: Record<string, ComponentType> = { "/vindbaarheid": Vindbaarheid };
