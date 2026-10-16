// The facts of the gym as the footer, the structured data plus llms.txt show them, from the list Gegevens and Social.
// No runtime import here, so the generator in the content scripts reads the same rules.

/** The one entry of the list Gegevens, read on this slug. */
export const GEGEVENS_SLUG = "benefit-gym";

export interface GegevensData {
	naam?: string;
	andere_naam?: string;
	straat?: string;
	postcode?: string;
	plaats?: string;
	provincie?: string;
	land?: string;
	telefoon?: string;
	email?: string;
	oprichtingsjaar?: string;
	prijsbereik?: string;
	breedtegraad?: number;
	lengtegraad?: number;
	kaartlink?: string;
	llms_inleiding?: string;
}

/** A phone number as typed, with spaces, written the way a link plus the structured data need it. */
export const internationaal = (telefoon: string) => telefoon.replace(/[^\d+]/g, "");

export interface AdresRegel {
	tekst: string;
	href?: string;
}

/** The address lines of the footer: street, postcode with place plus the phone as a link. */
export function adresRegels(g: GegevensData | undefined): AdresRegel[] {
	if (!g) return [];
	const regels: AdresRegel[] = [];
	if (g.straat) regels.push({ tekst: g.straat });
	if (g.plaats) regels.push({ tekst: [g.postcode, g.plaats].filter(Boolean).join(" ") });
	if (g.telefoon) regels.push({ tekst: g.telefoon, href: `tel:${internationaal(g.telefoon)}` });
	return regels;
}

// Social holds handles; the profile addresses are built from them. A full address or a leading @ is taken as typed.
const profiel = (handle: string | undefined, bouw: (h: string) => string) => {
	const schoon = handle?.trim().replace(/^@/, "");
	return !schoon ? undefined : /^https?:\/\//.test(schoon) ? schoon : bouw(schoon);
};

/** The profiles the footer links plus the structured data name, in that order. */
export function profielen(social: { instagram?: string; facebook?: string } | undefined) {
	return [
		{ netwerk: "instagram" as const, href: profiel(social?.instagram, (h) => `https://www.instagram.com/${h}/`) },
		{ netwerk: "facebook" as const, href: profiel(social?.facebook, (h) => `https://www.facebook.com/${h}`) },
	].filter((p): p is { netwerk: "instagram" | "facebook"; href: string } => Boolean(p.href));
}
