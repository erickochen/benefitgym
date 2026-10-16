/* The review carousel. The arrows step one review, a dot on the phone jumps to its own. The rail snaps, so a swipe
lands on a review too. The arrows plus the dots follow where it lands. A screen reader hears only the review in
view. From BOLLETJES_MEE reviews on the row of dots slides along, so the current dot stays in view. */

// The number of reviews from which the row of dots slides, plus how many dots it shows then.
export const BOLLETJES_MEE = 14;
export const BOLLETJES_ZICHT = BOLLETJES_MEE - 1;

/* The first dot in view for the current review: the current one in the middle, held at both ends of the row. */
export function eersteBolletje(aantal: number, huidig: number, zicht = BOLLETJES_ZICHT) {
	if (aantal <= zicht) return 0;
	return Math.min(Math.max(huidig - Math.floor(zicht / 2), 0), aantal - zicht);
}

export function zetReviews(blok: HTMLElement) {
	const rail = blok.querySelector<HTMLElement>(".reviews-rail");
	if (!rail) return;
	const slides = [...rail.children] as HTMLElement[];
	const [vorige, volgende] = blok.querySelectorAll<HTMLButtonElement>(".reviews-pijl");
	const bolletjes = [...blok.querySelectorAll<HTMLButtonElement>(".reviews-bolletje")];
	const rij = blok.querySelector<HTMLElement>(".reviews-bolletjes-rij");
	let huidig = 0;

	// An arrow with nothing on its side fades out and leaves the tab order, as the measured carousel does. Focus on it
	// moves to the other arrow, or to the rail when neither has anything left.
	const zetPijl = (pijl: HTMLButtonElement | undefined, aan: boolean, ander: HTMLButtonElement | undefined) => {
		if (!pijl) return;
		pijl.toggleAttribute("data-uit", !aan);
		pijl.tabIndex = aan ? 0 : -1;
		if (aan || document.activeElement !== pijl) return;
		if (ander && !ander.hasAttribute("data-uit")) ander.focus({ preventScroll: true });
		else rail.focus({ preventScroll: true });
	};
	const toon = () => {
		zetPijl(vorige, huidig > 0, volgende);
		zetPijl(volgende, huidig < slides.length - 1, vorige);
		slides.forEach((slide, i) => slide.setAttribute("aria-hidden", String(i !== huidig)));
		// In a long row only the dots in its window take part; the current one is always among them.
		const eerste = rij ? eersteBolletje(bolletjes.length, huidig) : 0;
		const inZicht = (i: number) => bolletjes.length < BOLLETJES_MEE || (i >= eerste && i < eerste + BOLLETJES_ZICHT);
		bolletjes.forEach((bolletje, i) => {
			if (i === huidig) bolletje.setAttribute("aria-current", "true");
			else bolletje.removeAttribute("aria-current");
			bolletje.tabIndex = inZicht(i) ? 0 : -1;
			bolletje.toggleAttribute("aria-hidden", !inZicht(i));
		});
		if (rij) rij.style.setProperty("--rb-eerste", String(eerste));
	};

	let plan = 0;
	const volg = () => {
		if (plan) return;
		plan = requestAnimationFrame(() => {
			plan = 0;
			const breed = rail.clientWidth;
			if (breed > 0) huidig = Math.min(Math.round(rail.scrollLeft / breed), Math.max(0, slides.length - 1));
			toon();
		});
	};
	const naar = (doel: number) => {
		const rustig = matchMedia("(prefers-reduced-motion: reduce)").matches;
		const plek = Math.min(Math.max(doel, 0), Math.max(0, slides.length - 1));
		rail.scrollTo({ left: plek * rail.clientWidth, behavior: rustig ? "auto" : "smooth" });
	};
	rail.addEventListener("scroll", volg, { passive: true });
	new ResizeObserver(volg).observe(rail);
	vorige?.addEventListener("click", () => naar(huidig - 1));
	volgende?.addEventListener("click", () => naar(huidig + 1));
	bolletjes.forEach((bolletje, i) => bolletje.addEventListener("click", () => naar(i)));
	toon();
}
