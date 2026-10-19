import { env } from "cloudflare:workers";

// The host of the fonts plus the drawings, as one checked URL without a trailing slash.
export function staticUrl(): string {
	const raw = env.STATIC_URL;
	if (!raw) throw new Error("STATIC_URL is not set");
	return new URL(raw).href.replace(/\/$/, "");
}
