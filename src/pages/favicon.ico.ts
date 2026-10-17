// Browsers plus older crawlers ask for /favicon.ico whatever the head says. It goes on to the favicon of Settings, as a
// temporary redirect, so a browser follows a new favicon the next time it asks. The redirects of the panel skip a path
// with a file extension, which is why this is a route.
import type { APIRoute } from "astro";
import { getSiteSettingsWithCacheHint } from "emdash";

export const prerender = false;

const TIJDELIJK = 302;

export const GET: APIRoute = async ({ cache, request }) => {
	const { data: settings, cacheHint } = await getSiteSettingsWithCacheHint();
	if (cache?.enabled) cache.set(cacheHint);
	const favicon = settings?.favicon?.url;
	if (!favicon) return new Response(null, { status: 404 });
	// A plain response, so the cache headers of the route can still be set on it.
	return new Response(null, { status: TIJDELIJK, headers: { Location: new URL(favicon, request.url).href } });
};
