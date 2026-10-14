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
			rij: { h: number; lijn: number; kleur: string };
			label: Plek & { stijl: string };
			icoon: { x: number; y: number; w: number; vlak: string; pijl: string };
	  } & Plek)
) & { z?: number };

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
}

// A drawn section names its drawing; a built section carries its form instead.
// A cut splits a drawn section where an explainer's text lies in flow; the blocks below it count from the cut.
export interface Sectie {
	naam: string;
	hoogte: number;
	tekening?: string;
	gebouwd?: Gebouwd;
	alt?: string;
	blokken: Blok[];
	snede?: { y: number; blokken: Blok[] };
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
	// The footer lies over the foot of the page, this far above the bottom.
	footer: { onder: number };
	secties: Sectie[];
	// A Praktisch page: the streak that hangs at the top of its first band.
	praktisch?: { streek: { h: number; beeld: Beeld } };
}

// The class of each role of a Praktisch block, per color.
type Rollen = Record<"kop" | "subkop" | "tekst" | "link" | "kopcel" | "kopcelLaatste" | "cel" | "prijs" | "punt", string>;

// The shape of src/layout/algemeen/praktisch.json: the measures every Praktisch page shares.
export interface PraktischRegels {
	band: { rand: number; boven: number; onder: number };
	kleur: { wit: string; donker: string };
	gat: { blok: number; naKolommen: number };
	overgang: { h: number; rand: Beeld; "wit-donker": Beeld; "donker-wit": Beeld };
	slot: { h: number; kleur: string; strook: { h: number; beeld: Beeld } };
	rij: { gat: number };
	kolom: { gat: number; smal: number };
	drie: { gat: number };
	link: { ruimte: number };
	lijst: { gat: number; punt: number };
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
}

// Any page entry: the layout file names its fields as strings.
export interface Entry {
	data: object;
	edit: EditProxy;
}

// The place of a block on its section, in design units, with its z-index when it has one.
export function plekVan(blok: Plek & { h?: number; z?: number }): string {
	const maat = blok.h === undefined ? "" : `;height:calc(${blok.h} * var(--s))`;
	const stapel = blok.z === undefined ? "" : `;z-index:${blok.z}`;
	return `left:calc(${blok.x} * var(--s));top:calc(${blok.y} * var(--s));width:calc(${blok.w} * var(--s))${maat}${stapel}`;
}

export function waarde(entry: Entry, veld: string): unknown {
	return (entry.data as Record<string, unknown>)[veld];
}
