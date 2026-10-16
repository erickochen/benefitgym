// Live editing on the page holds a field to its maximum length, as the panel does: a counter beside the field and no
// character past the maximum. The editor toolbar marks the field it edits with data-emdash-editing.

const BEWERKT = "data-emdash-editing";
const VERWIJZING = "data-emdash-ref";
// The manifest the toolbar reads too, with the kind plus the validation of every field.
const MANIFEST = "/_emdash/api/manifest";
// The toolbar reads a multi-line text field with its line breaks, a one-line field as its text content.
const MEER_REGELS = "richText";
// The counter: a small dark pill above the right edge of the field, orange once the field is full.
const GAT = 6;
const RAND = 8;
const DONKER = "rgb(26, 26, 26)";
const ORANJE = "rgb(236, 110, 29)";
const WIT = "rgb(255, 255, 255)";
// Below the toolbar of the editor, above everything on the page.
const LAAG = "999998";
// The first half of a character outside the basic plane, which a cut may not leave behind on its own.
const HOOG_BEGIN = 0xd800;
const HOOG_EIND = 0xdbff;

interface Veld {
	kind?: string;
	validation?: { maxLength?: number };
}

interface Manifest {
	collections?: Record<string, { fields?: Record<string, Veld> }>;
}

let manifest: Promise<Manifest | null> | null = null;
// The fields being watched, so a second click while the manifest loads attaches nothing twice.
const bewaakt = new WeakSet<HTMLElement>();

function leesManifest(): Promise<Manifest | null> {
	manifest ??= fetch(MANIFEST, { credentials: "same-origin", headers: { "X-EmDash-Request": "1" } })
		.then((r) => r.json() as Promise<{ data?: Manifest } & Manifest>)
		.then((m) => m.data ?? m)
		.catch(() => null);
	return manifest;
}

// The text of a multi-line field as the toolbar saves it: a line break counts as one character.
function regelsVan(element: HTMLElement): string {
	let tekst = "";
	const loop = (knoop: Node) => {
		for (let kind = knoop.firstChild; kind; kind = kind.nextSibling) {
			if (kind.nodeType === Node.TEXT_NODE) tekst += (kind as Text).data;
			else if (kind.nodeName === "BR") tekst += "\n";
			else {
				if (kind.nodeName === "DIV" && tekst && !tekst.endsWith("\n")) tekst += "\n";
				loop(kind);
			}
		}
	};
	loop(element);
	return tekst;
}

// A cut that does not split a character in two.
function knip(tekst: string, n: number): string {
	const stuk = tekst.slice(0, Math.max(n, 0));
	const laatste = stuk.charCodeAt(stuk.length - 1);
	return laatste >= HOOG_BEGIN && laatste <= HOOG_EIND ? stuk.slice(0, -1) : stuk;
}

function nieuweTeller(): HTMLElement {
	const teller = document.createElement("div");
	teller.setAttribute("aria-hidden", "true");
	Object.assign(teller.style, {
		position: "absolute",
		zIndex: LAAG,
		padding: "2px 8px",
		borderRadius: "999px",
		font: "600 12px/18px system-ui, sans-serif",
		color: WIT,
		pointerEvents: "none",
	});
	// The types of the worker give append the shape of HTMLRewriter, so the browser call is appendChild.
	document.body.appendChild(teller);
	return teller;
}

function zetAanEind(element: HTMLElement) {
	const selectie = getSelection();
	if (!selectie) return;
	const bereik = document.createRange();
	bereik.selectNodeContents(element);
	bereik.collapse(false);
	selectie.removeAllRanges();
	selectie.addRange(bereik);
}

function bewaak(element: HTMLElement, max: number, meerRegels: boolean) {
	const teller = nieuweTeller();
	// The untrimmed text the toolbar reads, plus the length it saves after trimming.
	const ruw = () => (meerRegels ? regelsVan(element) : (element.textContent ?? ""));
	const lengte = () => ruw().trim().length;
	// The last text that may stay: within the maximum, or shorter than before when the stored text is already longer.
	let laatsteGoed = ruw();
	let laatsteLengte = lengte();
	let herstelt = false;
	const herstel = () => {
		herstelt = true;
		element.textContent = laatsteGoed;
		zetAanEind(element);
		// The toolbar tracks unsaved changes on input, so it sees the text it will save.
		element.dispatchEvent(new Event("input", { bubbles: true }));
		herstelt = false;
	};
	const zet = () => {
		const n = lengte();
		teller.textContent = `${n}/${max}`;
		teller.style.background = n >= max ? ORANJE : DONKER;
		const vak = element.getBoundingClientRect();
		const links = Math.min(Math.max(vak.right - teller.offsetWidth, RAND), innerWidth - teller.offsetWidth - RAND);
		teller.style.left = `${links + scrollX}px`;
		teller.style.top = `${Math.max(vak.top - teller.offsetHeight - GAT, RAND) + scrollY}px`;
	};
	// Typing or pasting past the maximum goes in as far as it fits. The room counts the raw text, so a space at the end
	// leaves no room it does not have. A composition or a drop is left to the check after the input.
	const voorInvoer = (e: InputEvent) => {
		if (!e.inputType.startsWith("insert") || e.isComposing || !e.cancelable) return;
		const regel = e.inputType === "insertLineBreak" || e.inputType === "insertParagraph";
		const erbij = regel ? "\n" : (e.data ?? e.dataTransfer?.getData("text/plain") ?? "");
		const selectie = getSelection();
		const ruimte = max - (ruw().length - (selectie?.toString().length ?? 0));
		if (erbij.length <= ruimte) return;
		e.preventDefault();
		const stuk = knip(erbij, ruimte);
		if (!stuk || regel || e.inputType === "insertFromDrop" || !selectie?.rangeCount) return;
		const bereik = selectie.getRangeAt(0);
		bereik.deleteContents();
		const knoop = document.createTextNode(stuk);
		bereik.insertNode(knoop);
		bereik.setStartAfter(knoop);
		bereik.collapse(true);
		selectie.removeAllRanges();
		selectie.addRange(bereik);
		// The toolbar tracks unsaved changes on input, as it would for a typed character.
		element.dispatchEvent(new Event("input", { bubbles: true }));
	};
	// Whatever still makes the text grow past the maximum, such as a composed character, goes back to the last text that
	// fitted. A text that only gets shorter always stays, so a text over a lowered maximum can still be cut down.
	const naInvoer = (e: Event) => {
		if (herstelt || (e as InputEvent).isComposing) return;
		const n = lengte();
		if (n <= max || n <= laatsteLengte) {
			laatsteGoed = ruw();
			laatsteLengte = n;
		} else herstel();
		zet();
	};
	// Enter saves at once, also in the middle of a composition, so a text past the maximum goes back first.
	const opEnter = (e: KeyboardEvent) => {
		if (e.target !== element || e.key !== "Enter" || e.shiftKey || lengte() <= max || lengte() <= laatsteLengte) return;
		herstel();
		zet();
	};
	element.addEventListener("beforeinput", voorInvoer);
	element.addEventListener("input", naInvoer);
	element.addEventListener("compositionend", naInvoer);
	// The capture phase on the document runs before every listener on the field, the toolbar's keydown among them.
	document.addEventListener("keydown", opEnter, { capture: true });
	addEventListener("scroll", zet, { passive: true });
	addEventListener("resize", zet);
	zet();
	const klaar = new MutationObserver(() => {
		if (element.hasAttribute(BEWERKT)) return;
		element.removeEventListener("beforeinput", voorInvoer);
		element.removeEventListener("input", naInvoer);
		element.removeEventListener("compositionend", naInvoer);
		document.removeEventListener("keydown", opEnter, { capture: true });
		removeEventListener("scroll", zet);
		removeEventListener("resize", zet);
		teller.remove();
		bewaakt.delete(element);
		klaar.disconnect();
	});
	klaar.observe(element, { attributes: true, attributeFilter: [BEWERKT] });
}

async function begin(element: HTMLElement) {
	if (bewaakt.has(element)) return;
	bewaakt.add(element);
	let ref: { collection?: string; field?: string };
	try {
		ref = JSON.parse(element.getAttribute(VERWIJZING) ?? "{}");
	} catch {
		ref = {};
	}
	const veld =
		ref.collection && ref.field
			? (await leesManifest())?.collections?.[ref.collection]?.fields?.[ref.field]
			: undefined;
	const max = veld?.validation?.maxLength;
	if (max && element.hasAttribute(BEWERKT)) bewaak(element, max, veld.kind === MEER_REGELS);
	else bewaakt.delete(element);
}

export function zetLiveEdit() {
	// Loaded up front, so the first edit already knows its maximum.
	void leesManifest();
	new MutationObserver((wijzigingen) => {
		for (const w of wijzigingen) {
			const element = w.target as HTMLElement;
			if (w.oldValue === null && element.hasAttribute(BEWERKT)) void begin(element);
		}
	}).observe(document.body, { subtree: true, attributes: true, attributeFilter: [BEWERKT], attributeOldValue: true });
}
