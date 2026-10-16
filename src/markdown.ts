// A page as markdown for an agent that asks for it, as Markdown for Agents of Cloudflare does on a paid plan: front
// matter from the head, the main element as markdown without scripts, styles or hidden parts, then the JSON-LD as one
// json block. HTMLRewriter reads the page into a small tree that is written out as markdown.

const MARKDOWN = "text/markdown";
const HTML = "text/html";
// The parts of the head that go into the front matter, in this order.
const VOORWERK = ["title", "description", "image"] as const;
// Elements that hold no text a reader needs.
const WEG = new Set(["script", "style", "noscript", "template", "svg", "nav", "footer", "select", "iframe", "head"]);
// Elements without an end tag.
const LEEG = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);
// Elements that open a block of their own; the rest runs inside a paragraph.
const BLOK = new Set([
	"address",
	"article",
	"aside",
	"blockquote",
	"body",
	"details",
	"dd",
	"div",
	"dl",
	"dt",
	"fieldset",
	"figcaption",
	"figure",
	"form",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"header",
	"hr",
	"html",
	"legend",
	"li",
	"main",
	"ol",
	"p",
	"picture",
	"section",
	"summary",
	"table",
	"tbody",
	"td",
	"tfoot",
	"th",
	"thead",
	"tr",
	"ul",
]);
// The cells of a table, as elements or as roles.
const CEL = new Set(["td", "th"]);
const CEL_ROL = new Set(["cell", "columnheader", "rowheader"]);
// Headers that describe the HTML bytes and not the markdown body.
const ZONDER = ["content-length", "content-encoding", "content-range", "etag", "last-modified", "transfer-encoding"];

interface Knoop {
	tag: string;
	attrs: Record<string, string>;
	kinderen: (Knoop | string)[];
	ouder?: Knoop;
}

/** The quality an Accept header gives a type, 0 when it does not name it. */
function kwaliteit(accept: string, type: string): number {
	for (const deel of accept.split(",")) {
		const [naam, ...parameters] = deel.trim().toLowerCase().split(";");
		if (naam.trim() !== type) continue;
		const q = parameters.map((p) => p.trim()).find((p) => p.startsWith("q="));
		return q ? Number(q.slice(2)) || 0 : 1;
	}
	return 0;
}

/** True when the request names markdown at least as high as HTML. */
export function wiltMarkdown(accept: string | null): boolean {
	if (!accept) return false;
	const md = kwaliteit(accept, MARKDOWN);
	return md > 0 && md >= kwaliteit(accept, HTML);
}

/** A page of the site: a GET or HEAD outside the panel that answers with HTML. */
export function isPagina(request: Request, antwoord: Response): boolean {
	const { pathname } = new URL(request.url);
	return (
		["GET", "HEAD"].includes(request.method) &&
		!pathname.startsWith("/_emdash/") &&
		(antwoord.headers.get("Content-Type") ?? "").startsWith(HTML)
	);
}

function varieert(headers: Headers) {
	const vary = (headers.get("Vary") ?? "")
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);
	if (!vary.some((v) => v.toLowerCase() === "accept")) headers.set("Vary", [...vary, "Accept"].join(", "));
}

/** The page as it is, with a Vary on Accept so a cache keeps HTML plus markdown apart. */
export function metVary(antwoord: Response): Response {
	const headers = new Headers(antwoord.headers);
	varieert(headers);
	return new Response(antwoord.body, { status: antwoord.status, statusText: antwoord.statusText, headers });
}

const ENTITEITEN: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const ontcijfer = (s: string) =>
	s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (heel, code: string) => {
		if (code[0] !== "#") return ENTITEITEN[code.toLowerCase()] ?? heel;
		const getal =
			code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
		return Number.isFinite(getal) ? String.fromCodePoint(getal) : heel;
	});
const ontsnap = (s: string) => s.replace(/([\\`*_[\]])/g, "\\$1");

async function boom(antwoord: Response): Promise<Knoop> {
	const wortel: Knoop = { tag: "#document", attrs: {}, kinderen: [] };
	let hier = wortel;
	const rewriter = new HTMLRewriter()
		.on("*", {
			element(el) {
				// The attributes of HTMLRewriter come as name plus value pairs, as written in the HTML.
				const attrs = Object.fromEntries(
					[...(el.attributes as unknown as Iterable<[string, string]>)].map(([naam, waarde]) => [
						naam,
						ontcijfer(waarde),
					]),
				);
				const knoop: Knoop = { tag: el.tagName.toLowerCase(), attrs, kinderen: [], ouder: hier };
				hier.kinderen.push(knoop);
				if (LEEG.has(knoop.tag)) return;
				hier = knoop;
				el.onEndTag(() => {
					hier = knoop.ouder ?? wortel;
				});
			},
		})
		.onDocument({
			text(t) {
				if (t.text) hier.kinderen.push(t.text);
			},
		});
	await rewriter.transform(antwoord).arrayBuffer();
	return wortel;
}

function* alle(k: Knoop): Generator<Knoop> {
	yield k;
	for (const kind of k.kinderen) if (typeof kind !== "string") yield* alle(kind);
}

const verborgen = (k: Knoop) => WEG.has(k.tag) || "hidden" in k.attrs || k.attrs["aria-hidden"] === "true";
const tekstVan = (k: Knoop): string =>
	k.kinderen.map((c) => (typeof c === "string" ? ontcijfer(c) : tekstVan(c))).join("");
const heeftBlok = (k: Knoop): boolean =>
	k.kinderen.some((c) => typeof c !== "string" && !verborgen(c) && (BLOK.has(c.tag) || heeftBlok(c)));
const schoon = (s: string) => s.replace(/\s+/g, " ").trim();

function adres(href: string | undefined, basis: string): string | undefined {
	if (!href || href.startsWith("#") || /^javascript:/i.test(href)) return undefined;
	try {
		return new URL(href, basis).href;
	} catch {
		return undefined;
	}
}

// An image that waits for its media query carries a blank pixel as src; its address is the largest candidate of the
// source beside it.
function bronVan(img: Knoop): string | undefined {
	const src = img.attrs.src;
	if (!src?.startsWith("data:")) return src;
	const source = img.ouder?.kinderen.find(
		(c): c is Knoop => typeof c !== "string" && c.tag === "source" && Boolean(c.attrs.srcset),
	);
	const kandidaten = (source?.attrs.srcset ?? "")
		.split(",")
		.map((k) => k.trim().split(/\s+/))
		.filter((k) => k[0]);
	return kandidaten.sort((a, b) => Number.parseInt(b[1] ?? "0", 10) - Number.parseInt(a[1] ?? "0", 10))[0]?.[0];
}

class Schrijver {
	blokken: string[] = [];
	private regel = "";
	constructor(private basis: string) {}

	private inline(k: Knoop): string {
		return k.kinderen
			.map((c) => {
				if (typeof c === "string") return ontsnap(ontcijfer(c));
				if (verborgen(c)) return "";
				if (c.tag === "br") return " ";
				if (c.tag === "img") return this.beeld(c);
				const binnen = this.inline(c);
				if (c.tag === "a") {
					const href = adres(c.attrs.href, this.basis);
					return href && schoon(binnen) ? `[${schoon(binnen)}](${href})` : binnen;
				}
				if ((c.tag === "strong" || c.tag === "b") && schoon(binnen)) return `**${schoon(binnen)}**`;
				if ((c.tag === "em" || c.tag === "i") && schoon(binnen)) return `*${schoon(binnen)}*`;
				return binnen;
			})
			.join("");
	}

	private beeld(k: Knoop): string {
		const alt = schoon(ontcijfer(k.attrs.alt ?? ""));
		const src = adres(bronVan(k), this.basis);
		// A crop for the column repeats the alt text its drawing already carries.
		return alt && src && !(k.attrs.class ?? "").split(/\s+/).includes("uitsnede") ? `![${ontsnap(alt)}](${src})` : "";
	}

	private sluit() {
		const tekst = schoon(this.regel);
		if (tekst) this.blokken.push(tekst);
		this.regel = "";
	}

	// A table of HTML or one built from roles, as the Praktisch pages draw theirs.
	private tabel(k: Knoop) {
		const rijen = [...alle(k)]
			.filter((c) => c.tag === "tr" || c.attrs.role === "row")
			.map((tr) =>
				[...alle(tr)]
					.filter((c) => c !== tr && (CEL.has(c.tag) || CEL_ROL.has(c.attrs.role ?? "")))
					.map((cel) => schoon(this.inline(cel)).replace(/\|/g, "\\|")),
			);
		if (!rijen.length) return;
		const breedte = Math.max(...rijen.map((r) => r.length));
		const rij = (r: string[]) => `| ${[...r, ...Array(breedte - r.length).fill("")].join(" | ")} |`;
		this.blokken.push([rij(rijen[0]), rij(Array(breedte).fill("---")), ...rijen.slice(1).map(rij)].join("\n"));
	}

	private lijst(k: Knoop) {
		const items = k.kinderen.filter((c): c is Knoop => typeof c !== "string" && c.tag === "li" && !verborgen(c));
		const regels = items
			.map((li, i) => `${k.tag === "ol" ? `${i + 1}.` : "-"} ${schoon(this.inline(li))}`)
			.filter((r) => !/^(-|\d+\.)\s*$/.test(r));
		if (regels.length) this.blokken.push(regels.join("\n"));
	}

	schrijf(k: Knoop) {
		for (const c of k.kinderen) {
			if (typeof c === "string") {
				this.regel += ontsnap(ontcijfer(c));
				continue;
			}
			if (verborgen(c)) continue;
			const kop = /^h([1-6])$/.exec(c.tag);
			if (c.tag === "img") {
				const beeld = this.beeld(c);
				if (beeld) {
					this.sluit();
					this.blokken.push(beeld);
				}
			} else if (kop) {
				this.sluit();
				const tekst = schoon(this.inline(c));
				if (tekst) this.blokken.push(`${"#".repeat(Number(kop[1]))} ${tekst}`);
			} else if (c.tag === "ul" || c.tag === "ol") {
				this.sluit();
				this.lijst(c);
			} else if (c.tag === "table" || c.attrs.role === "table") {
				this.sluit();
				this.tabel(c);
			} else if (c.tag === "a" && heeftBlok(c)) {
				// A link around a block, such as a heading that links on: each block inside carries the link.
				this.sluit();
				const href = adres(c.attrs.href, this.basis);
				const binnen = new Schrijver(this.basis);
				binnen.schrijf(c);
				this.blokken.push(
					...binnen
						.klaar()
						.map((b) => (href ? b.replace(/^(#+ )?(.+)$/s, (_, voor = "", rest) => `${voor}[${rest}](${href})`) : b)),
				);
			} else if (BLOK.has(c.tag)) {
				this.sluit();
				this.schrijf(c);
				this.sluit();
			} else {
				// The element itself counts, so a link or an emphasis keeps its mark.
				this.regel += this.inline({ tag: "#inline", attrs: {}, kinderen: [c] });
			}
		}
	}

	klaar() {
		this.sluit();
		return this.blokken;
	}
}

/** The page as markdown, with the status plus the headers it may keep. */
export async function alsMarkdown(antwoord: Response, url: string): Promise<Response> {
	const wortel = await boom(antwoord.clone());
	const knopen = [...alle(wortel)];
	const meta = (sleutel: string, waarde: string) =>
		knopen.find((k) => k.tag === "meta" && k.attrs[sleutel] === waarde)?.attrs.content;
	const voorwerk = {
		title:
			meta("name", "title") ??
			meta("property", "og:title") ??
			schoon(tekstVan(knopen.find((k) => k.tag === "title") ?? wortel)),
		description: meta("name", "description") ?? meta("property", "og:description"),
		image: meta("property", "og:image"),
	};
	const kop = VOORWERK.filter((k) => voorwerk[k]).map((k) => `${k}: ${JSON.stringify(ontcijfer(voorwerk[k] ?? ""))}`);
	const main = knopen.find((k) => k.tag === "main");
	const schrijver = new Schrijver(url);
	if (main) schrijver.schrijf(main);
	const jsonld = knopen
		.filter((k) => k.tag === "script" && k.attrs.type === "application/ld+json")
		// The text of a script is raw, so it is parsed as it stands.
		.map((k) => JSON.stringify(JSON.parse(k.kinderen.filter((c) => typeof c === "string").join(""))));
	const delen = [
		...(kop.length ? [`---\n${kop.join("\n")}\n---`] : []),
		...schrijver.klaar(),
		...(jsonld.length ? [`\`\`\`json\n${jsonld.join("\n")}\n\`\`\``] : []),
	];
	const headers = new Headers(antwoord.headers);
	for (const naam of ZONDER) headers.delete(naam);
	headers.set("Content-Type", `${MARKDOWN}; charset=utf-8`);
	varieert(headers);
	return new Response(`${delen.join("\n\n")}\n`, { status: antwoord.status, statusText: antwoord.statusText, headers });
}
