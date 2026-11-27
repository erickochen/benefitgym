// The key file of IndexNow in the root of the site: the key itself on its own name, 404 on any other name and without
// a key. llms.txt plus robots.txt are fixed routes and win from this one. The route rule of /[slug] matches this path
// too, so the answer opts out of the cache and a 404 from before the key exists never lingers.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

const NIET_GEVONDEN = 404;

export const GET: APIRoute = ({ params, cache }) => {
	cache?.set(false);
	const sleutel = env.INDEXNOW_KEY;
	if (!sleutel || params.sleutel !== sleutel) return new Response(null, { status: NIET_GEVONDEN });
	return new Response(sleutel, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
