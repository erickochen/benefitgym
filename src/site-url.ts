import { env } from "cloudflare:workers";

// The public origin of the site from EMDASH_SITE_URL, which every address in the structured data plus llms.txt follows.
export function siteUrl(): string {
	const raw = env.EMDASH_SITE_URL;
	if (!raw) throw new Error("EMDASH_SITE_URL is not set");
	return new URL(raw).origin;
}
