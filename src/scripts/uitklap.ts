/* The explainer: opened from its summary, a band scrolls into view up to IN_BEELD from the foot and a card takes the
focus. Inklappen, Escape, a press or focus outside a card close it with the focus back on the summary. */
import { KOLOM_MEDIA } from "../layout";

// The part of the window below the top of a band that opens from the button.
const IN_BEELD = 0.35;

export function zetUitklap(uitklap: HTMLDetailsElement) {
	const knop = uitklap.querySelector<HTMLElement>(":scope > summary");
	const tekst = uitklap.querySelector<HTMLElement>(".uitklap-tekst");
	const inklappen = uitklap.querySelector<HTMLButtonElement>(".uitklap-inklappen");
	if (!knop || !tekst) return;
	const inKolom = matchMedia(KOLOM_MEDIA);
	const kaart = () => uitklap.dataset.stand === "kaart" && !inKolom.matches;
	const rustig = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

	// A click on the summary opens before the toggle event comes, so it marks that the button opened the text.
	let vanKnop = false;
	knop.addEventListener("click", () => {
		vanKnop = !uitklap.open;
	});
	uitklap.addEventListener("toggle", () => {
		const doe = uitklap.open && vanKnop;
		vanKnop = false;
		if (!doe) return;
		requestAnimationFrame(() => {
			if (kaart()) {
				tekst.focus({ preventScroll: true });
				return;
			}
			const grens = innerHeight * (1 - IN_BEELD);
			const top = tekst.getBoundingClientRect().top;
			if (top > grens) scrollBy({ top: top - grens, behavior: rustig() ? "auto" : "smooth" });
		});
	});

	const sluit = () => {
		uitklap.open = false;
		requestAnimationFrame(() => {
			knop.focus({ preventScroll: true });
			const r = knop.getBoundingClientRect();
			if (r.top < 0 || r.bottom > innerHeight)
				knop.scrollIntoView({ block: "center", behavior: rustig() ? "auto" : "smooth" });
		});
	};
	inklappen?.addEventListener("click", sluit);
	tekst.addEventListener("keydown", (e) => {
		if (e.key !== "Escape") return;
		e.preventDefault();
		sluit();
	});
	knop.addEventListener("keydown", (e) => {
		if (e.key !== "Escape" || !uitklap.open) return;
		e.preventDefault();
		uitklap.open = false;
	});

	// A card lies over what comes after it, so focus that leaves it or its summary closes it. So does a press outside.
	const buiten = (doel: EventTarget | null) => doel instanceof Node && !tekst.contains(doel) && !knop.contains(doel);
	for (const deel of [knop, tekst]) {
		deel.addEventListener("focusout", (e) => {
			if (kaart() && uitklap.open && buiten(e.relatedTarget)) uitklap.open = false;
		});
	}
	document.addEventListener("pointerdown", (e) => {
		if (kaart() && uitklap.open && buiten(e.target)) uitklap.open = false;
	});
}
