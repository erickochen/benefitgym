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

// An image as AVIF plus PNG, with the smaller sizes of its srcset.
export interface Beeld {
	bestand: string;
	breedte: number;
	kleiner?: number[];
	sizes?: string;
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
) & { z?: number };

// A drawn section names its drawing; a built section has none and only keeps its height for now.
export interface Sectie {
	naam: string;
	hoogte: number;
	tekening?: string;
	gebouwd?: boolean;
	alt?: string;
	blokken: Blok[];
}

export interface Layout {
	breedte: number;
	hoogte: number;
	// The footer lies over the foot of the page, this far above the bottom.
	footer: { onder: number };
	secties: Sectie[];
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
