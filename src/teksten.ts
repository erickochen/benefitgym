// Texts that stay code. Everything a visitor reads as content lives in the CMS.

// The gym name in the footer plus the badge. Also the fallback title until Site Settings carry one.
export const SITE_NAME = "Benefit Gym";

// The name of the bar of the column plus its button, for a screen reader.
export const MENU = "Menu";

// The name of the button that scrolls back up, plus what a screen reader hears after a link that opens a new tab.
export const TERUG = "Terug naar boven";
export const NIEUW_TABBLAD = ", opent in een nieuw tabblad";

// The footer texts, word for word. The year behind the copyright follows the clock.
export const KOLOM_TEKEN = ":";
export const SOCIAAL_KOP = ["Volg ons op", "sociale media:"];
export const SOCIAAL = { instagram: "Instagram", facebook: "Facebook" };
export const SCHEIDING = "•";
export const COPYRIGHT = "Copyright - Disclaimer ©";

// The review carousel, for a screen reader.
export const REVIEWS = {
	rail: "Reviews",
	rol: "carrousel",
	slide: "review",
	bediening: "Bediening van de reviews",
	vorige: "Vorige review",
	volgende: "Volgende review",
	van: (i: number, n: number) => `${i} van ${n}`,
	// A dot below the carousel on the phone.
	bolletje: (i: number) => `Review ${i}`,
};

// The button at the foot of an open explainer.
export const INKLAPPEN = "Inklappen";

// The point before a list item on a Praktisch page.
export const PUNT = "•";

// The schedule of SportBit: its states, the names of its buttons plus the line for a week without lessons.
export const LESROOSTER = {
	laden: "Rooster wordt geladen…",
	fout: "Het rooster laadt nu niet.",
	naarSportbit: "Bekijk het rooster bij SportBit",
	dubbel: "SportBit toont één rooster per pagina. Dit tweede blijft leeg.",
	vorige: "Vorige week",
	volgende: "Volgende week",
	dezeWeek: "Deze week",
	sluiten: "Sluiten",
	geenMeer: "Er staan deze week geen lessen meer op het rooster.",
	geen: "Er staan deze week geen lessen op het rooster.",
	// Behind the name of a lesson that is over, plus between the two times of a lesson or a week.
	geweest: "al geweest",
	tot: " tot ",
};

// The sign-up forms: the last tile of each list, the state of a group, the hints after a choice plus the planner link.
export const FORMULIER = {
	anders: "De gewenste groep zit er niet tussen",
	andereGroep: "andere groep",
	plek: "Plek vrij",
	vol: "Wachtlijst",
	uitlegPlek: "Er is plek in deze groep. Plan de gratis proefles in onze planner.",
	uitlegVol:
		"Deze groep is vol. Zet je kind op de wachtlijst. Zodra er plek is, krijg je een uitnodiging voor een gratis proefles.",
	uitlegAnders: "Laat je gegevens achter, dan zoeken we samen een groep die past.",
	planner: "Plan je gratis proefles",
	geenDatum: "Geen van deze data, hou me op de hoogte",
	opDeHoogte: "Hou me op de hoogte",
	// The line below the button when a form does not arrive.
	mis: "Er ging iets mis",
};

// The message under a field the browser refuses, by the name of the field in the panel.
export const MELDINGEN: Record<string, string> = {
	naam: "Vul je naam in.",
	email: "Vul een geldig e-mailadres in.",
	bericht: "Schrijf je vraag in het bericht.",
	voornaam: "Vul je voornaam in.",
	achternaam: "Vul je achternaam in.",
	telefoon: "Vul een geldig telefoonnummer in.",
	datum: "Kies een datum of de laatste optie.",
	groep: "Kies een groep.",
	naam_kind: "Vul de naam van je kind in.",
	naam_ouder: "Vul je naam in.",
};
