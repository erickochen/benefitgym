// A field with a sentence under it, for the three fields whose label cannot say what they do. The controls copy the
// classes of the admin's own controls, which its stylesheet carries, so the field looks like its neighbors.
import {
	CARET,
	INVOER,
	KEUZE,
	LABEL,
	LABEL_KLEIN,
	PIJLTJE,
	SCHAKELAAR,
	SCHAKELAAR_AAN,
	SCHAKELAAR_KNOP,
	SCHAKELAAR_KNOP_AAN,
	SCHAKELAAR_KNOP_UIT,
	SCHAKELAAR_UIT,
	ZIN,
} from "./paneel-klassen";

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
						<span className={`${SCHAKELAAR_KNOP} ${aan ? SCHAKELAAR_KNOP_AAN : SCHAKELAAR_KNOP_UIT}`} />
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
