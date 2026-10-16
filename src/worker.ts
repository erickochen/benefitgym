import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";
import { alsMarkdown, isPagina, metVary, wiltMarkdown } from "./markdown";

export { PluginBridge };

export default {
	...handler,
	// A page goes out as markdown when the request asks for it, and always with a Vary on Accept.
	async fetch(request, env, ctx) {
		if (!handler.fetch) throw new Error("the EmDash handler has no fetch");
		const antwoord = await handler.fetch(request, env, ctx);
		if (!isPagina(request, antwoord)) return antwoord;
		return wiltMarkdown(request.headers.get("Accept")) ? alsMarkdown(antwoord, request.url) : metVary(antwoord);
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
