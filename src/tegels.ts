// The tiles of the sign-up forms. A course date shows in the clock of Schijndel; a group by its weekday plus time.
// The value of a tile is what arrives in the mail.

const TIJDZONE = "Europe/Amsterdam";
const KORT = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "long", timeZone: TIJDZONE });
const VOLUIT = new Intl.DateTimeFormat("nl-NL", {
	weekday: "long",
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: TIJDZONE,
});
const KLOK = new Intl.DateTimeFormat("nl-NL", {
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
	timeZone: TIJDZONE,
});
// Midnight is a date without a time, not a night class.
const MIDDERNACHT = "00:00";
const DAGEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
// 17:00 or 17.00, the way people type it.
const TIJD = /^(\d{1,2})[:.](\d{2})$/;
const UREN = 24;
const MINUTEN = 60;

export interface DatumTegel {
	waarde: string;
	dag: string;
	tijd: string | null;
}

export interface GroepTegel {
	waarde: string;
	wanneer: string;
	leeftijd: string;
	vol: boolean;
}

// The dates of every course entry. A course holds its dates as rows; a row without a date has none.
export function cursusData(cursussen: { data: { datums?: { datum?: string | null }[] | null } }[]): string[] {
	return cursussen.flatMap((cursus) => (cursus.data.datums ?? []).flatMap((rij) => (rij.datum ? [rij.datum] : [])));
}

// The dates still to come, in order and without doubles; two dates within one minute show as one tile.
export function datumTegels(data: string[], nu: number): DatumTegel[] {
	const momenten = [...new Set(data.map((iso) => Date.parse(iso)).filter((ms) => Number.isFinite(ms) && ms > nu))].sort(
		(a, b) => a - b,
	);
	const tegels = momenten.map((ms) => {
		const moment = new Date(ms);
		const klok = KLOK.format(moment);
		const tijd = klok === MIDDERNACHT ? null : klok;
		return {
			waarde: tijd ? `${VOLUIT.format(moment)}, ${tijd}` : VOLUIT.format(moment),
			dag: KORT.format(moment),
			tijd,
		};
	});
	return [...new Map(tegels.map((tegel) => [tegel.waarde, tegel])).values()];
}

// A group with its weekday plus a tidy time. Without a known day nobody can pick it, so it has no tile.
export function groepTegel(
	groep: { dag?: string; tijd?: string; leeftijd?: string; vol?: boolean },
	sport: string,
): GroepTegel | null {
	const dag = (groep.dag ?? "").trim().toLowerCase();
	if (!DAGEN.includes(dag)) return null;
	const getikt = (groep.tijd ?? "").trim();
	const klok = TIJD.exec(getikt);
	const tijd =
		klok && Number(klok[1]) < UREN && Number(klok[2]) < MINUTEN ? `${klok[1].padStart(2, "0")}:${klok[2]}` : getikt;
	const leeftijd = (groep.leeftijd ?? "").trim();
	const wanneer = [dag, tijd].filter(Boolean).join(" ");
	return { waarde: [sport, wanneer, leeftijd].filter(Boolean).join(", "), wanneer, leeftijd, vol: groep.vol === true };
}
