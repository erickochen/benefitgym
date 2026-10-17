// A field with a sentence under it, for the three fields whose label cannot say what they do. The controls copy the
// classes of the admin's own controls, which its stylesheet carries, so the field looks like its neighbors.

export interface Veld {
	value: unknown;
	onChange: (value: unknown) => void;
	label: string;
	id: string;
	required?: boolean;
	options?: Array<{ value: string; label: string }> | Record<string, unknown>;
	validation?: Record<string, unknown>;
	minimal?: boolean;
}

type Soort = "getal" | "schakelaar" | "keuze";

// The field id the editor hands out is the slug with this in front.
const VELD = "field-";
// The sentence plus the control per field, by slug. A field this list lacks gets a plain text input.
const UITLEG: Record<string, { soort: Soort; zin: string }> = {
	volgorde: { soort: "getal", zin: "Een laag getal staat bovenaan. Tel in tientallen, dan past er later iets tussen." },
	vol: {
		soort: "schakelaar",
		zin: "Aan: op de site staat bij deze groep Wachtlijst in plaats van Plek vrij.",
	},
	soort: {
		soort: "keuze",
		zin: "Een vraag klapt open op zijn vraag. Een inleiding toont alleen de tekst, zonder vraag erboven.",
	},
};
const OPTIONEEL = "(optional)";

const LABEL = "m-0 select-none text-base font-medium text-kumo-default";
// The label of a compact row, as the editor draws it.
const LABEL_KLEIN = "text-kumo-subtle/50 text-xs font-normal";
const ZIN = "text-sm leading-snug text-kumo-subtle col-span-full";
const INVOER =
	"border-0 bg-kumo-control text-kumo-default ring ring-kumo-line outline-none focus:outline-none kumo-input-placeholder disabled:text-kumo-disabled h-9 gap-1.5 rounded-lg px-3 text-base focus:ring-kumo-focus/50 focus:ring-[1.5px]";
const KEUZE =
	"flex w-max items-center select-none appearance-none border-0 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand cursor-pointer h-9 gap-1.5 rounded-lg px-3 pr-9 text-base bg-kumo-base text-kumo-default ring ring-kumo-line font-normal focus:ring-kumo-focus/50";
const PIJLTJE = "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-kumo-subtle";
const SCHAKELAAR =
	"relative inline-flex items-center ring cursor-pointer border-none p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand transition-colors duration-150 ease-out motion-reduce:transition-none h-4.5 w-9 rounded-[5px] supports-[corner-shape:squircle]:rounded-[10px] [corner-shape:squircle]";
const SCHAKELAAR_UIT = "bg-neutral-200 dark:bg-neutral-700 ring-neutral-300 dark:ring-neutral-600";
const SCHAKELAAR_AAN = "bg-blue-500 dark:bg-blue-600 ring-blue-600 dark:ring-blue-500";
const KNOP =
	"absolute top-0 bottom-0 shadow-[0_0_1px_0.5px_var(--color-kumo-shadow-edge),0_1px_2px_var(--color-kumo-shadow-drop)] w-4.5 rounded-[5px] supports-[corner-shape:squircle]:rounded-[10px] [corner-shape:squircle] bg-kumo-base transition-all duration-150 ease-out motion-reduce:transition-none";
const KNOP_UIT = "left-0 dark:bg-neutral-850";
const KNOP_AAN = "left-4.5 dark:bg-blue-300";
// The caret of the admin's own select.
const CARET =
	"M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z";

function Zin({ id, zin }: { id: string; zin: string }) {
	return (
		<p id={id} className={ZIN}>
			{zin}
		</p>
	);
}

export function Uitleg({ value, onChange, label, id, required, options, minimal }: Veld) {
	const slug = id.startsWith(VELD) ? id.slice(VELD.length) : id;
	const uitleg = UITLEG[slug];
	const zinId = `${id}-uitleg`;
	const labelKlasse = minimal ? LABEL_KLEIN : LABEL;
	const beschrijving = uitleg && !minimal ? zinId : undefined;
	const zin = uitleg && !minimal ? <Zin id={zinId} zin={uitleg.zin} /> : null;

	if (uitleg?.soort === "schakelaar") {
		const aan = value === true;
		return (
			<div className="grid gap-2">
				<div className="flex items-center gap-2">
					<button
						type="button"
						id={id}
						role="switch"
						aria-checked={aan}
						aria-describedby={beschrijving}
						onClick={() => onChange(!aan)}
						className={`${SCHAKELAAR} ${aan ? SCHAKELAAR_AAN : SCHAKELAAR_UIT}`}
					>
						<span className={`${KNOP} ${aan ? KNOP_AAN : KNOP_UIT}`} />
					</button>
					<label htmlFor={id} className={labelKlasse}>
						{label}
					</label>
				</div>
				{zin}
			</div>
		);
	}

	if (uitleg?.soort === "keuze") {
		const keuzes = Array.isArray(options) ? options : [];
		const huidig = typeof value === "string" ? value : "";
		return (
			<div className="grid gap-2">
				<label htmlFor={id} className={labelKlasse}>
					{label}
				</label>
				<div className="relative w-fit">
					<select
						id={id}
						className={KEUZE}
						value={huidig}
						required={required}
						aria-describedby={beschrijving}
						onChange={(e) => onChange(e.target.value)}
					>
						{!keuzes.some((k) => k.value === huidig) && <option value="" disabled hidden />}
						{keuzes.map((k) => (
							<option key={k.value} value={k.value}>
								{k.label}
							</option>
						))}
					</select>
					<span aria-hidden="true" className={PIJLTJE}>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
							<path d={CARET} />
						</svg>
					</span>
				</div>
				{zin}
			</div>
		);
	}

	const getal = uitleg?.soort === "getal";
	return (
		<div className="grid gap-2">
			<label htmlFor={id} className={labelKlasse}>
				<span className="inline-flex items-center gap-1">
					<span>{label}</span>
					{!required && <span className="font-normal text-kumo-subtle">{OPTIONEEL}</span>}
				</span>
			</label>
			<input
				id={id}
				type={getal ? "number" : "text"}
				step={getal ? "1" : undefined}
				className={INVOER}
				value={getal ? (typeof value === "number" ? value : "") : typeof value === "string" ? value : ""}
				required={required}
				aria-describedby={beschrijving}
				onChange={(e) => onChange(getal ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
			/>
			{zin}
		</div>
	);
}
