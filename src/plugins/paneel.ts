// Two safety nets for the owner, through the save hook of EmDash. A collection the theme reads on one fixed slug
// refuses a second entry, because that entry would never show. A group takes its name from its sport, day plus time,
// so the list reads without its columns.
import {
	ContentSaveRejectedError,
	definePlugin,
	type ContentHookEvent,
	type ContentPolicyDecision,
	type ContentPolicyEvent,
	type PluginContext,
} from "emdash";
import { groepNaam } from "../tegels";
import { PANEEL_ID, PANEEL_VERSIE } from "./paneel-id.mjs";

// The collections with one entry, with the name the panel shows for them.
const EEN_ITEM: Record<string, string> = { home: "Home", over_ons: "Over ons", gegevens: "Gegevens" };
const GROEPEN = "groepen";
const NAAM = "naam";
// The fields the name is made of; a save that carries all three needs no stored entry.
const NAAM_VELDEN = ["sport", "dag", "tijd"];
// One stored entry is enough to refuse a new one.
const EEN = 1;
const GEPUBLICEERD = "published";

const melding = (label: string) =>
	`${label} heeft al een item en de site toont er maar één. Open het bestaande item om het aan te passen.`;
const GEEN_TOEGANG = "De controle op een tweede item kon niet draaien. Probeer het later opnieuw.";

async function voorOpslaan(event: ContentHookEvent, ctx: PluginContext): Promise<Record<string, unknown> | void> {
	// Content access comes with the capability; a context without it must not let a second entry through unchecked.
	const inhoud = ctx.content;
	if (event.isNew && event.collection in EEN_ITEM) {
		if (!inhoud) throw new ContentSaveRejectedError(GEEN_TOEGANG);
		const { items } = await inhoud.list(event.collection, { limit: EEN });
		if (items.length) throw new ContentSaveRejectedError(melding(EEN_ITEM[event.collection]));
	}
	if (event.collection === GROEPEN) return { ...event.content, ...(await naamVan(event, ctx)) };
}

// The field naam, from the fields of the save. The admin sends every field. A partial write from the API takes the
// rest from the stored entry, unless a pending draft may hold newer values. A site without the field gets none.
async function naamVan(event: ContentHookEvent, ctx: PluginContext): Promise<Record<string, string>> {
	const velden = (await ctx.schema?.getCollection(GROEPEN))?.fields ?? [];
	if (!velden.some((v) => v.slug === NAAM)) return {};
	let groep = event.content as { sport?: string; dag?: string; tijd?: string };
	if (!NAAM_VELDEN.every((k) => k in event.content)) {
		const opgeslagen = event.id && ctx.content ? await ctx.content.get(GROEPEN, event.id) : null;
		if (!opgeslagen || heeftConcept(opgeslagen)) return {};
		groep = { ...opgeslagen.data, ...event.content };
	}
	return { [NAAM]: groepNaam(groep) };
}

const heeftConcept = (item: { liveRevisionId?: string | null; draftRevisionId?: string | null }) =>
	Boolean(item.draftRevisionId && item.draftRevisionId !== item.liveRevisionId);

// Duplicating skips the save hook, so a copy of a single entry page can exist; it never goes live.
async function voorPubliceren(event: ContentPolicyEvent, ctx: PluginContext): Promise<ContentPolicyDecision> {
	if (!(event.collection in EEN_ITEM) || !ctx.content) return;
	const id = typeof event.content.id === "string" ? event.content.id : null;
	const { items } = await ctx.content.list(event.collection, { limit: EEN + 1, where: { status: GEPUBLICEERD } });
	if (items.some((item) => item.id !== id)) return { cancel: true, reason: melding(EEN_ITEM[event.collection]) };
}

export function createPlugin() {
	return definePlugin({
		id: PANEEL_ID,
		version: PANEEL_VERSIE,
		// EmDash registers a save hook only for a plugin with content:write (also a native one) and a publish hook
		// only with the content policy capability; the schema tells whether the field naam exists yet.
		capabilities: ["content:write", "hooks.content-policy:register", "schema:read"],
		hooks: { "content:beforeSave": voorOpslaan, "content:beforePublish": voorPubliceren },
	});
}
