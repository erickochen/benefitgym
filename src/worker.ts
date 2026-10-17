import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";
import { alsMarkdown, isPagina, metVary, wiltMarkdown } from "./markdown";

export { PluginBridge };

// From this status on a response is a failed render, which the edge cache must not keep for the lifetime of its route.
const SERVERFOUT = 500;
// The route of the panel that serves a media file: the favicon, the logo, the social images plus the photos under
// Praktisch. EmDash answers it with max-age=0, so every page view ran the Worker for the favicon. A media file keeps
// its address when an editor replaces it, so the edge keeps it a day and a browser an hour; a cache rule of the zone
// does not reach a response of the Worker.
const MEDIA_PAD = "/_emdash/api/media/file/";
const MEDIA_EDGE_SECONDEN = 86_400;
const MEDIA_BROWSER_SECONDEN = 3_600;
const OK = 200;
const NIET_GEWIJZIGD = 304;

/** The response without the headers that would store it in the Workers Cache. */
function zonderCache(antwoord: Response): Response {
	const headers = new Headers(antwoord.headers);
	headers.set("Cloudflare-CDN-Cache-Control", "no-store");
	headers.delete("Cache-Tag");
	return new Response(antwoord.body, { status: antwoord.status, statusText: antwoord.statusText, headers });
}

/** A media file of the panel, as a GET or HEAD that found it, without a cookie that a shared cache must not keep. */
function isMedia(request: Request, antwoord: Response): boolean {
	return (
		["GET", "HEAD"].includes(request.method) &&
		new URL(request.url).pathname.startsWith(MEDIA_PAD) &&
		[OK, NIET_GEWIJZIGD].includes(antwoord.status) &&
		!antwoord.headers.has("Set-Cookie")
	);
}

/** The media file with the lifetimes above; its validators stay, so a browser can still ask whether it changed. */
function metMediaCache(antwoord: Response): Response {
	const headers = new Headers(antwoord.headers);
	headers.set("Cloudflare-CDN-Cache-Control", `public, max-age=${MEDIA_EDGE_SECONDEN}`);
	headers.set("Cache-Control", `public, max-age=${MEDIA_BROWSER_SECONDEN}`);
	return new Response(antwoord.body, { status: antwoord.status, statusText: antwoord.statusText, headers });
}

export default {
	...handler,
	// A page goes out as markdown when the request asks for it, and always with a Vary on Accept.
	async fetch(request, env, ctx) {
		if (!handler.fetch) throw new Error("the EmDash handler has no fetch");
		const antwoord = await handler.fetch(request, env, ctx);
		if (antwoord.status >= SERVERFOUT) return zonderCache(antwoord);
		if (isMedia(request, antwoord)) return metMediaCache(antwoord);
		if (!isPagina(request, antwoord)) return antwoord;
		return wiltMarkdown(request.headers.get("Accept")) ? alsMarkdown(antwoord, request.url) : metVary(antwoord);
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
