// Browsers ask for /favicon.ico whatever the head says, so this route sends them on to the favicon of Settings. A
// temporary redirect, so a new favicon is followed the next time.
import type { APIRoute } from "astro";
import { getSiteSettingsWithCacheHint } from "emdash";

export const prerender = false;

const TIJDELIJK = 302;
const NIET_GEVONDEN = 404;

export const GET: APIRoute = async ({ cache, request }) => {
	const { data: settings, cacheHint } = await getSiteSettingsWithCacheHint();
	if (cache?.enabled) cache.set(cacheHint);
	const favicon = settings?.favicon?.url;
	if (!favicon) return new Response(null, { status: NIET_GEVONDEN });
	// A plain response, so the cache headers of the route can still be set on it.
	return new Response(null, { status: TIJDELIJK, headers: { Location: new URL(favicon, request.url).href } });
};
