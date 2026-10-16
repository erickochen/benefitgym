// The content of a Praktisch page as the theme draws it: blocks in bands of one color, Portable Text in parts.
// The layout generator reads the same rules, so the theme and its check share one source.

export type Vlak = "wit" | "donker";

interface MetVlak {
	_type: string;
	vlak?: string | null;
}

export interface Span {
	_type?: string;
	text?: string;
	marks?: string[];
}

export interface MarkDef {
	_key: string;
	_type: string;
	href?: string;
}

interface Cel {
	isHeader?: boolean;
	content?: Span[];
	markDefs?: MarkDef[];
}

export interface PtBlok {
	_type: string;
	_key?: string;
	style?: string;
	listItem?: string;
	level?: number;
	children?: Span[];
	markDefs?: MarkDef[];
	hasHeaderRow?: boolean;
	rows?: { cells?: Cel[] }[];
}

// A list of one kind; an item holds the deeper lists that follow it.
export interface Lijst {
	genummerd: boolean;
	items: { blok: PtBlok; onder: Lijst[] }[];
}

// The kinds of part: a paragraph, a paragraph that is one link, a heading, a list plus a table. A table cell is a
// paragraph of its own. Anything else, such as an image, is drawn the way EmDash draws it.
export type Deel =
	| { soort: "tekst"; blok: PtBlok; citaat: boolean }
	| { soort: "link"; blok: PtBlok; tekst: string; href: string }
	| { soort: "subkop"; blok: PtBlok; tag: "h3" | "h4" | "h5" | "h6" }
	| ({ soort: "lijst" } & Lijst)
	| { soort: "tabel"; kop: PtBlok[] | null; rijen: PtBlok[][] }
	| { soort: "onbekend"; blok: PtBlok };

const KOPPEN = ["h1", "h2", "h3", "h4", "h5", "h6"];
// The page title is the h1 and a block heading an h2, so a heading inside the text starts at h3.
const KOP_TAG = { h1: "h3", h2: "h3", h3: "h3", h4: "h4", h5: "h5", h6: "h6" } as const;

// A run of text with the same link plus emphasis.
export interface Stuk {
	tekst: string;
	href?: string;
	sterk: boolean;
	nadruk: boolean;
}

// A block lies on white unless it is a photo row on dark.
export function vlakVan(blok: MetVlak): Vlak {
	return blok._type === "tekst_met_foto" && blok.vlak === "donker" ? "donker" : "wit";
}

// Consecutive blocks of one color form a band; a brush edge lies between two bands.
export function bandenVan<T extends MetVlak>(blokken: readonly T[]): { vlak: Vlak; blokken: T[] }[] {
	const uit: { vlak: Vlak; blokken: T[] }[] = [];
	for (const blok of blokken) {
		const vlak = vlakVan(blok);
		const laatste = uit.at(-1);
		if (laatste?.vlak === vlak) laatste.blokken.push(blok);
		else uit.push({ vlak, blokken: [blok] });
	}
	return uit;
}

// The width over the height of a photo, on three decimals as the measured page rounds it.
export function verhouding(breedte: number, hoogte: number): number {
	return Number((breedte / hoogte).toFixed(3));
}

// The paragraphs of a plain text field: a blank line starts a new one.
export function alineasVan(tekst: string | null | undefined): string[] {
	return String(tekst ?? "")
		.split(/\n\s*\n/)
		.map((alinea) => alinea.trim())
		.filter(Boolean);
}

// The text of a block or a table cell.
export function tekstVan(spans: readonly Span[] | undefined): string {
	return (spans ?? []).map((span) => span.text ?? "").join("");
}

// The runs of a paragraph, each with the address its link mark points at.
export function stukkenVan(blok: PtBlok): Stuk[] {
	const links = new Map(
		(blok.markDefs ?? [])
			.filter((def) => def._type === "link" && def.href)
			.map((def) => [def._key, def.href as string]),
	);
	const uit: Stuk[] = [];
	for (const span of blok.children ?? []) {
		const marks = span.marks ?? [];
		const stuk = {
			tekst: span.text ?? "",
			href: marks.map((mark) => links.get(mark)).find(Boolean),
			sterk: marks.includes("strong"),
			nadruk: marks.includes("em"),
		};
		const vorige = uit.at(-1);
		if (vorige && vorige.href === stuk.href && vorige.sterk === stuk.sterk && vorige.nadruk === stuk.nadruk)
			vorige.tekst += stuk.tekst;
		else if (stuk.tekst) uit.push(stuk);
	}
	return uit;
}

// A run of list items as lists: a change of kind starts a new list, a deeper item hangs under the item before it.
export function lijstenVan(items: readonly PtBlok[]): Lijst[] {
	let i = 0;
	const niveau = (blok: PtBlok) => Math.max(1, blok.level ?? 1);
	const lees = (diepte: number): Lijst[] => {
		const lijsten: Lijst[] = [];
		while (i < items.length && niveau(items[i]) >= diepte) {
			if (niveau(items[i]) > diepte) {
				const onder = lees(diepte + 1);
				const vorige = lijsten.at(-1)?.items.at(-1);
				if (vorige) vorige.onder.push(...onder);
				else lijsten.push(...onder);
				continue;
			}
			const genummerd = items[i].listItem === "number";
			const lijst = lijsten.at(-1);
			if (lijst?.genummerd === genummerd) lijst.items.push({ blok: items[i], onder: [] });
			else lijsten.push({ genummerd, items: [{ blok: items[i], onder: [] }] });
			i++;
		}
		return lijsten;
	};
	return lees(1);
}

// A table cell as a paragraph; a link mark of the cell wins from one of the table.
function celBlok(tabel: PtBlok, cel: Cel): PtBlok {
	return {
		_type: "block",
		children: cel.content ?? [],
		markDefs: [...(tabel.markDefs ?? []), ...(cel.markDefs ?? [])],
	};
}

// The parts of a Portable Text field: list items in a row form lists; a plain paragraph that is one whole link is a
// link row. A paragraph without text is left out.
export function delenVan(blokken: readonly PtBlok[] | null | undefined): Deel[] {
	const uit: Deel[] = [];
	const lijst = blokken ?? [];
	for (let i = 0; i < lijst.length; i++) {
		const blok = lijst[i];
		if (blok._type === "table") {
			const rijen = (blok.rows ?? []).map((rij) => (rij.cells ?? []).map((cel) => celBlok(blok, cel)));
			const kop = blok.hasHeaderRow && rijen.length ? rijen[0] : null;
			uit.push({ soort: "tabel", kop, rijen: kop ? rijen.slice(1) : rijen });
			continue;
		}
		if (blok._type !== "block") {
			uit.push({ soort: "onbekend", blok });
			continue;
		}
		if (blok.listItem) {
			let eind = i;
			while (lijst[eind + 1]?._type === "block" && lijst[eind + 1].listItem) eind++;
			const items = lijst.slice(i, eind + 1).filter((item) => tekstVan(item.children).trim());
			for (const deel of lijstenVan(items)) uit.push({ soort: "lijst", ...deel });
			i = eind;
			continue;
		}
		if (!tekstVan(blok.children).trim()) continue;
		const stijl = blok.style ?? "normal";
		if (KOPPEN.includes(stijl)) {
			uit.push({ soort: "subkop", blok, tag: KOP_TAG[stijl as keyof typeof KOP_TAG] });
			continue;
		}
		const stukken = stukkenVan(blok);
		const [enige] = stukken;
		if (stijl === "normal" && stukken.length === 1 && enige.href)
			uit.push({ soort: "link", blok, tekst: enige.tekst, href: enige.href });
		else uit.push({ soort: "tekst", blok, citaat: stijl === "blockquote" });
	}
	return uit;
}
