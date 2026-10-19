// Portable Text as the panel stores it, read without a renderer: the link on a span and a paragraph that is one link.
// The types plus the text of a block live in praktisch.ts, which the layout generator loads on its own.
import type { PtBlok, Span } from "./praktisch";

export type { MarkDef, PtBlok, Span } from "./praktisch";
export { tekstVan } from "./praktisch";

const linksVan = (blok: PtBlok) => (blok.markDefs ?? []).filter((def) => def._type === "link" && def.href);

// The address of the link on a span, or without a span the first link any span of the block carries.
export function linkVan(blok: PtBlok, span?: Span): string | undefined {
	const spans = span ? [span] : (blok.children ?? []);
	return linksVan(blok).find((def) => spans.some((s) => s.marks?.includes(def._key)))?.href;
}

// A paragraph that is one whole link, as a button or a link row: every span carries the same single link.
export function isEenLink(blok: PtBlok): boolean {
	const [link, ...meer] = linksVan(blok);
	const spans = blok.children ?? [];
	return Boolean(link) && !meer.length && spans.length > 0 && spans.every((span) => span.marks?.includes(link._key));
}
