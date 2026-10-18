// The strip under an open row: the fields a search engine or an AI service reads, three previews that follow the
// typing and one button that saves and publishes. The page is locked while the strip is open, as the form of the
// admin does. It is read once on opening, so a save on top of someone else's change is refused.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SITE_NAME } from "../teksten";
import { Beeldkiezer, padVan } from "./beeldkiezer";
import { KnopPrimair } from "./knop-primair";
import {
	bewaar,
	bewerkPad,
	FOUT,
	haal,
	HARTSLAG_MS,
	ontgrendel,
	publiceer,
	vergrendel,
	type Lading,
} from "./paneel-data";
import {
	CARET,
	INVOER,
	KEUZE,
	KNOP,
	LINK,
	PIJLTJE,
	SCHAKELAAR,
	SCHAKELAAR_AAN,
	SCHAKELAAR_KNOP,
	SCHAKELAAR_KNOP_AAN,
	SCHAKELAAR_KNOP_UIT,
	SCHAKELAAR_UIT,
	TEKSTVAK,
} from "./paneel-klassen";
import {
	aiVelden,
	heeftConcept,
	korteLabel,
	leeg,
	lengte,
	maxLengte,
	naamVan,
	SEO_LEEG,
	TEKST_RICHTLIJN,
	terugvalTitel,
	TITEL_RICHTLIJN,
	wijzigingen,
	type CollectieInfo,
	type Item,
	type Seo,
	type VeldInfo,
} from "./vindbaarheid-regels";

// The duration field only matters for a course.
const CURSUS = "Cursus";
const DUUR = "zoek_duur";
const SOORT = "zoek_soort";
const SAMENVATTING = "zoek_samenvatting";
const LLMS = "llms_regel";
// A new image takes the alt text of the hero photo of its page, or the page name where the hero has none.
const HERO_ALT = "hero_alt";
const TEKSTVAK_REGELS = 3;
// The sketch puts at most this many short fields next to each other; a text area and the AI line get a row each.
const MAX_NAAST = 3;
const VOL = new Set([LLMS]);
const CONFLICT = "CONFLICT";
const VERGRENDELD = "ENTRY_LOCKED";
const PUBLIEK = "published";

export const T = {
	titel: "Titel in Google",
	titelZin: `Langer dan ongeveer ${TITEL_RICHTLIJN} tekens kapt Google meestal af.`,
	tekst: "Tekst onder de titel",
	tekstZin:
		"Een zin die zegt wat het is, een reden om te kiezen en de proefles. Ongeveer " +
		`${TEKST_RICHTLIJN} tekens passen.`,
	beeld: "Beeld bij delen in WhatsApp en Facebook",
	beeldZin: "1200 bij 630 pixels. Zonder beeld deelt een link als kaal tekstblok.",
	beeldVoor: (naam: string) => `Beeld bij delen voor ${naam}`,
	anderBeeld: "Ander beeld kiezen",
	aiKop: "Voor AI-zoekdiensten en zoekmachines",
	aiZin: "Staat niet zichtbaar op de pagina. Google en AI-zoekdiensten lezen het mee als beschrijving van de les.",
	samenvattingZin: "Wat de les is en voor wie. Dit is de zin die een AI-zoekdienst overneemt.",
	llmsZin: "Een paar woorden achter de naam van de pagina in de lijst voor AI-zoekdiensten.",
	plaatshouder: { zoek_leeftijd_van: "Alle leeftijden", zoek_andere_naam: "Een oude of tweede naam" } as Record<
		string,
		string
	>,
	zichtbaar: "Zichtbaar in Google en Bing",
	zichtbaarZin: "Uit: de pagina blijft bereikbaar via de link, maar Google en Bing laten hem weg uit de resultaten.",
	opslaan: "Opslaan en op de site zetten",
	opslaanConcept: "Opslaan",
	annuleren: "Annuleren",
	laden: "Laden…",
	openPagina: "Open de hele pagina",
	openEnPubliceer: "Open de pagina en publiceer de wijziging",
	conceptKop: "Op deze pagina staat een wijziging klaar die nog niet op de site is",
	conceptZin:
		"De titel, de tekst onder de titel en het beeld gaan wel meteen de site op. De andere velden komen bij die " +
		"wijziging te staan en gaan mee zodra je de pagina publiceert.",
	nietLiveKop: "Deze pagina staat nog niet op de site",
	nietLiveZin: "Wat je hier opslaat, gaat mee zodra je de pagina publiceert.",
	google: "Zo ziet Google het",
	whatsapp: "Zo ziet WhatsApp het",
	ai: "Wat een AI-zoekdienst meekrijgt",
	aiRegels: {
		naam: "Naam",
		samenvatting: "Samenvatting",
		leeftijd: "Leeftijd",
		prijs: "Prijs",
		aanbieder: "Aanbieder",
		lijst: "In de AI-lijst",
	},
	jaar: "jaar",
	vanaf: "vanaf",
	tot: "tot",
	euro: "euro",
	van: (n: number, max: number) => `${n} van ${max}`,
	bezet: (naam: string | null) =>
		naam
			? `Deze pagina staat open bij ${naam}. Vraag of die het formulier sluit.`
			: "Deze pagina staat open in een ander venster.",
	conflict: "Deze pagina is intussen gewijzigd. Laad de pagina opnieuw en probeer het dan nog eens.",
	// A server message ends in a full stop of its own, which the sentence already has.
	mislukt: (melding: string) => `Opslaan is niet gelukt: ${melding.replace(/\.$/, "")}. Probeer het nog eens.`,
	bewaard: (naam: string) => `Opgeslagen: ${naam} staat op de site.`,
	bewaardConcept: (naam: string) =>
		`Opgeslagen: titel, tekst en beeld van ${naam} staan op de site, de rest wacht op publiceren.`,
	bewaardNietLive: (naam: string) => `Opgeslagen: dit gaat mee zodra je ${naam} publiceert.`,
};

export function Teller({ n, max }: { n: number; max?: number }) {
	return <span className="whitespace-nowrap">{max ? T.van(n, max) : n}</span>;
}

// A field with its label, the control and one sentence plus a counter under it.
export function Veld({
	id,
	label,
	zin,
	teller,
	children,
}: {
	id: string;
	label: string;
	zin?: string;
	teller?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="grid content-start gap-1">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			{children}
			{(zin || teller) && (
				<div className="vind-teller text-xs text-kumo-subtle">
					<span id={`${id}-zin`}>{zin}</span>
					{teller}
				</div>
			)}
		</div>
	);
}

export function Schakelaar({
	id,
	aan,
	label,
	zin,
	onChange,
}: {
	id: string;
	aan: boolean;
	label: string;
	zin: string;
	onChange: (aan: boolean) => void;
}) {
	return (
		<div className="flex items-start gap-3">
			<button
				type="button"
				id={id}
				role="switch"
				aria-checked={aan}
				aria-describedby={`${id}-zin`}
				onClick={() => onChange(!aan)}
				className={`${SCHAKELAAR} ${aan ? SCHAKELAAR_AAN : SCHAKELAAR_UIT} mt-0.5 shrink-0`}
			>
				<span className={`${SCHAKELAAR_KNOP} ${aan ? SCHAKELAAR_KNOP_AAN : SCHAKELAAR_KNOP_UIT}`} />
			</button>
			<div>
				<label htmlFor={id} className="text-sm font-medium">
					{label}
				</label>
				<p id={`${id}-zin`} className="text-xs text-kumo-subtle">
					{zin}
				</p>
			</div>
		</div>
	);
}

// A number input gives a number or null; the rest a string.
function waardeVan(veld: VeldInfo, ruw: string): unknown {
	if (veld.kind === "number") return ruw === "" ? null : Number(ruw);
	return ruw;
}

function AiVeld({
	slug,
	veld,
	waarde,
	onChange,
}: {
	slug: string;
	veld: VeldInfo;
	waarde: unknown;
	onChange: (w: unknown) => void;
}) {
	const id = `vind-${slug}`;
	const max = maxLengte(veld);
	const tekst = typeof waarde === "number" ? String(waarde) : typeof waarde === "string" ? waarde : "";
	const zin = slug === SAMENVATTING ? T.samenvattingZin : slug === LLMS ? T.llmsZin : undefined;
	const teller = max ? <Teller n={lengte(tekst)} max={max} /> : undefined;
	const beschreven = zin ? `${id}-zin` : undefined;
	if (veld.kind === "select") {
		const keuzes = veld.options ?? (veld.validation?.options ?? []).map((v) => ({ value: v, label: v }));
		return (
			<Veld id={id} label={korteLabel(veld.label)}>
				<div className="relative w-fit">
					<select id={id} className={KEUZE} value={tekst} onChange={(e) => onChange(e.target.value)}>
						{!keuzes.some((k) => k.value === tekst) && <option value="" />}
						{keuzes.map((k) => (
							<option key={k.value} value={k.value}>
								{k.label}
							</option>
						))}
					</select>
					<span aria-hidden="true" className={PIJLTJE}>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
							<path d={CARET} />
						</svg>
					</span>
				</div>
			</Veld>
		);
	}
	if (veld.kind === "richText") {
		return (
			<Veld id={id} label={korteLabel(veld.label)} zin={zin} teller={teller}>
				<textarea
					id={id}
					className={`${TEKSTVAK} w-full`}
					rows={TEKSTVAK_REGELS}
					maxLength={max}
					value={tekst}
					aria-describedby={beschreven}
					onChange={(e) => onChange(e.target.value)}
				/>
			</Veld>
		);
	}
	return (
		<Veld id={id} label={korteLabel(veld.label)} zin={zin} teller={teller}>
			<input
				id={id}
				type={veld.kind === "number" ? "number" : "text"}
				step={veld.kind === "number" ? (veld.integer ? 1 : "any") : undefined}
				className={`${INVOER} w-full`}
				maxLength={max}
				placeholder={T.plaatshouder[slug]}
				value={tekst}
				aria-describedby={beschreven}
				onChange={(e) => onChange(waardeVan(veld, e.target.value))}
			/>
		</Veld>
	);
}

const heleRij = ([slug, veld]: [string, VeldInfo]) => veld.kind === "richText" || VOL.has(slug);

// The AI fields in rows as the sketch lays them out: short fields side by side, a text area and the AI line alone.
function rijen(velden: Array<[string, VeldInfo]>): Array<Array<[string, VeldInfo]>> {
	const uit: Array<Array<[string, VeldInfo]>> = [];
	for (const veld of velden) {
		const laatste = uit[uit.length - 1];
		const erbij = laatste && laatste.length < MAX_NAAST && !laatste.some(heleRij) && !heleRij(veld);
		if (erbij) laatste.push(veld);
		else uit.push([veld]);
	}
	return uit;
}

type Staat =
	| { soort: "wacht" }
	| { soort: "dicht"; zin: string }
	| {
			soort: "open";
			rev?: string;
			begin: Record<string, unknown>;
			beginSeo: Seo;
			concept: boolean;
			nietLive: boolean;
	  };

export function Strook({
	id,
	collectie,
	c,
	item,
	pad,
	lading,
	onSluit,
	onBewaard,
}: {
	id: string;
	collectie: string;
	c: CollectieInfo;
	item: Item;
	pad: string | null;
	lading: Lading;
	onSluit: () => void;
	onBewaard: (melding: string) => void;
}) {
	const naam = naamVan(item, c);
	const velden = useMemo(() => aiVelden(c), [c]);
	// A new load brings new objects for the same fields; only other fields open the strip again.
	const veldSleutel = velden.map(([slug]) => slug).join();
	const [staat, setStaat] = useState<Staat>({ soort: "wacht" });
	const [seo, setSeo] = useState<Seo>(SEO_LEEG);
	const [data, setData] = useState<Record<string, unknown>>({});
	const [fout, setFout] = useState<string | null>(null);
	const [bezig, setBezig] = useState(false);
	const [kiezer, setKiezer] = useState(false);
	const token = useRef(crypto.randomUUID());
	const instellingen = lading.instellingen ?? {};
	const siteTitel = instellingen.title ?? SITE_NAME;
	const gegevens = lading.items.gegevens?.[0]?.data ?? {};

	// The lock of the admin, renewed as the form renews it and released when the strip or the tab closes. The page
	// is read once the lock is held, so the save carries the revision of that moment.
	useEffect(() => {
		let actief = true;
		let hartslag: number | undefined;
		const t = token.current;
		const weg = () => void ontgrendel(collectie, item.id, t, true);
		(async () => {
			const slot = await vergrendel(collectie, item.id, t);
			// A lock that lands after the strip closed is given back at once.
			if (!actief) {
				if (slot.ok) weg();
				return;
			}
			if (!slot.ok) {
				setStaat({ soort: "dicht", zin: slot.code === VERGRENDELD ? T.bezet(naamUit(slot.details)) : FOUT });
				return;
			}
			if (slot.data.enabled && !slot.data.heldByCaller) {
				setStaat({ soort: "dicht", zin: T.bezet(slot.data.holder?.userName ?? null) });
				return;
			}
			hartslag = window.setInterval(() => void vergrendel(collectie, item.id, t), HARTSLAG_MS);
			const vers = await haal(collectie, item.id);
			if (!actief) return;
			if (!vers.ok) {
				setStaat({ soort: "dicht", zin: FOUT });
				return;
			}
			const v = vers.data.item;
			const begin = Object.fromEntries(velden.map(([slug]) => [slug, v.data[slug] ?? null]));
			const beginSeo = { ...SEO_LEEG, ...(v.seo ?? {}) };
			setSeo(beginSeo);
			setData(begin);
			// A page that is not live or carries a newer draft is not published from here.
			const nietLive = v.status !== PUBLIEK;
			setStaat({ soort: "open", rev: vers.data._rev, begin, beginSeo, concept: nietLive || heeftConcept(v), nietLive });
		})();
		window.addEventListener("pagehide", weg);
		return () => {
			actief = false;
			window.clearInterval(hartslag);
			window.removeEventListener("pagehide", weg);
			weg();
		};
	}, [collectie, item.id, veldSleutel]);

	if (staat.soort === "wacht") {
		return (
			<div id={id} className="vind-strook text-sm text-kumo-subtle">
				{T.laden}
			</div>
		);
	}
	if (staat.soort === "dicht") {
		return (
			<div id={id} className="vind-strook text-sm" role="alert">
				{staat.zin}
			</div>
		);
	}
	const open = staat;

	async function opslaan() {
		const gewijzigd = wijzigingen(open.begin, data);
		const seoAnders = Object.keys(wijzigingen({ ...open.beginSeo }, { ...seo })).length > 0;
		const melding = open.nietLive ? T.bewaardNietLive(naam) : open.concept ? T.bewaardConcept(naam) : T.bewaard(naam);
		if (!seoAnders && !Object.keys(gewijzigd).length) return onBewaard(melding);
		setBezig(true);
		setFout(null);
		const r = await bewaar(collectie, item.id, {
			_rev: open.rev,
			seo,
			...(Object.keys(gewijzigd).length ? { data: gewijzigd } : {}),
		});
		if (!r.ok) {
			setBezig(false);
			if (r.code === CONFLICT) return setFout(T.conflict);
			if (r.code === VERGRENDELD) return setFout(T.bezet(naamUit(r.details)));
			return setFout(T.mislukt(r.melding));
		}
		if (!open.concept) {
			const p = await publiceer(collectie, item.id, r.data._rev);
			if (!p.ok) {
				setBezig(false);
				return setFout(T.mislukt(p.melding));
			}
		}
		setBezig(false);
		onBewaard(melding);
	}

	const titel = seo.title || terugvalTitel(item, siteTitel);
	const tekst = seo.description || instellingen.tagline || "";
	const deelbeeld = seo.image || instellingen.seo?.defaultOgImage?.url || null;
	const host = window.location.host;
	const zichtbareVelden = velden.filter(([slug]) => slug !== DUUR || data[SOORT] === CURSUS);
	const prijs = leeg(data.zoek_prijs)
		? ""
		: [`${data.zoek_prijs} ${T.euro}`, data.zoek_prijs_uitleg].filter((w) => !leeg(w)).join(", ");

	return (
		<div id={id} className="vind-strook">
			<div className="vind-velden">
				<Veld id="vind-titel" label={T.titel} zin={T.titelZin} teller={<Teller n={lengte(seo.title)} />}>
					<input
						id="vind-titel"
						className={`${INVOER} w-full`}
						value={seo.title ?? ""}
						placeholder={terugvalTitel(item, siteTitel)}
						aria-describedby="vind-titel-zin"
						onChange={(e) => setSeo({ ...seo, title: e.target.value || null })}
					/>
				</Veld>
				<Veld id="vind-tekst" label={T.tekst} zin={T.tekstZin} teller={<Teller n={lengte(seo.description)} />}>
					<textarea
						id="vind-tekst"
						className={`${TEKSTVAK} w-full`}
						rows={TEKSTVAK_REGELS}
						value={seo.description ?? ""}
						aria-describedby="vind-tekst-zin"
						onChange={(e) => setSeo({ ...seo, description: e.target.value || null })}
					/>
				</Veld>
				<Veld id="vind-beeld" label={T.beeld} zin={T.beeldZin}>
					<div className="flex items-center gap-3">
						{seo.image ? <img className="vind-thumb" src={seo.image} alt="" /> : <div className="vind-thumb" />}
						<button
							id="vind-beeld"
							type="button"
							className={KNOP}
							aria-describedby="vind-beeld-zin"
							onClick={() => setKiezer(true)}
						>
							{T.anderBeeld}
						</button>
					</div>
				</Veld>
				{velden.length > 0 && (
					<div className="pt-2">
						<p className="font-medium">{T.aiKop}</p>
						<p className="text-sm text-kumo-subtle">{T.aiZin}</p>
					</div>
				)}
				{rijen(zichtbareVelden).map((rij) => (
					<div
						key={rij.map(([slug]) => slug).join()}
						className={rij.length === MAX_NAAST ? "vind-drie" : rij.length > 1 ? "vind-twee" : ""}
					>
						{rij.map(([slug, veld]) => (
							<AiVeld
								key={slug}
								slug={slug}
								veld={veld}
								waarde={data[slug]}
								onChange={(w) => setData({ ...data, [slug]: w })}
							/>
						))}
					</div>
				))}
				<hr className="border-kumo-line" />
				<Schakelaar
					id="vind-zichtbaar"
					aan={!seo.noIndex}
					label={T.zichtbaar}
					zin={T.zichtbaarZin}
					onChange={(aan) => setSeo({ ...seo, noIndex: !aan })}
				/>
				{open.concept && (
					<div className="rounded-md border border-kumo-line bg-kumo-base px-4 py-3">
						<p className="text-sm font-medium">{open.nietLive ? T.nietLiveKop : T.conceptKop}</p>
						<p className="text-sm text-kumo-subtle">{open.nietLive ? T.nietLiveZin : T.conceptZin}</p>
					</div>
				)}
				{fout && (
					<p className="text-sm text-kumo-danger" role="alert">
						{fout}
					</p>
				)}
				<div className="flex flex-wrap items-center gap-3 pt-2">
					<KnopPrimair disabled={bezig} onClick={() => void opslaan()}>
						{open.concept ? T.opslaanConcept : T.opslaan}
					</KnopPrimair>
					<button type="button" className={KNOP} disabled={bezig} onClick={onSluit}>
						{T.annuleren}
					</button>
					<a href={bewerkPad(collectie, item.id)} className={`${LINK} text-sm`}>
						{open.concept && !open.nietLive ? T.openEnPubliceer : T.openPagina}
					</a>
				</div>
			</div>
			<aside>
				<div className="vind-voorbeeld">
					<p className="mb-3 text-xs font-medium uppercase tracking-wide text-kumo-subtle">{T.google}</p>
					<div className="flex items-center gap-2 text-xs">
						{instellingen.favicon?.url && <img src={instellingen.favicon.url} alt="" width="16" height="16" />}
						<span>{siteTitel}</span>
						<span className="text-kumo-subtle">
							{host}
							{pad && pad !== "/" ? ` › ${pad.slice(1)}` : ""}
						</span>
					</div>
					<p className="mt-1 text-base text-kumo-link">{titel}</p>
					<p className="mt-1 text-sm text-kumo-subtle">{tekst}</p>
				</div>
				<div className="vind-voorbeeld">
					<p className="mb-3 text-xs font-medium uppercase tracking-wide text-kumo-subtle">{T.whatsapp}</p>
					<div className="overflow-hidden rounded-md border border-kumo-line">
						{deelbeeld ? <img className="vind-wa-beeld" src={deelbeeld} alt="" /> : <div className="vind-wa-beeld" />}
						<div className="bg-kumo-tint/50 px-3 py-2">
							<p className="text-sm font-semibold">{titel}</p>
							<p className="vind-tekst text-xs text-kumo-subtle">{tekst}</p>
							<p className="text-xs text-kumo-subtle">{host}</p>
						</div>
					</div>
				</div>
				{velden.length > 0 && (
					<div className="vind-voorbeeld">
						<p className="mb-3 text-xs font-medium uppercase tracking-wide text-kumo-subtle">{T.ai}</p>
						<ul className="space-y-1 text-sm">
							<AiRegel kop={T.aiRegels.naam}>{[naam, data.zoek_soort_les].filter((w) => !leeg(w)).join(", ")}</AiRegel>
							<AiRegel kop={T.aiRegels.samenvatting}>{data[SAMENVATTING]}</AiRegel>
							<AiRegel kop={T.aiRegels.leeftijd}>{leeftijd(data.zoek_leeftijd_van, data.zoek_leeftijd_tot)}</AiRegel>
							<AiRegel kop={T.aiRegels.prijs}>{prijs}</AiRegel>
							<AiRegel kop={T.aiRegels.aanbieder}>
								{[gegevens.naam, gegevens.straat, gegevens.plaats].filter((w) => !leeg(w)).join(", ")}
							</AiRegel>
							<AiRegel kop={T.aiRegels.lijst}>{leeg(data[LLMS]) ? "" : `${naam}: ${data[LLMS]}`}</AiRegel>
						</ul>
					</div>
				)}
			</aside>
			{kiezer && (
				<Beeldkiezer
					titel={T.beeldVoor(naam)}
					huidig={seo.image}
					alt={typeof item.data[HERO_ALT] === "string" && item.data[HERO_ALT] ? item.data[HERO_ALT] : naam}
					onKies={(m) => {
						setSeo({ ...seo, image: padVan(m) });
						setKiezer(false);
					}}
					onSluit={() => setKiezer(false)}
				/>
			)}
		</div>
	);
}

function AiRegel({ kop, children }: { kop: string; children: unknown }) {
	if (leeg(children)) return null;
	return (
		<li>
			<span className="text-kumo-subtle">{kop}</span> {String(children)}
		</li>
	);
}

function leeftijd(van: unknown, tot: unknown): string {
	if (leeg(van) && leeg(tot)) return "";
	if (leeg(tot)) return `${T.vanaf} ${van} ${T.jaar}`;
	if (leeg(van)) return `${T.tot} ${tot} ${T.jaar}`;
	return `${van} ${T.tot} ${tot} ${T.jaar}`;
}

// The name of the holder out of a refused write, as the admin reads it.
function naamUit(details?: Record<string, unknown>): string | null {
	return typeof details?.userName === "string" ? details.userName : null;
}
