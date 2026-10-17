// Every page of the site in one table on the dashboard, under a heading per kind as the sidebar names them. The table
// borrows the classes of the admin's own content list, which its stylesheet carries. A row opens the page in its usual
// editor.
import { apiFetch, parseApiResponse } from "emdash/plugin-utils";
import { type ComponentType, useEffect, useState } from "react";

const ADMIN = "/_emdash/admin";
const API = "/_emdash/api";
// The sidebar folder that holds the page collections.
const GROEP = "Pagina's";
// The largest page the list route hands out.
const PER_KEER = 100;
const FOUT = "De pagina's konden niet geladen worden.";
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
const OPEN_CONCEPT = "Er staat een wijziging klaar die nog niet gepubliceerd is";
const DIT_JAAR = new Intl.DateTimeFormat("nl-NL", {
	day: "numeric",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});
const EERDER = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const KOPPEN = ["Pagina", "Status", "Gewijzigd"];
// The card is half the dashboard wide, so the cells are tighter than in the admin's own lists and stay on one line.
const CEL = "px-3 py-2";
const DATUM = "px-3 py-2 whitespace-nowrap text-sm text-kumo-subtle";
const KOP = "px-3 py-2 text-start text-sm font-medium";
const SOORT = "px-3 pt-4 pb-1 text-start text-xs font-medium uppercase tracking-wide text-kumo-subtle";
const MELDING = "px-3 text-sm leading-6 text-kumo-subtle";

interface Collectie {
	label: string;
	titleField?: string;
	group?: string;
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

interface Soort {
	collectie: string;
	label: string;
	paginas: { titel: string; item: Item }[];
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

// The collections of the folder in sidebar order, each with its pages by title.
async function soorten(): Promise<Soort[]> {
	const manifest = await lees<{ collections: Record<string, Collectie> }>("/manifest");
	const paginas = Object.entries(manifest.collections).filter(([, c]) => c.group?.trim() === GROEP);
	return Promise.all(
		paginas.map(async ([collectie, c]) => ({
			collectie,
			label: c.label,
			paginas: (await itemsVan(collectie))
				// An empty title falls back to the slug, as the admin's own list does.
				.map((item) => ({ titel: String(item.data[c.titleField ?? "title"] || item.slug || item.id), item }))
				.sort((a, b) => a.titel.localeCompare(b.titel, "nl")),
		})),
	);
}

// The status as the admin's list shows it: a live page with a newer draft carries a second badge.
function Status({ item }: { item: Item }) {
	const status = STATUS[item.status] ?? { label: item.status, kleur: GRIJS };
	const open = Boolean(item.liveRevisionId && item.draftRevisionId && item.draftRevisionId !== item.liveRevisionId);
	return (
		<span className="inline-flex items-center gap-1.5">
			<span className={`${BADGE} ${status.kleur}`}>{status.label}</span>
			{open && (
				<span className={`${BADGE} ${ORANJE} cursor-help`} title={OPEN_CONCEPT}>
					{STATUS.draft.label}
				</span>
			)}
		</span>
	);
}

function Paginas() {
	const [lijst, setLijst] = useState<Soort[] | null>(null);
	const [fout, setFout] = useState<string | null>(null);

	useEffect(() => {
		let actief = true;
		soorten().then(
			(s) => actief && setLijst(s),
			(e: unknown) => actief && setFout(e instanceof Error ? e.message : FOUT),
		);
		return () => {
			actief = false;
		};
	}, []);

	if (fout) return <p className={MELDING}>{fout}</p>;
	if (!lijst) return <p className={MELDING}>Pagina's laden…</p>;
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
				{lijst.map(({ collectie, label, paginas }) => (
					<tbody key={collectie} className="divide-y divide-kumo-line">
						<tr>
							<th colSpan={KOPPEN.length} scope="rowgroup" className={SOORT}>
								{label}
							</th>
						</tr>
						{paginas.map(({ titel, item }) => (
							<tr key={item.id} className="hover:bg-kumo-tint/25">
								<td className={CEL}>
									<a href={`${ADMIN}/content/${collectie}/${item.id}`} className="font-medium hover:text-kumo-link">
										{titel}
									</a>
								</td>
								<td className={CEL}>
									<Status item={item} />
								</td>
								<td className={DATUM}>
									<bdi>{wanneer(item.updatedAt)}</bdi>
								</td>
							</tr>
						))}
					</tbody>
				))}
			</table>
		</div>
	);
}

export const widgets: Record<string, ComponentType> = { paginas: Paginas };
