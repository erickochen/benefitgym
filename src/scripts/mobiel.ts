/* The panel of the column plus the back-to-top button. While the panel is open the page stops scrolling, the page
logo steps aside plus the bar turns white. Escape, a tap outside or a page row closes it, as does focus that leaves.
The button shows one screen down while the panel is closed and brings the page plus the focus back to the top. */
export function zetMobiel(menu: HTMLElement, paginaLogo: () => HTMLElement | undefined) {
	const nav = menu.querySelector<HTMLElement>(".menu-mobiel");
	const knop = nav?.querySelector<HTMLButtonElement>(".menu-hamburger");
	const paneel = knop && document.getElementById(knop.getAttribute("aria-controls") ?? "");
	const terug = document.querySelector<HTMLButtonElement>(".menu-terug");
	if (!nav || !knop || !paneel) return;
	const open = () => knop.getAttribute("aria-expanded") === "true";
	let herstel: (() => void) | null = null;

	// The layer that lifts the page logo above the bar with its z-index, else the logo itself.
	const logoLaag = (logo: HTMLElement) => {
		for (let e: HTMLElement | null = logo; e && e !== document.body; e = e.parentElement) {
			if (getComputedStyle(e).zIndex !== "auto") return e;
		}
		return logo;
	};
	const zet = (aan: boolean) => {
		if (aan === open()) return;
		knop.setAttribute("aria-expanded", String(aan));
		paneel.classList.toggle("menu-dicht", !aan);
		menu.classList.toggle("open", aan);
		if (aan) {
			// The lock sits on the root, which stops the window from scrolling. On the body it would clip the strip that
			// hangs below it at the foot of the page.
			const html = document.documentElement;
			const vorige = html.style.overflow;
			html.style.overflow = "hidden";
			const logo = paginaLogo();
			const laag = logo && logoLaag(logo);
			const zicht = laag?.style.visibility ?? "";
			if (laag) laag.style.visibility = "hidden";
			herstel = () => {
				html.style.overflow = vorige;
				if (laag) laag.style.visibility = zicht;
			};
		} else {
			herstel?.();
			herstel = null;
		}
		toonTerug();
	};
	// Closing drops focus that sat in the panel. It goes back to the hamburger then, plus always after Escape.
	const sluit = (naarKnop: boolean) => {
		const binnen = nav.contains(document.activeElement);
		zet(false);
		if (naarKnop || binnen) knop.focus();
	};
	knop.addEventListener("click", () => zet(!open()));
	document.addEventListener("keydown", (e) => {
		if (e.key !== "Escape" || !open()) return;
		e.preventDefault();
		sluit(true);
	});
	document.addEventListener("pointerdown", (e) => {
		if (open() && !nav.contains(e.target as Node)) sluit(false);
	});
	// A page row leads elsewhere, so the panel closes; the login plus the button open their own tab or site.
	for (const rij of paneel.querySelectorAll<HTMLAnchorElement>("ul a")) rij.addEventListener("click", () => sluit(false));
	nav.addEventListener("focusout", () => {
		setTimeout(() => {
			const nu = document.activeElement;
			if (!nu || nu === document.body || nav.contains(nu)) return;
			zet(false);
		}, 0);
	});

	// Only the bar of the column on screen has a box, so the button shows on that breakpoint alone.
	let beeld = 0;
	function toonTerug() {
		beeld = 0;
		const aan = Boolean(nav?.getClientRects().length) && scrollY > innerHeight && !open();
		terug?.classList.toggle("toon", aan);
	}
	const plan = () => {
		if (!beeld) beeld = requestAnimationFrame(toonTerug);
	};
	addEventListener("scroll", plan, { passive: true });
	// A window that grows past the column hides the bar, so an open panel closes with its lock on the page.
	addEventListener("resize", () => {
		if (open() && !nav.getClientRects().length) zet(false);
		plan();
	});
	toonTerug();
	// The page ends at the top, where this button is not, so the focus goes to the hamburger.
	terug?.addEventListener("click", () => {
		const rustig = matchMedia("(prefers-reduced-motion: reduce)").matches;
		scrollTo({ top: 0, behavior: rustig ? "auto" : "smooth" });
		knop.focus({ preventScroll: true });
	});
}
