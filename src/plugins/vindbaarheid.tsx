// The page Vindbaarheid: every page of the site with what Google, WhatsApp and AI search services get from it, its
// stand, a strip that edits it in place plus the block for the whole site. The rows follow the sidebar: one group per
// page collection, the pages by name.
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SITE_NAME } from "../teksten";
import { DASHBOARD_ID } from "./dashboard-id.mjs";
import { ADMIN, FOUT, useLading, type Lading } from "./paneel-data";
import { BADGE, GRIJS, GROEN, KNOP, LINK, MELDING, ORANJE, PAGINA_KOP, SOORT } from "./paneel-klassen";
import {
	adresVan,
	COMPLEET,
	lengte,
	naamVan,
	stand,
	terugvalTitel,
	type CollectieInfo,
	type Item,
	type MenuItem,
	type Stand,
} from "./vindbaarheid-regels";
import { HeleSite } from "./vindbaarheid-site";
import { Strook } from "./vindbaarheid-strook";

// The sidebar folder that holds the page collections.
const GROEP = "Pagina's";
export const PAGINA_PAD = `${ADMIN}/plugins/${DASHBOARD_ID}/vindbaarheid`;
export const rijAnker = (collectie: string, id: string) => `${collectie}-${id}`;
// Below this width of the page a row becomes a card and the strip one column; wider, the column for Google keeps at
// least 16rem next to the fixed columns.
const SMAL_REM = 56;
// The image picker is this wide at most; a narrower screen shows two images per row.
const VENSTER_REM = 36;

export const T = {
	kop: "Vindbaarheid",
	intro:
		"Zo tonen Google, WhatsApp en AI-zoekdiensten je pagina's. Wat je hier wijzigt, hoef je niet meer op de pagina " +
		"zelf te doen.",
	bekijk: "Bekijk de site",
	filter: "Alleen wat ontbreekt",
	koppen: ["Pagina", "Zo staat het in Google", "Bij delen", "Stand", ""],
	geenTekst: "Google kiest zelf een stuk tekst van de pagina.",
	bewerk: "Bewerk",
	sluit: "Sluit",
	laden: "Pagina's laden…",
	deelbeeld: (naam: string) => `Deelbeeld van ${naam}`,
	samenvatting: (n: number, m: number) => `${n} van ${m} pagina's compleet`,
	teller: (titel: number, tekst: number) => `Titel ${titel} tekens · ${tekst ? `Tekst ${tekst} tekens` : "Geen tekst"}`,
};
const KOLOMMEN = T.koppen.length;

// The layout of the page; colors and lines come from the variables of the admin, so the dark theme follows. The
// classes of the admin do the rest.
export const STIJL = `
.vind-pagina { container-type: inline-size; }
.vind-rij { display: grid; grid-template-columns: 11rem minmax(0, 1fr) 6.5rem 11rem 5.5rem; gap: 1rem;
  align-items: start; padding: .75rem; border-bottom: 1px solid var(--color-kumo-line); }
.vind-rij:hover { background: color-mix(in srgb, var(--color-kumo-tint) 25%, transparent); }
.vind-rij.vind-open, .vind-strook { background: color-mix(in srgb, var(--color-kumo-tint) 50%, transparent); }
.vind-kop { font-weight: 500; font-size: .875rem; }
.vind-kop:hover { background: none; }
.vind-titel { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vind-tekst { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.vind-thumb { width: 6rem; height: 3.15rem; object-fit: cover; border-radius: .25rem;
  border: 1px solid var(--color-kumo-line); background: var(--color-kumo-tint); }
.vind-stand { display: flex; flex-wrap: wrap; gap: .25rem; }
.vind-strook { display: grid; grid-template-columns: minmax(0, 1fr) 23rem; gap: 2rem; padding: .5rem .75rem 1.5rem;
  border-bottom: 1px solid var(--color-kumo-line); }
.vind-velden > * + * { margin-top: 1rem; }
.vind-twee { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.vind-drie { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; }
.vind-teller { display: flex; justify-content: space-between; gap: .75rem; }
.vind-voorbeeld { background: var(--color-kumo-base); border: 1px solid var(--color-kumo-line); border-radius: .375rem;
  padding: 1rem; }
.vind-voorbeeld + .vind-voorbeeld { margin-top: 1rem; }
.vind-wa-beeld { width: 100%; aspect-ratio: 1200 / 630; object-fit: cover; display: block;
  background: var(--color-kumo-tint); }
.vind-site { margin-top: 3rem; }
.vind-site-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-top: 1rem; }
.vind-venster { width: min(${VENSTER_REM}rem, calc(100% - 2rem)); max-width: none; max-height: calc(100vh - 2rem);
  margin: auto; padding: 0; border: 0; overflow: auto; }
.vind-venster::backdrop { background: color-mix(in srgb, var(--color-kumo-recessed) 80%, transparent); }
.vind-venster-inhoud { padding: 1.5rem; }
.vind-raster { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin-top: 1rem; }
.vind-keuze { text-align: left; border-radius: .375rem; padding: .25rem; }
.vind-keuze img { width: 100%; aspect-ratio: 1200 / 630; object-fit: cover; border-radius: .25rem; display: block;
  border: 1px solid var(--color-kumo-line); }
.vind-keuze.vind-gekozen img { outline: 2px solid var(--color-kumo-brand); outline-offset: 2px; }
@media (max-width: ${VENSTER_REM}rem) { .vind-raster { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (max-width: ${SMAL_REM}rem) {
  .vind-rij, .vind-strook, .vind-site-grid, .vind-twee, .vind-drie { grid-template-columns: minmax(0, 1fr); }
  .vind-kop { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%);
    white-space: nowrap; padding: 0; border: 0; }
}
`;

interface Rij {
	collectie: string;
	c: CollectieInfo;
	item: Item;
	naam: string;
	pad: string | null;
	stand: Stand;
}

function rijenVan(lading: Lading, menu: MenuItem[]): { collectie: string; c: CollectieInfo; rijen: Rij[] }[] {
	return Object.entries(lading.collecties)
		.filter(([, c]) => c.group?.trim() === GROEP)
		.map(([collectie, c]) => ({
			collectie,
			c,
			rijen: (lading.items[collectie] ?? [])
				.map((item) => ({
					collectie,
					c,
					item,
					naam: naamVan(item, c),
					pad: adresVan(c, item),
					stand: stand(item, c, collectie, menu),
				}))
				.sort((a, b) => a.naam.localeCompare(b.naam, "nl")),
		}));
}

function Badges({ stand }: { stand: Stand }) {
	return (
		<span className="vind-stand">
			{stand.compleet && <span className={`${BADGE} ${GROEN}`}>{COMPLEET}</span>}
			{stand.ontbreekt.map((w) => (
				<span key={w} className={`${BADGE} ${ORANJE}`}>
					{w}
				</span>
			))}
			{stand.info.map((w) => (
				<span key={w} className={`${BADGE} ${GRIJS}`}>
					{w}
				</span>
			))}
		</span>
	);
}

export function Vindbaarheid() {
	const { lading, fout, herlaad } = useLading();
	const [open, setOpen] = useState<string | null>(() => window.location.hash.slice(1) || null);
	const [alleenGemis, setAlleenGemis] = useState(false);
	const [melding, setMelding] = useState<ReactNode>(null);
	const openNu = useRef(open);
	openNu.current = open;
	// The row whose Bewerk button gets the focus back once the reload after a save has landed.
	const focusNa = useRef<string | null>(null);
	const filterKnop = useRef<HTMLButtonElement>(null);
	// The page judges a page by the menu and shows the settings, so it needs both. A reload that lacks one of them keeps
	// the last whole load on screen with the error above it.
	const vorige = useRef<Lading | null>(null);
	const vers = lading?.menu && lading.instellingen ? lading : null;
	if (vers) vorige.current = vers;
	const compleet = vers ?? vorige.current;
	const foutRegel = fout ?? (lading && !vers ? FOUT : null);
	const groepen = useMemo(() => (compleet ? rijenVan(compleet, compleet.menu ?? []) : []), [compleet]);
	const geladen = compleet !== null;

	// A link from the dashboard opens its row and scrolls to it once the rows are there. When only the anchor changes,
	// the browser scrolls by itself and the row opens.
	useEffect(() => {
		if (geladen && open) document.getElementById(open)?.scrollIntoView({ block: "start" });
	}, [geladen]);
	useEffect(() => {
		const naarAnker = () => setOpen(window.location.hash.slice(1) || null);
		window.addEventListener("hashchange", naarAnker);
		return () => window.removeEventListener("hashchange", naarAnker);
	}, []);
	// A row the filter hides after a save hands the focus to the filter instead.
	useEffect(() => {
		const anker = focusNa.current;
		if (!anker) return;
		focusNa.current = null;
		(document.getElementById(anker)?.querySelector("button") ?? filterKnop.current)?.focus();
	}, [lading]);

	if (!compleet) return <p className={MELDING}>{foutRegel ?? T.laden}</p>;
	const alle = groepen.flatMap((g) => g.rijen);
	const aantalCompleet = alle.filter((r) => r.stand.compleet).length;
	const siteTitel = compleet.instellingen?.title ?? SITE_NAME;

	// A strip closes its own row only. The focus goes back to the Bewerk button of that row, or to the filter when the
	// filter hides the closed row.
	const sluit = (anker: string) => {
		if (openNu.current !== anker) return false;
		setOpen(null);
		window.requestAnimationFrame(() =>
			(document.getElementById(anker)?.querySelector("button") ?? filterKnop.current)?.focus(),
		);
		return true;
	};
	// After a save the strip closes, the row shows its new stand and one line says what happened. The line empties
	// first, so the same message twice in a row is heard twice.
	const bewaard = (anker: string, tekst: string) => {
		if (sluit(anker)) focusNa.current = anker;
		setMelding(null);
		window.requestAnimationFrame(() => setMelding(tekst));
		herlaad();
	};

	return (
		<div className="vind-pagina space-y-4">
			<style>{STIJL}</style>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className={PAGINA_KOP}>{T.kop}</h1>
					<p className="text-sm text-kumo-subtle">{T.intro}</p>
				</div>
				<a href="/" target="_blank" rel="noopener" className={`${LINK} text-sm whitespace-nowrap`}>
					{T.bekijk}
				</a>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<span className="font-medium">{T.samenvatting(aantalCompleet, alle.length)}</span>
				<button
					ref={filterKnop}
					type="button"
					className={`${BADGE} ${alleenGemis ? ORANJE : GRIJS} cursor-pointer`}
					aria-pressed={alleenGemis}
					onClick={() => setAlleenGemis((v) => !v)}
				>
					{T.filter}
				</button>
			</div>
			{/* The status line stands from the start, so a screen reader hears the message when it lands. */}
			<p className="text-sm text-kumo-subtle" role="status">
				{melding}
			</p>
			{foutRegel && (
				<p className="text-sm text-kumo-danger" role="alert">
					{foutRegel}
				</p>
			)}
			<div className="rounded-md border bg-kumo-base" role="table" aria-label={T.kop}>
				<div role="rowgroup">
					<div className="vind-rij vind-kop" role="row">
						{T.koppen.map((kop, i) => (
							<div key={i} role="columnheader">
								{kop || <span className="sr-only">{T.bewerk}</span>}
							</div>
						))}
					</div>
				</div>
				{groepen.map(({ collectie, c, rijen }) => {
					// The open row stays under the filter, so a reload during a save cannot take its strip away.
					const zichtbaar = alleenGemis
						? rijen.filter((r) => !r.stand.compleet || rijAnker(collectie, r.item.id) === open)
						: rijen;
					if (!zichtbaar.length) return null;
					return (
						<div key={collectie} role="rowgroup">
							<div role="row">
								<div role="rowheader" aria-colspan={KOLOMMEN} className={SOORT}>
									{c.label}
								</div>
							</div>
							{zichtbaar.map((rij) => {
								const anker = rijAnker(collectie, rij.item.id);
								const isOpen = open === anker;
								const seo = rij.item.seo;
								const titel = seo?.title || terugvalTitel(rij.item, siteTitel);
								return (
									<Fragment key={anker}>
										<div id={anker} className={`vind-rij${isOpen ? " vind-open" : ""}`} role="row">
											<div role="cell" className="flex flex-col">
												<span id={`${anker}-naam`} className="font-semibold">
													{rij.naam}
												</span>
												<span className="text-xs text-kumo-subtle">{rij.pad ?? ""}</span>
											</div>
											<div role="cell">
												<div className={`vind-titel${seo?.title ? "" : " text-kumo-subtle"}`}>{titel}</div>
												<div className="vind-tekst text-sm text-kumo-subtle">{seo?.description || T.geenTekst}</div>
												<div className="mt-1 text-xs text-kumo-subtle">
													{T.teller(lengte(seo?.title), lengte(seo?.description))}
												</div>
											</div>
											<div role="cell">
												{seo?.image ? (
													<img className="vind-thumb" src={seo.image} alt={T.deelbeeld(rij.naam)} />
												) : (
													<div className="vind-thumb" aria-hidden="true" />
												)}
											</div>
											<div role="cell">
												<Badges stand={rij.stand} />
											</div>
											<div role="cell">
												<button
													type="button"
													className={KNOP}
													aria-expanded={isOpen}
													aria-controls={`${anker}-strook`}
													aria-describedby={`${anker}-naam`}
													onClick={() => (isOpen ? sluit(anker) : setOpen(anker))}
												>
													{isOpen ? T.sluit : T.bewerk}
												</button>
											</div>
										</div>
										{isOpen && (
											<div role="row">
												<div role="cell" aria-colspan={KOLOMMEN}>
													<Strook
														id={`${anker}-strook`}
														collectie={collectie}
														c={c}
														item={rij.item}
														pad={rij.pad}
														lading={compleet}
														onSluit={() => sluit(anker)}
														onBewaard={(tekst) => bewaard(anker, tekst)}
														onGeschreven={herlaad}
													/>
												</div>
											</div>
										)}
									</Fragment>
								);
							})}
						</div>
					);
				})}
			</div>
			<HeleSite lading={compleet} onBewaard={herlaad} />
		</div>
	);
}
