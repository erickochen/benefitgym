import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";
import { alsMarkdown, isPagina, metVary, wiltMarkdown } from "./markdown";

export { PluginBridge };

// From this status on a response is a failed render, which the edge cache must not keep for the lifetime of its route.
const SERVERFOUT = 500;

/** The response without the headers that would store it in the Workers Cache. */
function zonderCache(antwoord: Response): Response {
	const headers = new Headers(antwoord.headers);
	headers.set("Cloudflare-CDN-Cache-Control", "no-store");
	headers.delete("Cache-Tag");
	return new Response(antwoord.body, { status: antwoord.status, statusText: antwoord.statusText, headers });
}

export default {
	...handler,
	// A page goes out as markdown when the request asks for it, and always with a Vary on Accept.
	async fetch(request, env, ctx) {
		if (!handler.fetch) throw new Error("the EmDash handler has no fetch");
		const antwoord = await handler.fetch(request, env, ctx);
		if (antwoord.status >= SERVERFOUT) return zonderCache(antwoord);
		if (!isPagina(request, antwoord)) return antwoord;
		return wiltMarkdown(request.headers.get("Accept")) ? alsMarkdown(antwoord, request.url) : metVary(antwoord);
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
