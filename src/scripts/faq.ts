/* The FAQ as an accordion: one category open plus one question in it. What is not open steps aside while something
is, so the list stays within the room of the drawing. A click on what is open closes it with all below it. Escape
closes one level, and focus inside a part that closes goes back to the button that opened it. */
export function zetFaq(blok: HTMLElement) {
	const lijst = blok.querySelector<HTMLElement>(".faq-lijst");
	if (!lijst) return;
	const categorieen = [...lijst.querySelectorAll<HTMLElement>(":scope > .faq-categorie")].map((categorie) => ({
		categorie,
		knop: categorie.querySelector<HTMLButtonElement>(".faq-knop"),
		paneel: categorie.querySelector<HTMLElement>(".faq-paneel"),
		vragen: [...categorie.querySelectorAll<HTMLElement>(".faq-vraag")].map((vraag) => ({
			vraag,
			knop: vraag.querySelector<HTMLButtonElement>(".faq-vraagknop"),
			antwoord: vraag.querySelector<HTMLElement>(".faq-antwoord"),
		})),
	}));
	// What is open as a path: "" for nothing, "2" for the third category, "2/0" for its first question.
	let open = "";
	const ouder = (pad: string) => pad.split("/").slice(0, -1).join("/");

	const toon = () => {
		const [cat, vr] = open.split("/");
		lijst.classList.toggle("faq-open", open !== "");
		categorieen.forEach(({ categorie, knop, paneel, vragen }, i) => {
			const aan = cat === String(i);
			categorie.classList.toggle("faq-aan", aan);
			categorie.classList.toggle("faq-opzij", open !== "" && !aan);
			knop?.setAttribute("aria-expanded", String(aan));
			paneel?.classList.toggle("faq-dicht", !aan);
			vragen.forEach(({ vraag, knop: vraagKnop, antwoord }, j) => {
				const vraagAan = aan && vr === String(j);
				vraag.classList.toggle("faq-opzij", aan && vr !== undefined && !vraagAan);
				vraagKnop?.setAttribute("aria-expanded", String(vraagAan));
				antwoord?.classList.toggle("faq-dicht", !vraagAan);
			});
		});
	};
	// Focus inside a part that just closed goes to the button of that part.
	const zet = (pad: string) => {
		const was = open;
		open = pad;
		toon();
		const actief = document.activeElement;
		if (!actief || !lijst.contains(actief) || (actief as HTMLElement).checkVisibility()) return;
		const [cat, vr] = was.split("/");
		const terug = open === "" ? categorieen[Number(cat)]?.knop : categorieen[Number(cat)]?.vragen[Number(vr)]?.knop;
		terug?.focus();
	};
	const wissel = (doel: string) => zet(open === doel || open.startsWith(`${doel}/`) ? ouder(doel) : doel);

	categorieen.forEach(({ knop, vragen }, i) => {
		knop?.addEventListener("click", () => wissel(String(i)));
		vragen.forEach(({ knop: vraagKnop }, j) => vraagKnop?.addEventListener("click", () => wissel(`${i}/${j}`)));
	});
	lijst.addEventListener("keydown", (e) => {
		if (e.key !== "Escape" || open === "") return;
		e.preventDefault();
		zet(ouder(open));
	});
}
