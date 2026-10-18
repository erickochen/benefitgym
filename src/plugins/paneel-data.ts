// What the admin pages of the site read and write through the API of EmDash, with the session of the signed in user.
// One load serves the dashboard cards and the page Vindbaarheid together.
import { apiFetch } from "emdash/plugin-utils";
import { useEffect, useState } from "react";
import type { CollectieInfo, Item, MenuItem, Seo } from "./vindbaarheid-regels";
import { ZOEKMACHINES_ID } from "./zoekmachines-id.mjs";

export const ADMIN = "/_emdash/admin";
export const API = "/_emdash/api";
// The route that serves a media file; the SEO panel stores an image as this path plus its key.
export const MEDIA_PAD = "/_emdash/api/media/file/";
export const FOUT = "De gegevens konden niet geladen worden.";
// The largest page the list route hands out.
const PER_KEER = 100;
// The image picker shows this many at a time.
export const MEDIA_PER_KEER = 6;
// Cards that mount together share one load; a later visit loads again.
const DEEL_MS = 5000;
const MENU = "primary";

export interface Instellingen {
	title?: string;
	tagline?: string;
	favicon?: { url?: string } | null;
	seo?: {
		titleSeparator?: string;
		defaultOgImage?: { mediaId: string; url?: string } | null;
		robotsTxt?: string;
		disallowAiTraining?: boolean;
		googleVerification?: string;
		bingVerification?: string;
	};
}

export interface Medium {
	id: string;
	filename: string;
	mimeType: string;
	width?: number | null;
	height?: number | null;
	alt?: string | null;
	storageKey: string;
}

export interface Slot {
	enabled: boolean;
	holder: { userId: string; userName: string | null } | null;
	heldByCaller: boolean;
}

export interface IndexNowStatus {
	actief: boolean;
	reden: "andere-host" | "geen-sleutel" | "te-snel" | null;
	laatste: { pad: string; tijd: string; status: number | "fout" } | null;
	geslaagd: boolean | null;
}

export interface Lading {
	collecties: Record<string, CollectieInfo>;
	items: Record<string, Item[]>;
	// Null when the menu or the settings did not load, for instance for a role that may not read the settings; the
	// dashboard cards work on without them.
	menu: MenuItem[] | null;
	instellingen: Instellingen | null;
}

// A failure keeps the code of EmDash; vanServer says whether the message is the server's own words or only its
// status line.
export type Antwoord<T> =
	| { ok: true; data: T }
	| { ok: false; code: string; melding: string; vanServer: boolean; details?: Record<string, unknown> };

// The code for a request that never got an answer.
const NETWERK = "NETWERK";

interface Envelop<T> {
	success?: boolean;
	data?: T;
	error?: { code?: string; message?: string; details?: Record<string, unknown> };
}

// A call to the API, with the envelope of EmDash unpacked and the error code kept. Every route answers JSON, so an
// answer without it counts as a failure too.
export async function aanroep<T>(pad: string, init: RequestInit = {}): Promise<Antwoord<T>> {
	const headers = new Headers(init.headers);
	if (typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
	let r: Response;
	try {
		r = await apiFetch(`${API}${pad}`, { ...init, headers });
	} catch (e) {
		return { ok: false, code: NETWERK, melding: e instanceof Error ? e.message : NETWERK, vanServer: false };
	}
	const j = (await r.json().catch(() => null)) as Envelop<T> | null;
	if (!r.ok || !j || j.success === false) {
		const boodschap = j?.error?.message;
		return {
			ok: false,
			code: j?.error?.code ?? String(r.status),
			// HTTP/2 carries no reason phrase, so the status line is often the number alone.
			melding: boodschap ?? `HTTP ${r.status} ${r.statusText}`.trim(),
			vanServer: Boolean(boodschap),
			details: j?.error?.details,
		};
	}
	return { ok: true, data: (j.data ?? j) as T };
}

// A read for the load: the server's own message, else the message of the dashboard.
async function lees<T>(pad: string): Promise<T> {
	const r = await aanroep<T>(pad);
	if (!r.ok) throw new Error(r.vanServer ? r.melding : FOUT);
	return r.data;
}

async function itemsVan(collectie: string): Promise<Item[]> {
	const uit: Item[] = [];
	let cursor: string | undefined;
	do {
		const vervolg = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
		const deel = await lees<{ items: Item[]; nextCursor?: string | null }>(
			`/content/${collectie}?status=all&limit=${PER_KEER}${vervolg}`,
		);
		uit.push(...deel.items);
		cursor = deel.nextCursor ?? undefined;
	} while (cursor);
	return uit;
}

// Every collection the sidebar shows with all its entries, plus menu primary and the settings.
async function laadAlles(): Promise<Lading> {
	const [manifest, menu, instellingen] = await Promise.all([
		lees<{ collections: Record<string, CollectieInfo> }>("/manifest"),
		lees<{ items: MenuItem[] }>(`/menus/${MENU}`).catch(() => null),
		lees<Instellingen>("/settings").catch(() => null),
	]);
	const zichtbaar = Object.entries(manifest.collections).filter(([, c]) => !c.hidden);
	const items = Object.fromEntries(
		await Promise.all(zichtbaar.map(async ([slug]) => [slug, await itemsVan(slug)] as const)),
	);
	return { collecties: Object.fromEntries(zichtbaar), items, menu: menu?.items ?? null, instellingen };
}

let gedeeld: { belofte: Promise<Lading>; sinds: number } | null = null;

export function lading(vers = false): Promise<Lading> {
	const nu = Date.now();
	if (!vers && gedeeld && nu - gedeeld.sinds <= DEEL_MS) return gedeeld.belofte;
	const belofte = laadAlles();
	gedeeld = { belofte, sinds: nu };
	// A failed load is not kept, so the next card loads again instead of repeating the error.
	belofte.catch(() => {
		if (gedeeld?.belofte === belofte) gedeeld = null;
	});
	return belofte;
}

// The shared load; herlaad fetches fresh, and the old data stays on screen until the new data or an error lands.
export function useLading(): { lading: Lading | null; fout: string | null; herlaad: () => void } {
	const [staat, setStaat] = useState<{ lading: Lading | null; fout: string | null }>({ lading: null, fout: null });
	const [ronde, setRonde] = useState(0);
	useEffect(() => {
		let actief = true;
		lading(ronde > 0).then(
			(l) => actief && setStaat({ lading: l, fout: null }),
			(e: unknown) => actief && setStaat({ lading: null, fout: e instanceof Error ? e.message : FOUT }),
		);
		return () => {
			actief = false;
		};
	}, [ronde]);
	return { ...staat, herlaad: () => setRonde((r) => r + 1) };
}

export const bewerkPad = (collectie: string, id: string) => `${ADMIN}/content/${collectie}/${id}`;

export const haal = (collectie: string, id: string) =>
	aanroep<{ item: Item; _rev?: string }>(`/content/${collectie}/${id}`);

export const bewaar = (
	collectie: string,
	id: string,
	body: { _rev?: string; seo?: Seo; data?: Record<string, unknown> },
) =>
	aanroep<{ item: Item; _rev?: string }>(`/content/${collectie}/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const publiceer = (collectie: string, id: string, _rev?: string) =>
	aanroep<{ item: Item }>(`/content/${collectie}/${id}/publish`, { method: "POST", body: JSON.stringify({ _rev }) });

export const vergrendel = (collectie: string, id: string, token: string) =>
	aanroep<Slot>(`/content/${collectie}/${id}/lock`, {
		method: "POST",
		body: JSON.stringify({ takeover: false, token }),
	});

// keepalive lets the release outlive the page, for a strip that closes with the tab.
export const ontgrendel = (collectie: string, id: string, token: string, keepalive = false) =>
	aanroep<{ released: boolean }>(`/content/${collectie}/${id}/lock?token=${encodeURIComponent(token)}`, {
		method: "DELETE",
		keepalive,
	});

export const bewaarInstellingen = (wens: Record<string, unknown>) =>
	aanroep<Instellingen>("/settings", { method: "POST", body: JSON.stringify(wens) });

export const laadMedia = (cursor?: string | null) =>
	aanroep<{ items: Medium[]; nextCursor?: string | null }>(
		`/media?limit=${MEDIA_PER_KEER}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
	);

export async function uploadMedia(bestand: File, alt: string): Promise<Antwoord<Medium>> {
	const form = new FormData();
	form.append("file", bestand);
	form.append("alt", alt);
	const r = await aanroep<{ item?: Medium } & Partial<Medium>>("/media", { method: "POST", body: form });
	if (!r.ok) return r;
	return { ok: true, data: r.data.item ?? (r.data as Medium) };
}

export const indexNowStatus = () =>
	aanroep<IndexNowStatus>(`/plugins/${ZOEKMACHINES_ID}/status`, { method: "POST", body: "{}" });
