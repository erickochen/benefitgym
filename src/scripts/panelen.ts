/* The panels under the desktop bar. A panel opens on hover plus on a click, and ArrowDown opens it with focus on its
first row. The arrows step through the rows of all its columns as one list. Escape plus a press outside close it, as
does focus that leaves without a mouse resting on it. */
export function zetPanelen(menu: HTMLElement) {
	for (const houder of menu.querySelectorAll<HTMLElement>(".menu-uitklap-houder")) {
		const knop = houder.querySelector<HTMLButtonElement>(".menu-uitklap");
		const paneel = knop && document.getElementById(knop.getAttribute("aria-controls") ?? "");
		if (!knop || !paneel) continue;
		const rijen = () => [...paneel.querySelectorAll<HTMLAnchorElement>("a")];
		const open = () => knop.getAttribute("aria-expanded") === "true";
		const zet = (aan: boolean) => {
			knop.setAttribute("aria-expanded", String(aan));
			paneel.classList.toggle("menu-dicht", !aan);
		};
		// Closing drops focus that sat in the panel. It goes back to the button then, plus always after Escape.
		const sluit = (naarKnop: boolean) => {
			const binnen = houder.contains(document.activeElement);
			zet(false);
			if (naarKnop || binnen) knop.focus();
		};
		// Only a real mouse, since a tap leaves :hover behind.
		let muisBinnen = false;
		// A leave closes one frame later, so a leave plus an enter right after it leave the panel as it was.
		let sluitPlan = 0;
		// A tap brings an enter plus a click at once; that click keeps the panel it just opened. The mark clears in a task
		// posted behind the input already queued, so a click that comes later toggles as usual.
		let netGeopend = false;
		const kanaal = new MessageChannel();
		kanaal.port1.onmessage = () => {
			netGeopend = false;
		};
		houder.addEventListener("mouseenter", () => {
			cancelAnimationFrame(sluitPlan);
			if (!open()) {
				netGeopend = true;
				kanaal.port2.postMessage(null);
			}
			zet(true);
		});
		houder.addEventListener("mouseleave", () => {
			sluitPlan = requestAnimationFrame(() => sluit(false));
		});
		houder.addEventListener("pointerenter", (e) => {
			if (e.pointerType === "mouse") muisBinnen = true;
		});
		houder.addEventListener("pointerleave", () => {
			muisBinnen = false;
		});
		knop.addEventListener("click", () => {
			if (!netGeopend) zet(!open());
		});
		knop.addEventListener("keydown", (e) => {
			if (e.key !== "ArrowDown") return;
			e.preventDefault();
			zet(true);
			rijen()[0]?.focus();
		});
		paneel.addEventListener("keydown", (e) => {
			if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
			const lijst = rijen();
			if (!lijst.length) return;
			e.preventDefault();
			const nu = lijst.indexOf(document.activeElement as HTMLAnchorElement);
			const stap = e.key === "ArrowDown" ? 1 : -1;
			const volgende = nu < 0 ? (stap > 0 ? 0 : lijst.length - 1) : (nu + stap + lijst.length) % lijst.length;
			lijst[volgende].focus();
		});
		document.addEventListener("keydown", (e) => {
			if (e.key !== "Escape" || !open()) return;
			e.preventDefault();
			sluit(true);
		});
		document.addEventListener("mousedown", (e) => {
			if (open() && !houder.contains(e.target as Node)) sluit(false);
		});
		// Tab out closes without pulling focus back. The check waits until focus has landed, since Safari parks it on the
		// body after a click.
		houder.addEventListener("focusout", () => {
			setTimeout(() => {
				const nu = document.activeElement;
				if (!nu || nu === document.body || houder.contains(nu) || muisBinnen) return;
				zet(false);
			}, 0);
		});
	}
}
