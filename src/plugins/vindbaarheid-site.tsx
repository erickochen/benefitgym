// The block under the table: what every page shares. The details of the gym from the list Gegevens, the choices for
// search engines and AI from the settings plus the state of IndexNow. Gegevens is read once on opening and after each
// save, so a save on top of a change in its form is refused.
import { useEffect, useState, type ReactNode } from "react";
import { Beeldkiezer, padVan } from "./beeldkiezer";
import { KnopPrimair } from "./knop-primair";
import {
	bewaar,
	bewaarInstellingen,
	bewerkPad,
	FOUT,
	haal,
	indexNowStatus,
	publiceer,
	type IndexNowStatus,
	type Instellingen,
	type Lading,
} from "./paneel-data";
import { INVOER, KNOP, LINK, TEKSTVAK } from "./paneel-klassen";
import { heeftConcept, korteLabel, maxLengte, wijzigingen, type CollectieInfo, type Item } from "./vindbaarheid-regels";
import { Schakelaar, T as STROOK, Veld } from "./vindbaarheid-strook";

const GEGEVENS = "gegevens";
const NAAM = "naam";
const UITLEG = "llms_inleiding";
const UITLEG_REGELS = 3;
const CONFLICT = "CONFLICT";
const PUBLIEK = "published";
const DATUM = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const TIJD = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const T = {
	kop: "De hele site",
	intro: "Wat elke pagina deelt: de gegevens van de gym en de keuzes voor zoekmachines en AI.",
	gegevens: "Gegevens van de gym",
	gegevensZin:
		"Staat in de footer en in wat Google over de gym leest. Schrijf het precies zo als op je Google-bedrijfsprofiel.",
	uitlegZin: "De eerste regels van llms.txt, de lijst die AI-zoekdiensten over de site lezen.",
	keuzes: "Keuzes voor zoekmachines en AI",
	standaardbeeld: "Standaardbeeld bij delen",
	standaardbeeldZin: "Voor een pagina zonder eigen beeld.",
	anderBeeld: "Ander beeld kiezen",
	training: "AI-bedrijven mogen de teksten gebruiken om hun modellen te trainen",
	trainingZin:
		"Uit: robots.txt vraagt de acht bekende trainingscrawlers de site over te slaan. Zoeken via Google, Bing en " +
		"AI-zoekdiensten blijft gewoon werken. Crawlers volgen dit vrijwillig.",
	google: "Code van Google Search Console",
	bing: "Code van Bing Webmaster Tools",
	nietAangemeld: "Nog niet aangemeld",
	codesZin: "Krijg je bij het aanmelden van de site daar. Leeg laten als dat niet speelt.",
	opslaan: "Opslaan en op de site zetten",
	gewijzigd: (datum: string) => `Laatst gewijzigd ${datum}`,
	bewaard: "Opgeslagen: de gegevens van de gym en de keuzes staan op de site.",
	// The word Gegevens in this sentence links to the form of that list.
	bewaardConcept: [
		"Opgeslagen: de keuzes staan op de site, de gegevens van de gym gaan mee zodra je ",
		"Gegevens",
		" publiceert.",
	],
	bingActief: (datum: string, pad: string) =>
		`Bing hoort het meteen als een pagina verandert. Laatste melding: ${datum} voor ${pad}.`,
	bingNogNiet: "Bing hoort het meteen als een pagina verandert. Nog geen melding gedaan.",
	bingMislukt: (status: string, datum: string) =>
		`De laatste melding aan Bing mislukte (${status}) op ${datum}. De volgende publicatie probeert het opnieuw.`,
	bingGeenSleutel: "Melden aan Bing staat nog uit: er is geen sleutel ingesteld.",
	bingAndereHost: "Melden aan Bing doet deze testomgeving niet.",
};

// The fields of Gegevens the block edits, in rows as the sketch lays them out; the labels come from the manifest.
const RIJEN = [[NAAM, "andere_naam"], ["straat"], ["postcode", "plaats"], ["telefoon", "email"]];

function bingRegel(s: IndexNowStatus): string {
	if (s.reden === "geen-sleutel") return T.bingGeenSleutel;
	if (!s.actief) return T.bingAndereHost;
	if (!s.laatste) return T.bingNogNiet;
	const datum = TIJD.format(new Date(s.laatste.tijd));
	return s.geslaagd ? T.bingActief(datum, s.laatste.pad) : T.bingMislukt(String(s.laatste.status), datum);
}

interface Keuzes {
	beeld: { mediaId: string; url?: string } | null;
	training: boolean;
	google: string;
	bing: string;
}

const keuzesVan = (i: Instellingen): Keuzes => ({
	beeld: i.seo?.defaultOgImage?.mediaId ? i.seo.defaultOgImage : null,
	training: i.seo?.disallowAiTraining !== true,
	google: i.seo?.googleVerification ?? "",
	bing: i.seo?.bingVerification ?? "",
});

// Only the keys that changed; the settings route merges them into the stored block. Null removes the image, while a
// verification code only takes a string, so an empty one clears it.
function seoWens(voor: Keuzes, na: Keuzes): Record<string, unknown> {
	const wens: Record<string, unknown> = {};
	if (voor.beeld?.mediaId !== na.beeld?.mediaId) wens.defaultOgImage = na.beeld ? { mediaId: na.beeld.mediaId } : null;
	if (voor.training !== na.training) wens.disallowAiTraining = !na.training;
	if (voor.google !== na.google) wens.googleVerification = na.google.trim();
	if (voor.bing !== na.bing) wens.bingVerification = na.bing.trim();
	return wens;
}

export function HeleSite({ lading, onBewaard }: { lading: Lading; onBewaard: (melding: ReactNode) => void }) {
	const c = lading.collecties[GEGEVENS];
	const item = lading.items[GEGEVENS]?.[0];
	if (!c || !item || !lading.instellingen) return null;
	return <Blok c={c} item={item} instellingen={lading.instellingen} onBewaard={onBewaard} />;
}

type Gegevens = { rev?: string; begin: Record<string, unknown>; concept: boolean };

function Blok({
	c,
	item,
	instellingen,
	onBewaard,
}: {
	c: CollectieInfo;
	item: Item;
	instellingen: Instellingen;
	onBewaard: (melding: ReactNode) => void;
}) {
	const slugs = [...RIJEN.flat(), UITLEG].filter((s) => s in c.fields);
	const [gegevens, setGegevens] = useState<Gegevens | null>(null);
	const [data, setData] = useState<Record<string, unknown>>({});
	const [beginKeuzes, setBeginKeuzes] = useState(() => keuzesVan(instellingen));
	const [keuzes, setKeuzes] = useState(beginKeuzes);
	const [status, setStatus] = useState<IndexNowStatus | null>(null);
	const [kiezer, setKiezer] = useState(false);
	const [fout, setFout] = useState<string | null>(null);
	const [bezig, setBezig] = useState(false);

	// On opening the fields take the stored values. After a write only the revision and the starting values follow,
	// so what was typed meanwhile stays and still counts as a change.
	async function laadGegevens(metVelden: boolean) {
		const vers = await haal(GEGEVENS, item.id);
		if (!vers.ok) {
			if (metVelden) setFout(FOUT);
			return;
		}
		const v = vers.data.item;
		const begin = Object.fromEntries(slugs.map((s) => [s, v.data[s] ?? null]));
		setGegevens({ rev: vers.data._rev, begin, concept: heeftConcept(v) || v.status !== PUBLIEK });
		if (metVelden) setData(begin);
	}

	useEffect(() => {
		void laadGegevens(true);
		void indexNowStatus().then((r) => r.ok && setStatus(r.data));
	}, [item.id]);

	async function opslaan() {
		if (!gegevens) return;
		const gewijzigd = wijzigingen(gegevens.begin, data);
		const wens = seoWens(beginKeuzes, keuzes);
		setBezig(true);
		setFout(null);
		const concept = gegevens.concept;
		if (Object.keys(gewijzigd).length) {
			const r = await bewaar(GEGEVENS, item.id, { _rev: gegevens.rev, data: gewijzigd });
			if (!r.ok) {
				setBezig(false);
				return setFout(r.code === CONFLICT ? STROOK.conflict : STROOK.mislukt(r.melding));
			}
			const p = concept ? null : await publiceer(GEGEVENS, item.id, r.data._rev);
			// From here on the stored Gegevens changed, so a retry starts from them with their new revision.
			await laadGegevens(false);
			if (p && !p.ok) {
				setBezig(false);
				return setFout(STROOK.mislukt(p.melding));
			}
		}
		if (Object.keys(wens).length) {
			const s = await bewaarInstellingen({ seo: wens });
			if (!s.ok) {
				setBezig(false);
				return setFout(STROOK.mislukt(s.melding));
			}
			setBeginKeuzes(keuzes);
		}
		setBezig(false);
		const [voor, woord, na] = T.bewaardConcept;
		onBewaard(
			concept ? (
				<>
					{voor}
					<a href={bewerkPad(GEGEVENS, item.id)} className={LINK}>
						{woord}
					</a>
					{na}
				</>
			) : (
				T.bewaard
			),
		);
	}

	const label = (slug: string) => korteLabel(c.fields[slug]?.label ?? slug);
	const invoer = (slug: string) => (
		<Veld key={slug} id={`vind-site-${slug}`} label={label(slug)}>
			<input
				id={`vind-site-${slug}`}
				className={`${INVOER} w-full`}
				maxLength={maxLengte(c.fields[slug])}
				value={typeof data[slug] === "string" ? (data[slug] as string) : ""}
				onChange={(e) => setData({ ...data, [slug]: e.target.value })}
			/>
		</Veld>
	);

	return (
		<section className="vind-site" aria-labelledby="vind-site-kop">
			<h2 id="vind-site-kop" className="text-base font-semibold">
				{T.kop}
			</h2>
			<p className="text-sm text-kumo-subtle">{T.intro}</p>
			<div className="vind-site-grid">
				<div className="vind-velden">
					<p className="font-medium">{T.gegevens}</p>
					{RIJEN.map((rij) => {
						const velden = rij.filter((s) => s in c.fields);
						return (
							<div key={rij.join()} className={velden.length > 1 ? "vind-twee" : ""}>
								{velden.map(invoer)}
							</div>
						);
					})}
					<p className="text-xs text-kumo-subtle">{T.gegevensZin}</p>
					{UITLEG in c.fields && (
						<Veld id="vind-site-uitleg" label={label(UITLEG)} zin={T.uitlegZin}>
							<textarea
								id="vind-site-uitleg"
								className={`${TEKSTVAK} w-full`}
								rows={UITLEG_REGELS}
								maxLength={maxLengte(c.fields[UITLEG])}
								value={typeof data[UITLEG] === "string" ? (data[UITLEG] as string) : ""}
								aria-describedby="vind-site-uitleg-zin"
								onChange={(e) => setData({ ...data, [UITLEG]: e.target.value })}
							/>
						</Veld>
					)}
				</div>
				<div className="vind-velden">
					<p className="font-medium">{T.keuzes}</p>
					<Veld id="vind-site-beeld" label={T.standaardbeeld} zin={T.standaardbeeldZin}>
						<div className="flex items-center gap-3">
							{keuzes.beeld?.url ? (
								<img className="vind-thumb" src={keuzes.beeld.url} alt="" />
							) : (
								<div className="vind-thumb" />
							)}
							<button
								id="vind-site-beeld"
								type="button"
								className={KNOP}
								aria-describedby="vind-site-beeld-zin"
								onClick={() => setKiezer(true)}
							>
								{T.anderBeeld}
							</button>
						</div>
					</Veld>
					<Schakelaar
						id="vind-site-training"
						aan={keuzes.training}
						label={T.training}
						zin={T.trainingZin}
						onChange={(aan) => setKeuzes({ ...keuzes, training: aan })}
					/>
					<div className="vind-twee">
						<Veld id="vind-site-google" label={T.google}>
							<input
								id="vind-site-google"
								className={`${INVOER} w-full`}
								placeholder={T.nietAangemeld}
								value={keuzes.google}
								aria-describedby="vind-site-codes"
								onChange={(e) => setKeuzes({ ...keuzes, google: e.target.value })}
							/>
						</Veld>
						<Veld id="vind-site-bing" label={T.bing}>
							<input
								id="vind-site-bing"
								className={`${INVOER} w-full`}
								placeholder={T.nietAangemeld}
								value={keuzes.bing}
								aria-describedby="vind-site-codes"
								onChange={(e) => setKeuzes({ ...keuzes, bing: e.target.value })}
							/>
						</Veld>
					</div>
					<p id="vind-site-codes" className="text-xs text-kumo-subtle">
						{T.codesZin}
					</p>
					{status && (
						<p className="rounded-md border border-kumo-line bg-kumo-base px-4 py-3 text-sm text-kumo-subtle">
							{bingRegel(status)}
						</p>
					)}
				</div>
			</div>
			{fout && (
				<p className="mt-4 text-sm text-kumo-danger" role="alert">
					{fout}
				</p>
			)}
			<div className="mt-6 flex flex-wrap items-center gap-3">
				<KnopPrimair disabled={bezig || !gegevens} onClick={() => void opslaan()}>
					{T.opslaan}
				</KnopPrimair>
				<span className="text-sm text-kumo-subtle">{T.gewijzigd(DATUM.format(new Date(item.updatedAt)))}</span>
			</div>
			{kiezer && (
				<Beeldkiezer
					titel={T.standaardbeeld}
					huidig={keuzes.beeld?.url ?? null}
					alt={instellingen.title ?? ""}
					onKies={(m) => {
						setKeuzes({ ...keuzes, beeld: { mediaId: m.id, url: padVan(m) } });
						setKiezer(false);
					}}
					onSluit={() => setKiezer(false)}
				/>
			)}
		</section>
	);
}
