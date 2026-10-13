import type { EditProxy } from "emdash";

// The shape of src/layout/<slug>.json: measured places at the design width, field names, no text.
export interface Plek {
	x: number;
	y: number;
	w: number;
}

export type Blok =
	| ({ soort: "logo"; bestand: string; h: number } & Plek)
	| ({ soort: "tekst"; veld: string; link?: string; tag: string; stijl: string } & Plek)
	| ({ soort: "alineas"; veld: string; stijl: string } & Plek)
	| ({ soort: "cijfer"; n: number; stijl: string } & Plek)
	| ({
			soort: "knop";
			veld: string;
			link: string;
			stijl: string;
			h: number;
			radius: number;
			achtergrond: string;
			beeld: string | null;
			tekst: Plek;
	  } & Plek);

export interface Sectie {
	naam: string;
	hoogte: number;
	tekening: string;
	alt?: string;
	blokken: Blok[];
}

export interface Layout {
	breedte: number;
	hoogte: number;
	secties: Sectie[];
}

// Any page entry: the layout file names its fields as strings.
export interface Entry {
	data: object;
	edit: EditProxy;
}

export function waarde(entry: Entry, veld: string): unknown {
	return (entry.data as Record<string, unknown>)[veld];
}
