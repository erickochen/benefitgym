/* The schedule of SportBit in the page itself: its script plus stylesheet load once, its lessons plus week arrows become
buttons with a name. The focus comes back after a week change plus stays in the popup until it closes. Only the box in
view takes the id, since SportBit fills one per page. */
import { ADRES, LEEG, LINK, MELDING, ROOSTER_ID, STAND, VAK, VENSTER_ID } from "../lesrooster";
import { LESROOSTER } from "../teksten";

// ms a box waits for SportBit before it shows the way out.
const LAAD_GRENS = 15000;
// How SportBit writes the span between two times, plus what joins the parts of the name of a lesson.
const STREEP = " - ";
const DEEL = ", ";

interface EmbedRooster {
	init(uri: string, roosterId: string | null): void;
	closeEvent(): void;
}
const sportbit = () => (window as unknown as { embed_rooster?: EmbedRooster }).embed_rooster;

// One promise per script, so a second box never loads it again.
const scripts = new Map<string, Promise<void>>();
function laadScript(src: string): Promise<void> {
	const bekend = scripts.get(src);
	if (bekend) return bekend;
	const belofte = new Promise<void>((klaar, mis) => {
		const el = document.createElement("script");
		el.src = src;
		el.async = true;
		el.onload = () => klaar();
		el.onerror = () => {
			scripts.delete(src);
			el.remove();
			mis(new Error(`${src} laadt niet`));
		};
		document.head.appendChild(el);
	});
	scripts.set(src, belofte);
	return belofte;
}

function laadStijl(href: string) {
	if ([...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((l) => l.href === href)) return;
	const el = document.createElement("link");
	el.rel = "stylesheet";
	el.href = href;
	document.head.appendChild(el);
}

function toets(event: KeyboardEvent) {
	if (event.key !== "Enter" && event.key !== " ") return;
	event.preventDefault();
	// A held Enter is one click, not a burst of requests to SportBit.
	if (event.repeat) return;
	(event.currentTarget as HTMLElement).click();
}

// SportBit builds its buttons as a div or an a without href, which Tab skips. False when the element already was one.
function maakKnop(el: HTMLElement, label: string): boolean {
	if (el.dataset.knop) return false;
	el.dataset.knop = "ja";
	el.setAttribute("role", "button");
	el.tabIndex = 0;
	el.setAttribute("aria-label", label);
	el.addEventListener("keydown", toets);
	return true;
}

const zichtbaar = (el: Element) => el.getClientRects().length > 0;

// Empty but for one div: SportBit takes the first child of its box for a week on its way.
function leegmaken(el: HTMLElement) {
	el.replaceChildren(document.createElement("div"));
}

type Stand = "laden" | "klaar" | "fout" | "dubbel";
type Week = "vorige" | "volgende" | "vandaag";

export function zetLesrooster(houder: HTMLElement) {
	const vak = houder.querySelector<HTMLElement>(`.${VAK}`);
	const melding = houder.querySelector<HTMLElement>(`.${MELDING}`);
	let regel = houder.querySelector<HTMLElement>(`.${STAND}`);
	if (!vak || !melding || !regel) return;
	const stijl = regel.className;
	const basis = (houder.dataset.adres?.trim() || ADRES).replace(/\/*$/, "/");
	const rooster = (houder.dataset.rooster ?? "").trim() || null;
	let stand: Stand = "laden";
	let grens = 0;
	let venster: HTMLElement | null = null;
	let vensterOpen = false;
	let terugFocus: HTMLElement | null = null;
	let week: Week | null = null;

	// The line of a state above the box, or none once the schedule stands.
	const regelVoor = (nieuw: Stand) => {
		if (nieuw === "klaar") return null;
		const p = document.createElement("p");
		p.className = stijl;
		if (nieuw === "fout") {
			const link = document.createElement("a");
			link.href = basis;
			link.className = LINK;
			link.textContent = LESROOSTER.naarSportbit;
			// The space is a text node of its own, as the measured page renders it.
			for (const deel of [document.createTextNode(LESROOSTER.fout), document.createTextNode(" "), link]) p.appendChild(deel);
		} else {
			p.textContent = nieuw === "dubbel" ? LESROOSTER.dubbel : LESROOSTER.laden;
		}
		return p;
	};
	const zetStand = (nieuw: Stand) => {
		if (nieuw === stand) return;
		stand = nieuw;
		regel?.remove();
		regel = regelVoor(nieuw);
		if (regel) houder.insertBefore(regel, vak);
	};

	const vensterToets = (event: KeyboardEvent) => {
		if (!venster) return;
		if (event.key === "Escape") {
			event.preventDefault();
			sportbit()?.closeEvent();
			return;
		}
		if (event.key !== "Tab") return;
		// The focus stays in the popup until it closes.
		const doelen = [...venster.querySelectorAll<HTMLElement>('a[href], [role="button"]')].filter(zichtbaar);
		if (!doelen.length) return;
		const eerste = doelen[0];
		const laatste = doelen[doelen.length - 1];
		const nu = document.activeElement;
		if (!venster.contains(nu)) {
			event.preventDefault();
			eerste.focus();
		} else if (event.shiftKey && nu === eerste) {
			event.preventDefault();
			laatste.focus();
		} else if (!event.shiftKey && nu === laatste) {
			event.preventDefault();
			eerste.focus();
		}
	};

	// Runs on opening plus on every new content while open, since a second lesson replaces the HTML in place.
	const richIn = (el: HTMLElement) => {
		el.setAttribute("role", "dialog");
		el.setAttribute("aria-modal", "true");
		el.tabIndex = -1;
		const kop = el.querySelector("h1");
		if (kop) {
			kop.id = `${VENSTER_ID}-kop`;
			el.setAttribute("aria-labelledby", kop.id);
		}
		for (const a of el.querySelectorAll<HTMLElement>("a:not([href])")) {
			const label = a.classList.contains("window-close") ? LESROOSTER.sluiten : a.textContent?.trim();
			if (label) maakKnop(a, label);
		}
		if (!el.contains(document.activeElement)) (el.querySelector<HTMLElement>(".window-close") ?? el).focus();
	};

	const volgVenster = () => {
		if (!venster) return;
		const open = venster.style.display === "block" && Boolean(venster.querySelector("#sportbit-popup-box"));
		if (open) {
			if (!vensterOpen) {
				vensterOpen = true;
				terugFocus = document.activeElement as HTMLElement | null;
				document.addEventListener("keydown", vensterToets);
			}
			richIn(venster);
		} else if (vensterOpen) {
			vensterOpen = false;
			document.removeEventListener("keydown", vensterToets);
			if (terugFocus?.isConnected) terugFocus.focus();
			terugFocus = null;
		}
	};
	const vensterWaarnemer = new MutationObserver(volgVenster);

	// Every week arrives as new HTML, so each improvement runs again on each arrow.
	const verbeter = () => {
		// SportBit keeps the box of the moment of an arrow. A week that lands after another box took the id goes again.
		if (vak.id !== ROOSTER_ID) {
			if (vak.querySelector(".embed-rooster")) leegmaken(vak);
			return;
		}
		const wortel = vak.querySelector(".embed-rooster");
		if (!wortel) return;
		zetStand("klaar");
		for (const les of vak.querySelectorAll<HTMLElement>(".evtitem")) {
			const deel = (s: string) => les.querySelector(s)?.textContent?.trim() ?? "";
			const dag = les.closest<HTMLElement>(".items-day");
			const wanneer = dag ? `${dag.dataset.dayname ?? ""} ${dag.dataset.month ?? ""}`.trim() : "";
			const naam = [deel(".title"), wanneer, deel(".time").replace(STREEP, LESROOSTER.tot), deel(".trainer")].filter(Boolean);
			if (les.classList.contains("gepasseerd")) naam.push(LESROOSTER.geweest);
			les.querySelector(".title")?.setAttribute("title", deel(".title"));
			maakKnop(les, naam.join(DEEL));
		}
		// The list shows only what is still to come; with nothing left it says so instead of a white field.
		const kalender = wortel.querySelector(".calendar");
		if (kalender && !vak.querySelector(".evtitem:not(.gepasseerd)") && !kalender.querySelector(`.${LEEG}`)) {
			const zin = document.createElement("p");
			zin.className = LEEG;
			zin.textContent = vak.querySelector(".evtitem") ? LESROOSTER.geenMeer : LESROOSTER.geen;
			kalender.insertBefore(zin, kalender.firstChild);
		}
		const pijlen = [...vak.querySelectorAll<HTMLElement>(".top .week a")];
		const knoppen: [HTMLElement | undefined, Week, string][] = [
			[pijlen[0], "vorige", LESROOSTER.vorige],
			[pijlen.at(-1), "volgende", LESROOSTER.volgende],
			[vak.querySelector<HTMLElement>(".top .today a") ?? undefined, "vandaag", LESROOSTER.dezeWeek],
		];
		for (const [knop, soort, label] of knoppen) {
			if (!knop) continue;
			if (knop.classList.contains("inactive")) {
				knop.setAttribute("aria-hidden", "true");
				continue;
			}
			if (maakKnop(knop, label)) knop.addEventListener("click", () => (week = soort));
		}
		// After a week change the focus goes back to the button that gave it. Back in this week the arrow back is off,
		// so it lands on the arrow forward.
		if (week) {
			const bruikbaar = knoppen.filter(([knop]) => knop?.dataset.knop && zichtbaar(knop));
			const terug =
				bruikbaar.find(([, soort]) => soort === week) ?? bruikbaar.find(([, soort]) => soort !== "vandaag") ?? bruikbaar[0];
			const periode = (vak.querySelector("#sportbit-periode")?.textContent?.trim() ?? "").replace(STREEP, LESROOSTER.tot);
			terug?.[0]?.focus();
			if (melding.textContent !== periode) melding.textContent = periode;
			week = null;
		}
		const nieuw = document.getElementById(VENSTER_ID);
		if (nieuw && nieuw !== venster) {
			vensterWaarnemer.disconnect();
			venster = nieuw;
			vensterWaarnemer.observe(venster, { attributes: true, attributeFilter: ["style"], childList: true });
		}
	};
	new MutationObserver(verbeter).observe(vak, { childList: true });

	// Only the box in view fetches the schedule. A second box in view waits with its own line.
	const start = () => {
		if (!zichtbaar(vak) || vak.id === ROOSTER_ID) return;
		const ander = document.getElementById(ROOSTER_ID);
		if (ander && ander !== vak) {
			if (zichtbaar(ander)) {
				zetStand("dubbel");
				return;
			}
			// The old box is out of view. Its HTML goes along, or SportBit reads the week from there.
			leegmaken(ander);
			ander.removeAttribute("id");
		}
		vak.id = ROOSTER_ID;
		week = null;
		if (!vak.querySelector(".embed-rooster")) zetStand("laden");
		// The clock runs from the request.
		window.clearTimeout(grens);
		grens = window.setTimeout(() => {
			if (vak.id === ROOSTER_ID && !vak.querySelector(".embed-rooster")) zetStand("fout");
		}, LAAD_GRENS);
		laadStijl(`${basis}cbm/css/embed/rooster/rooster.css`);
		laadScript(`${basis}cbm/embed/rooster/cdn/`)
			.then(() => {
				if (vak.id === ROOSTER_ID) sportbit()?.init(basis, rooster);
			})
			.catch(() => zetStand("fout"));
	};
	new ResizeObserver(start).observe(vak);
	start();
}
