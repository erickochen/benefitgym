/* A form of the forms plugin: the browser checks every field with the Dutch message of the field, then the form goes
as JSON to the submit route with its files as base64 plus the Turnstile token. The button turns a ring while it goes
and shows the confirmation from the panel once it arrived. */

// The answer of the submit route, as the plugin's own client reads it.
interface Antwoord {
	success?: boolean;
	message?: string;
	errors?: { field: string; message: string }[];
}

const TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// How long a send waits for Turnstile to hand its token over, unless Turnstile asks the visitor something.
const TOKEN_WACHT = 10000;
const TOKEN_STAP = 100;
// The width of the normal widget; a narrower form gets the compact one.
const TURNSTILE_BREED = 300;
// A file without a type goes as plain bytes; String.fromCharCode takes this many characters at once.
const BINAIR = "application/octet-stream";
const STUK = 0x8000;

interface Bestand {
	filename: string;
	contentType: string;
	bytes: string;
}

function naarBase64(bytes: Uint8Array): string {
	let binair = "";
	for (let i = 0; i < bytes.length; i += STUK) binair += String.fromCharCode(...bytes.subarray(i, i + STUK));
	return btoa(binair);
}

interface Turnstile {
	render(element: HTMLElement, opties: Record<string, unknown>): string;
	reset(widget: string): void;
}
let turnstileLaden: Promise<Turnstile> | null = null;
function laadTurnstile(): Promise<Turnstile> {
	const w = window as unknown as { turnstile?: Turnstile };
	if (w.turnstile) return Promise.resolve(w.turnstile);
	turnstileLaden ??= new Promise((klaar, mis) => {
		const script = document.createElement("script");
		script.src = TURNSTILE;
		script.async = true;
		script.onload = () => (w.turnstile ? klaar(w.turnstile) : mis(new Error("geen turnstile")));
		script.onerror = () => {
			turnstileLaden = null;
			mis(new Error("turnstile laadt niet"));
		};
		document.head.appendChild(script);
	});
	return turnstileLaden;
}

type Invoer = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function zetFormulier(form: HTMLFormElement, meldingen: Record<string, string>, teksten: { mis: string }) {
	const knop = form.querySelector<HTMLButtonElement>(".formulier-knop");
	const label = knop?.querySelector<HTMLElement>(".formulier-knop-tekst");
	// A screen reader hears the confirmation here, since a button that changes its text says nothing.
	const status = form.querySelector<HTMLElement>(".formulier-status");
	const verstuur = label?.textContent ?? "";
	// The text style of a message, the small one of the form.
	const stijl = form.dataset.fout ?? "";
	// Under the worker types the field types do not fit Element as a query type, so the query goes through HTMLElement.
	const invoer = () =>
		([...form.querySelectorAll<HTMLElement>("input, textarea, select")] as unknown as Invoer[]).filter(
			(e) => e.type !== "hidden" && Boolean(e.name),
		);

	// The part a field's message hangs in: its own field, or the fieldset of a choice of tiles.
	const deelVan = (veld: Invoer) =>
		veld.closest<HTMLElement>(".formulier-keuze, .formulier-veld") ?? veld.parentElement;
	const foutId = (veld: Invoer) => `${form.dataset.formulier}-${veld.name}-fout`;
	const melding = (veld: Invoer) => meldingen[veld.name] ?? veld.validationMessage;

	// The first message in the form is the one a screen reader announces.
	const kondig = () => {
		const fouten = [...form.querySelectorAll<HTMLElement>(".formulier-fout:not(.formulier-mis)")];
		fouten.forEach((p, i) => (i === 0 ? p.setAttribute("role", "alert") : p.removeAttribute("role")));
	};
	const toon = (veld: Invoer, tekst: string) => {
		const deel = deelVan(veld);
		if (!deel) return;
		const id = foutId(veld);
		let p = document.getElementById(id);
		if (!p) {
			p = document.createElement("p");
			p.id = id;
			p.className = `formulier-fout ${stijl}`;
			deel.appendChild(p);
		}
		p.textContent = tekst;
		deel.classList.add("fout");
		for (const v of radioGroep(veld)) {
			v.setAttribute("aria-invalid", "true");
			v.setAttribute("aria-describedby", [v.dataset.hulp, id].filter(Boolean).join(" "));
		}
	};
	const wis = (veld: Invoer) => {
		document.getElementById(foutId(veld))?.remove();
		deelVan(veld)?.classList.remove("fout");
		for (const v of radioGroep(veld)) {
			v.removeAttribute("aria-invalid");
			if (v.dataset.hulp) v.setAttribute("aria-describedby", v.dataset.hulp);
			else v.removeAttribute("aria-describedby");
		}
	};
	// A choice of tiles is one field: its message sits on one dot, the choice on another.
	const radioGroep = (veld: Invoer): Invoer[] =>
		veld instanceof HTMLInputElement && veld.type === "radio" ? invoer().filter((v) => v.name === veld.name) : [veld];

	const keur = (veld: Invoer) => {
		for (const v of radioGroep(veld)) v.setCustomValidity("");
		if (veld.validity.valid) {
			wis(veld);
			kondig();
			return;
		}
		if (meldingen[veld.name]) veld.setCustomValidity(meldingen[veld.name]);
	};

	// The browser fires invalid on each field that fails as the form is sent.
	form.addEventListener(
		"invalid",
		(e) => {
			const veld = e.target as Invoer;
			if (meldingen[veld.name]) veld.setCustomValidity(meldingen[veld.name]);
			toon(veld, melding(veld));
			kondig();
		},
		true,
	);
	form.addEventListener("input", (e) => {
		const veld = e.target as Invoer;
		if (!veld.name) return;
		terug();
		if (deelVan(veld)?.classList.contains("fout")) keur(veld);
		else for (const v of radioGroep(veld)) v.setCustomValidity("");
	});
	form.addEventListener("change", (e) => {
		const veld = e.target as Invoer;
		if (veld.name && deelVan(veld)?.classList.contains("fout")) keur(veld);
	});
	form.addEventListener("focusout", (e) => {
		const veld = e.target as Invoer;
		if (veld.name && deelVan(veld)?.classList.contains("fout")) keur(veld);
	});

	// The button: Verstuur, a turning ring while sending, then the confirmation until a field changes.
	const zetKnop = (stand: "rust" | "bezig" | "klaar", tekst = verstuur) => {
		if (!knop || !label) return;
		knop.classList.toggle("bezig", stand === "bezig");
		if (stand === "bezig") knop.setAttribute("aria-busy", "true");
		else knop.removeAttribute("aria-busy");
		label.textContent = tekst;
		if (status) status.textContent = stand === "klaar" ? tekst : "";
	};
	let klaar = false;
	// A field that changes while the form goes makes the answer stale, so the button does not confirm it.
	let gewijzigd = false;
	const terug = () => {
		form.querySelector(".formulier-mis")?.remove();
		if (bezig) gewijzigd = true;
		if (!klaar) return;
		klaar = false;
		zetKnop("rust");
	};
	const mis = () => {
		zetKnop("rust");
		if (!knop || form.querySelector(".formulier-mis")) return;
		const p = document.createElement("p");
		p.className = `formulier-fout formulier-mis ${stijl}`;
		p.setAttribute("role", "alert");
		p.textContent = teksten.mis;
		knop.insertAdjacentElement("afterend", p);
	};

	// Turnstile only shows when it has something to ask.
	const vak = form.querySelector<HTMLElement>(".formulier-turnstile");
	let token = "";
	// The box joins the form once Turnstile asks and keeps its place until the next challenge.
	let vraagt = false;
	// A token holds for one send, so after each send the widget fetches a fresh one.
	let vernieuw = () => {};
	if (vak?.dataset.sitekey) {
		laadTurnstile()
			.then((t) => {
				const widget = t.render(vak, {
					sitekey: vak.dataset.sitekey,
					appearance: "interaction-only",
					size: form.clientWidth < TURNSTILE_BREED ? "compact" : "normal",
					"refresh-expired": "auto",
					callback: (waarde: string) => (token = waarde),
					"expired-callback": () => (token = ""),
					"before-interactive-callback": () => {
						vraagt = true;
						vak.classList.add("vraagt");
					},
					"after-interactive-callback": () => (vraagt = false),
					// A challenge that fails or runs out of time asks nothing, so a waiting send falls back to its limit.
					"timeout-callback": () => (vraagt = false),
					"error-callback": () => (vraagt = false),
				});
				vernieuw = () => {
					token = "";
					vraagt = false;
					vak.classList.remove("vraagt");
					t.reset(widget);
				};
			})
			.catch(() => {});
	}
	const wachtOpToken = async () => {
		if (!vak?.dataset.sitekey) return true;
		for (let gewacht = 0; !token && (vraagt || gewacht < TOKEN_WACHT); gewacht += vraagt ? 0 : TOKEN_STAP)
			await new Promise((r) => setTimeout(r, TOKEN_STAP));
		return Boolean(token);
	};

	let bezig = false;
	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		// A form that went or arrived waits for a change before it goes again.
		if (bezig || klaar) return;
		bezig = true;
		gewijzigd = false;
		form.querySelector(".formulier-mis")?.remove();
		zetKnop("bezig");
		try {
			if (!(await wachtOpToken())) throw new Error("geen token");
			const data: Record<string, unknown> = {};
			const files: Record<string, Bestand> = {};
			let formId = "";
			for (const [naam, waarde] of new FormData(form)) {
				if (typeof waarde !== "string") {
					// An empty file input still sends a file without a name or bytes.
					if (waarde.size > 0) {
						const bytes = naarBase64(new Uint8Array(await waarde.arrayBuffer()));
						files[naam] = { filename: waarde.name, contentType: waarde.type || BINAIR, bytes };
					}
				} else if (naam === "formId") formId = waarde;
				else if (naam in data) data[naam] = [...([] as unknown[]).concat(data[naam]), waarde];
				else data[naam] = waarde;
			}
			if (token) data["cf-turnstile-response"] = token;
			const verzoek = fetch(form.action, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(Object.keys(files).length ? { formId, data, files } : { formId, data }),
			});
			if (token) vernieuw();
			const r = await verzoek;
			const body = (await r.json().catch(() => ({}))) as { data?: Antwoord } & Antwoord;
			const antwoord = body.data ?? body;
			if (antwoord.success) {
				if (gewijzigd) {
					zetKnop("rust");
					return;
				}
				klaar = true;
				zetKnop("klaar", antwoord.message || verstuur);
				return;
			}
			// A field the plugin refuses gets its own message; anything else is one line below the button.
			const velden = (antwoord.errors ?? []).flatMap((f) =>
				invoer()
					.filter((v) => v.name === f.field)
					.slice(0, 1),
			);
			if (!velden.length || velden.some((v) => !meldingen[v.name])) throw new Error("onbekende fout");
			zetKnop("rust");
			for (const v of velden) toon(v, meldingen[v.name]);
			kondig();
		} catch {
			mis();
		} finally {
			bezig = false;
		}
	});
}
