// Texts that stay code. Everything a visitor reads as content lives in the CMS.

// The gym name in the footer plus the badge. Also the fallback title until Site Settings carry one.
export const SITE_NAME = "Benefit Gym";

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
};

// The sign-up forms: the last tile of each list, the state of a group, the hints after a choice plus the planner link.
export const FORMULIER = {
	anders: "De gewenste groep zit er niet tussen",
	andereGroep: "andere groep",
	plek: "Plek vrij",
	vol: "Wachtlijst",
	uitlegPlek: "Er is plek in deze groep. Plan de gratis proefles in onze planner.",
	uitlegVol: "Deze groep is vol. Zet je kind op de wachtlijst. Zodra er plek is, krijg je een uitnodiging voor een gratis proefles.",
	uitlegAnders: "Laat je gegevens achter, dan zoeken we samen een groep die past.",
	planner: "Plan je gratis proefles",
	geenDatum: "Geen van deze data, hou me op de hoogte",
	opDeHoogte: "Hou me op de hoogte",
};
