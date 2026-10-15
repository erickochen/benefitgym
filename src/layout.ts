import type { EditProxy } from "emdash";

// The shape of src/layout/<slug>.json: measured places at the design width, field names, no text.
export interface Plek {
	x: number;
	y: number;
	w: number;
}

export interface Vak extends Plek {
	h: number;
}

// An image as AVIF plus PNG, or plus WebP when the measured page serves that, with the smaller sizes of its srcset.
export interface Beeld {
	bestand: string;
	breedte: number;
	kleiner?: number[];
	sizes?: string;
	terugval?: "webp";
}

// A block with a z-index lies above the next sections, as its measured item does.
export type Blok = (
	| ({ soort: "logo"; beeld: Beeld } & Vak)
	| ({ soort: "tekst"; veld: string; link?: string; tag: string; stijl: string } & Plek)
	| ({ soort: "alineas"; veld: string; stijl: string } & Plek)
	| ({ soort: "cijfer"; n: number; stijl: string } & Plek)
	| ({
			soort: "knop";
			veld: string;
			link: string;
			stijl: string;
			radius: number;
			achtergrond: string;
			beeld: Beeld | null;
			tekst: Plek;
	  } & Vak)
	| ({
			soort: "reviews";
			// The option in Pagina's that puts a review on this page.
			pagina: string;
			quote: { w: number; stijl: string; regels: { naam: number; zonder: number } };
			naam: { stijl: string | null };
			pijl: { w: number; h: number; vorige: Beeld; volgende: Beeld };
			// The row of dots that replaces the arrows on the phone, in pixels: its distance to the foot of the carousel,
			// the room around it plus half the gap between two dots, the dot, its color and the opacity of a dot not in view.
			bolletjes?: { onder: number; rand: number; half: number; stip: number; kleur: string; uit: number };
	  } & Vak)
	| ({
			soort: "uitklap";
			veld: string;
			// The Portable Text field the button opens.
			tekst: string;
			stijl: string;
			pijl: { w: number; gat: number };
			// Where the text hangs as a card; without one it lies in flow at the cut of its section.
			kaart: (Plek & { z?: number }) | null;
	  } & Vak)
	| ({
			soort: "faq";
			// The option in Pagina that puts a question on this page.
			pagina: string;
			// The room above the first row inside its holder.
			boven: number;
			rij: { h: number; lijn: number; kleur: string };
			label: Plek & { stijl: string };
			icoon: { x: number; y: number; w: number; vlak: string; pijl: string };
			// The rows of a narrow list in the column, in pixels: the height, the round button with its top, the room
			// kept for it plus the size of the label, with its line height as a factor of that size.
			smal?: { rij: number; knop: number; icoon: number; ruimte: number; korps: number; regel: number };
			// The wide list in the column: design units on the scale of its own width over the design width.
			ontwerp?: {
				breedte: number;
				x: number;
				w: number;
				boven: number;
				rij: number;
				lijn: number;
				korps: number;
				label: Plek;
				icoon: Plek;
			};
	  } & Plek)
) & { z?: number } & MetKolom;

// The column below 1242: the measured page's Tablet from 810, its Phone below. basis.css carries the same query.
export const KOLOM_MEDIA = "(max-width: 1241.98px)";
export const DESKTOP_MEDIA = `not all and ${KOLOM_MEDIA}`;
// One transparent pixel, for an image whose file only comes from a source for its own side of 1242.
export const LEEG_BEELD = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
export type Stand = "tablet" | "phone";
export type PerStand<T> = Record<Stand, T>;
const VOOR: Record<Stand, string> = { tablet: "t", phone: "p" };

// A width in the column: the rest of the row, the text's own width, fixed pixels or the row up to a maximum.
export type Breedte = "vul" | "inhoud" | number | { max: number };

export interface RijMaat {
	rand: number[];
	kleur?: string;
	gat?: number;
	uitlijning: string;
	kruis?: string;
	// An absolute row lies this far below the top of its band, over the image in it.
	boven?: number;
	z?: number;
}

export interface BandMaat {
	rand: number[];
	kleur?: string;
	z?: number;
	breedte: "vul" | "inhoud";
	// A band as wide as its content keeps the alignment of its section.
	zelf?: string;
	verhouding?: string;
	rij?: RijMaat;
}

export interface BlokMaat {
	breedte: Breedte;
	hoogte?: number;
	verhouding?: string;
	inspring?: number;
	beeld?: Beeld;
	// The fill of a button.
	vulling?: string;
	// The room below the block before what follows it in its band.
	onder?: number;
}

// The measures of a block in the column; null when the column hides it.
type MetKolom = { kolom?: PerStand<BlokMaat> | null };

// A band holds its blocks; above 1242 it takes no box, so each block lies on the drawing. A cut-out of another page,
// as a Praktisch hero shows from its source, names that page. A tile holds bands of its own. A portrait names the
// field of its person, which stands in when its alt text is empty.
export interface Band {
	blokken: Blok[];
	uitsnede?: { bestand: string; pagina?: string; alt?: string; altNaam?: string };
	kolom?: PerStand<BandMaat> | null;
	banden?: Band[];
}

// A section of tiles in the column: its number of equal columns, the gap between the tiles plus its own padding.
export interface RasterMaat {
	kolommen: number;
	gat: number;
	rand: number[];
}

export function rasterVars(raster: PerStand<RasterMaat>): string {
	return perStand(raster, (m) => ({
		"s-kolommen": m.kolommen.toString(),
		"s-gat": pixels(m.gat),
		"s-rand": m.rand.map(pixels).join(" "),
	}));
}

const pixels = (n: number) => `${n}px`;

export function perStand<T>(kolom: PerStand<T>, waarden: (maat: T) => Record<string, string | undefined>): string {
	return (Object.keys(VOOR) as Stand[])
		.flatMap((stand) =>
			Object.entries(waarden(kolom[stand]))
				.filter((paar): paar is [string, string] => paar[1] !== undefined)
				.map(([naam, waarde]) => `--${VOOR[stand]}-${naam}:${waarde}`),
		)
		.join(";");
}

export function bandVars(kolom: PerStand<BandMaat>): string {
	return perStand(kolom, (m) => ({
		"b-rand": m.rand.map(pixels).join(" "),
		"b-kleur": m.kleur,
		"b-z": m.z?.toString(),
		"b-breedte": m.breedte === "inhoud" ? "max-content" : undefined,
		"b-zelf": m.zelf,
		"u-ratio": m.verhouding,
	}));
}

export function rijVars(kolom: PerStand<BandMaat>): string {
	return perStand(kolom, ({ rij }) => ({
		"r-rand": rij?.rand.map(pixels).join(" "),
		"r-kleur": rij?.kleur,
		"r-gat": rij?.gat === undefined ? undefined : pixels(rij.gat),
		"r-uit": rij?.uitlijning,
		"r-kruis": rij?.kruis,
		"r-pos": rij?.boven === undefined ? undefined : "absolute",
		"r-boven": rij?.boven === undefined ? undefined : pixels(rij.boven),
		"r-z": rij?.z?.toString(),
	}));
}

// The measures of a block in the column as custom properties; nothing above 1242.
export function kolomVars(blok: MetKolom): string | undefined {
	if (!blok.kolom) return undefined;
	return perStand(blok.kolom, (m) => ({
		"k-breedte": typeof m.breedte === "number" ? pixels(m.breedte) : m.breedte === "inhoud" ? "max-content" : "auto",
		"k-flex": m.breedte === "vul" || typeof m.breedte === "object" ? "1 1 0" : "none",
		"k-max": typeof m.breedte === "object" ? pixels(m.breedte.max) : undefined,
		"k-hoogte": m.hoogte === undefined ? undefined : pixels(m.hoogte),
		"k-ratio": m.verhouding,
		"k-inspring": m.inspring === undefined ? undefined : pixels(m.inspring),
		"k-vulling": m.vulling,
		"k-onder": m.onder === undefined ? undefined : pixels(m.onder),
	}));
}

// The place of a block above 1242 plus its measures in the column.
export function blokStijl(blok: Plek & { h?: number; z?: number } & MetKolom): string {
	const kolom = kolomVars(blok);
	return kolom ? `${plekVan(blok)};${kolom}` : plekVan(blok);
}

// A block the column hides.
export const blokKlasse = (blok: MetKolom) => (blok.kolom === null ? "zonder-kolom" : undefined);

// A built section: the band over the foot of the drawing above, the column beside the form, then room for the
// footer plus the strip. Its spacer is the measured height; one that follows its content grows and shrinks with it.
export interface Gebouwd {
	// The slug of the plugin form.
	formulier: string;
	// The sport whose groups the tiles show.
	sport?: string;
	// The titles of the widgets in Onder formulier.
	privacy: string;
	bellen: string;
	dek: { h: number; kleur: string };
	inhoud: { boven: number; onder: number; links: number; gat: number; kolom: number };
	afstand: { h: number; volgt: boolean };
	strook: { h: number; beeld: Beeld };
	tekst: {
		kop: { veld: string; stijl: string };
		intro: { veld: string; stijl: string };
		bellen: { h: number; stijl: string };
		gaten: number[];
	};
	// In the column, in pixels: the padding plus the gap of the content per breakpoint, with the ratio of the strip.
	kolom?: PerStand<{ rand: number[]; gat: number }> & { strook: string };
}

// A drawn section names its drawing; a built section carries its form instead.
// A cut splits a drawn section where an explainer's text lies in flow; the blocks below it count from the cut.
export interface Sectie {
	naam: string;
	hoogte: number;
	tekening?: string;
	gebouwd?: Gebouwd;
	alt?: string;
	// The grid of a section of tiles below 1242.
	raster?: PerStand<RasterMaat>;
	banden: Band[];
	snede?: { y: number; banden: Band[] };
}

// The box of a field or a tile: border, rounding, fill plus padding as top, right, bottom and left.
export interface VeldVak {
	rand: number;
	randKleur: string;
	radius: string;
	vulling: string;
	padding: number[];
}

// The shape of src/layout/algemeen/formulier.json: the measures every form shares.
export interface FormulierLayout {
	label: string;
	labelGat: number;
	gat: number;
	naast: number;
	invoer: VeldVak & { h: number; stijl: string };
	tekstvak: VeldVak & { h: number; stijl: string };
	tegel: VeldVak & { gat: number; stip: { w: number; rand: number; kleur: string } };
	tegelGat: number;
	"tegel-datum": number;
	"tegel-groep": number;
	"kop-datum": string;
	"kop-groep": string;
	dag: string;
	zacht: string;
	klein: string;
	link: { kleur: string; streep: string; dikte: number; afstand: number };
	knop: { w: number; h: number; radius: string; schaduw: string; beeld: Beeld; stijl: string };
}

// A length in design units, or a measured percentage as it stands.
export function maat(waarde: number | string): string {
	return typeof waarde === "number" ? `calc(${waarde} * var(--s))` : waarde.endsWith("px") ? `calc(${Number.parseFloat(waarde)} * var(--s))` : waarde;
}

export interface Layout {
	breedte: number;
	hoogte: number;
	// The page has its column below 1242.
	kolom?: true;
	// The footer lies over the foot of the page, this far above the bottom.
	footer: { onder: number };
	secties: Sectie[];
	// A Praktisch page: the streak that hangs at the top of its first band.
	praktisch?: { streek: { h: number; beeld: Beeld } };
}

// The class of each role of a Praktisch block, per color.
type Rollen = Record<"kop" | "subkop" | "tekst" | "link" | "kopcel" | "kopcelLaatste" | "kopcelVast" | "cel" | "prijs" | "punt", string>;

// The measures of a Praktisch page that differ per breakpoint, the same on desktop as in the column.
export interface PraktischStand {
	band: { rand: number; boven: number; onder: number };
	gat: { blok: number; naKolommen: number; groep: number };
	rij: { gat: number };
	kolom: { gat: number; smal: number };
	drie: { gat: number };
	link: { ruimte: number };
	lijst: { gat: number; punt: number };
	tabel: { kopOnder: number; ruimte: number; gat: number; midden: number; laatste: number };
	rooster: { ruimte: number; gat: number };
}

// In the column a brush edge plus the strip keep the ratio of their layer.
export interface PraktischKolom extends PraktischStand {
	overgang: { verhouding: string };
	slot: { verhouding: string };
}

// The shape of src/layout/algemeen/praktisch.json: the measures every Praktisch page shares, with those of the column
// per breakpoint under standen.
export interface PraktischRegels extends PraktischStand {
	kleur: { wit: string; donker: string };
	overgang: { h: number; rand: Beeld; "wit-donker": Beeld; "donker-wit": Beeld };
	slot: { h: number; kleur: string; strook: { h: number; beeld: Beeld } };
	tabel: {
		kopOnder: number;
		ruimte: number;
		gat: number;
		midden: number;
		laatste: number;
		kopLijn: number;
		lijn: number;
		kopLijnKleur: { wit: string; donker: string };
		lijnKleur: { wit: string; donker: string };
	};
	rooster: { lijn: { h: number; kleur: string }; rijLijn: { h: number; kleur: string }; ruimte: number; wanneer: number; gat: number };
	stijl: { wit: Rollen & { wanneer: string; wat: string }; donker: Rollen; lesrooster: string };
	zinLink: { streep: string; dikte: number; afstand: number };
	standen?: PerStand<PraktischKolom>;
}

// The shape of src/layout/menu.json.
export interface MenuLayout {
	breedte: number;
	z: number;
	hoogte: number;
	balk: Vak;
	pagina: { breedtes: number[]; stijl: string };
	uitklap: { links: number; rechts: number; gat: number; chevron: number; stijl: string };
	knop: { voor: number; w: number; h: number; radius: number; beeld: Beeld; stijl: string };
	inloggen: { voor: number; w: number; h: number; beeld: Beeld };
	vast: { hoogte: number; boven: number; kleur: number[]; lijn: { y: number; h: number; kleur: string } };
	badge: Vak & { beeld: Beeld };
	wissel: { vast: number; logo: number };
	overgang: string;
	paneel: MenuPaneel;
	mobiel?: MenuMobiel;
}

// A focus ring as an outline.
export interface Ring {
	stijl: string;
	dikte: number;
	kleur: string;
	afstand: number;
}

// A heading or a row in a panel: its height, padding as top, right, bottom and left, alignment, rounding plus transition.
export interface PaneelVorm {
	h: number;
	rand: number[];
	uitlijning: string;
	radius: number;
	overgang: string;
	stijl: string;
}

// The panels under the desktop bar, one per item with children, closed until hover, a click or ArrowDown.
export interface MenuPaneel {
	vak: { rand: number[]; gat: number; radius: number; schaduw: string; achtergrond: string; z: number };
	chevron: { open: string; overgang: string };
	kop: PaneelVorm;
	rij: PaneelVorm & { vlak: string; ring: Ring };
	panelen: { links: number; boven: number; kolommen: number[] }[];
}

// The panel of the column below its bar, plus the back-to-top button one screen down.
export interface MenuMobielPaneel {
	rand: number[];
	achtergrond: string;
	schaduw: string;
	z: number;
	kop: PaneelVorm;
	rij: Omit<PaneelVorm, "stijl"> & { vlak: string; ring: Ring };
	stijl: { pagina: string; rij: string };
	huidig: { kleur: string; dikte: number; afstand: number };
	lijn: { boven: number; zij: number; onder: number; h: number; kleur: string };
	inloggen: { gat: number; icoon: { svg: string; w: number; h: number } };
	knop: { boven: number; zij: number; h: number; radius: number; achtergrond: string; ring: Ring; stijl: string };
	hamburger: { strepen: { top: number; transform: string; opacity: number }[]; overgang: string };
}

export interface MenuTerug {
	w: number;
	h: number;
	rechts: number;
	onder: number;
	achtergrond: string;
	radius: string;
	schaduw: string;
	ring: string;
	overgang: string;
	z: number;
	icoon: { svg: string; w: number; h: number };
}

// A background image as AVIF plus PNG, or plus WebP when the measured page serves that.
export interface Achtergrond {
	bestand: string;
	terugval?: "webp";
}

// The bar of the column in pixels, the same on the tablet plus the phone. It lies transparent with its badge hidden
// until the page logo has left the window, then turns white with its badge.
export interface MenuMobiel {
	hoogte: number;
	rand: number;
	kleur: { rust: string; vol: string };
	overgang: { balk: string; badge: string };
	badge: { w: number; h: number; maat: string; plek: string; herhaal: string; beeld: Achtergrond };
	knop: { w: number; h: number; streep: { x: number; w: number; h: number; radius: number; kleur: string; tops: number[] } };
	paneel: MenuMobielPaneel;
	terug: MenuTerug;
}

// The narrow footer of the column per breakpoint in pixels, each padding as top, right, bottom and left.
export interface FooterSmal {
	vak: number[];
	z: number;
	kolommen: number[];
	kolom: number;
	boven: number;
	kop: number;
	rij: number;
	regel: number;
	logo: { w: number; h: number };
	naLogo: number;
	tussen: number;
	onder: { rand: number[]; gat: number; link: number };
}

// The shape of src/layout/footer.json.
export interface FooterLayout {
	breedte: number;
	hoogte: number;
	achtergrond: string;
	inspring: number;
	kolom: number;
	laatste: number;
	rij: number;
	kop: number;
	linkkolom: { boven: number; naKop: number };
	adres: {
		boven: number;
		logo: { w: number; h: number; beeld: Beeld };
		naLogo: number;
		regel: number;
		inspring: number;
		naRegels: number;
	};
	sociaal: { boven: number };
	onder: { boven: number; x: number; w: number; h: number; gat: number };
	stijlen: { kop: string; link: string; adres: string; klein: string };
	smal?: PerStand<FooterSmal>;
}

// Any page entry: the layout file names its fields as strings.
export interface Entry {
	data: object;
	edit: EditProxy;
}

// The place of a block on its section, in design units, with its z-index when it has one. It goes as custom
// properties that basis.css reads, so the column below 1242 can set its own instead.
export function plekVan(blok: Plek & { h?: number; z?: number }): string {
	const maat = blok.h === undefined ? "" : `;--height:calc(${blok.h} * var(--s))`;
	const stapel = blok.z === undefined ? "" : `;--z:${blok.z}`;
	return `--left:calc(${blok.x} * var(--s));--top:calc(${blok.y} * var(--s));--width:calc(${blok.w} * var(--s))${maat}${stapel}`;
}

// The place of a part inside a block, which keeps it at every width.
export function plekStijl(deel: Plek): string {
	return `left:calc(${deel.x} * var(--s));top:calc(${deel.y} * var(--s));width:calc(${deel.w} * var(--s))`;
}

export function waarde(entry: Entry, veld: string): unknown {
	return (entry.data as Record<string, unknown>)[veld];
}
