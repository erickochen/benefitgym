import { getPublicPluginApiRouteHandler } from "emdash/plugin-utils";

// The field types of the forms plugin.
export type VeldType =
	| "text"
	| "email"
	| "textarea"
	| "number"
	| "tel"
	| "url"
	| "date"
	| "select"
	| "radio"
	| "checkbox"
	| "checkbox-group"
	| "file"
	| "hidden";

// A form of the forms plugin as its public definition route hands it out.
export interface Veld {
	type: VeldType;
	name: string;
	label: string;
	required: boolean;
	width?: "full" | "half";
	placeholder?: string;
	helpText?: string;
	defaultValue?: string;
	options?: { label: string; value: string }[];
	validation?: { minLength?: number; maxLength?: number; pattern?: string; accept?: string };
	// Shows the field only while another field holds a value; the page script reads it.
	condition?: { field: string; op: "eq" | "neq" | "filled" | "empty"; value?: string };
}

export interface Definitie {
	slug: string;
	status: string;
	pages: { fields: Veld[] }[];
	settings: { submitLabel: string; spamProtection: "none" | "honeypot" | "turnstile" };
	_turnstileSiteKey?: string | null;
}

export const ROUTE = "/_emdash/api/plugins/emdash-forms";
const PLUGIN = "emdash-forms";
// The names that turn a radio field into tiles from a collection.
export const DATUM = "datum";
export const GROEP = "groep";

// The definition through the plugin's own public route inside this worker, the way the plugin's component reads it.
// A paused or missing form gives nothing.
export async function definitieVan(slug: string, locals: App.Locals, adres: URL): Promise<Definitie | null> {
	const handler = getPublicPluginApiRouteHandler(locals);
	const verzoek = new Request(new URL(`${ROUTE}/definition`, adres), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id: slug }),
	});
	const antwoord = (await handler?.(PLUGIN, "POST", "/definition", verzoek).catch(() => null)) as
		| { success?: boolean; data?: Definitie }
		| null
		| undefined;
	return antwoord?.success && antwoord.data?.status === "active" ? antwoord.data : null;
}
