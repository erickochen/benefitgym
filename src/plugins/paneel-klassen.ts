// The classes the admin's own screens use, which its prebuilt stylesheet carries, so a card or a field of the site
// looks like its neighbors. check_paneelklassen.mjs in emdash/ reads every string here back in that stylesheet.

export const BADGE =
	"inline-flex w-fit flex-none shrink-0 items-center justify-self-start rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";
// The colors of the admin's own status badges.
export const GROEN = "bg-kumo-success-tint/70 text-kumo-success";
export const ORANJE = "bg-kumo-warning-tint/70 text-kumo-warning";
export const BLAUW = "bg-kumo-info-tint/70 text-kumo-info";
export const GRIJS = "bg-kumo-fill text-kumo-badge-neutral-subtle";

// The cells are tighter than in the admin's own lists and stay on one line.
export const CEL = "px-3 py-2";
export const DATUM = "px-3 py-2 whitespace-nowrap text-sm text-kumo-subtle";
export const KOP = "px-3 py-2 text-start text-sm font-medium";
export const SOORT = "px-3 pt-4 pb-1 text-start text-xs font-medium uppercase tracking-wide text-kumo-subtle";
export const MELDING = "px-3 text-sm leading-6 text-kumo-subtle";
export const REGEL = "px-3 text-sm leading-5";
export const KNOP =
	"inline-flex items-center justify-center rounded-md border bg-kumo-base px-3 py-2 text-sm font-medium transition-colors hover:bg-kumo-tint/50 disabled:opacity-50";
export const LINK = "font-medium hover:text-kumo-link";
// The title of the admin's own list screens.
export const PAGINA_KOP = "text-2xl font-semibold leading-tight";

// The primary button of Kumo: its classes, the two colors it sets inline, the gradient layer plus the layer of the
// label above it.
export const KNOP_PRIMAIR =
	"group flex w-max shrink-0 items-center font-medium select-none border-0 shadow-xs focus:outline-none focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand cursor-pointer disabled:cursor-not-allowed disabled:text-kumo-subtle h-9 gap-1.5 rounded-lg px-3 text-base relative overflow-hidden bg-(--kumo-button-emphasis-bg) !text-white ring ring-(--kumo-button-emphasis-ring) disabled:opacity-50";
export const KNOP_PRIMAIR_KLEUR: Record<string, string> = {
	"--kumo-button-emphasis-ring": "color-mix(in oklch, var(--color-kumo-brand), black 10%)",
	"--kumo-button-emphasis-bg": "color-mix(in oklch, var(--color-kumo-brand), white 30%)",
	"--kumo-button-emphasis-gradient-start": "color-mix(in oklch, var(--color-kumo-brand), white 15%)",
	"--kumo-button-emphasis-gradient-end": "var(--color-kumo-brand)",
};
export const KNOP_PRIMAIR_VERLOOP =
	"absolute inset-0 rounded-[inherit] bg-linear-to-b from-(--kumo-button-emphasis-gradient-start) to-(--kumo-button-emphasis-gradient-end) translate-y-px group-hover:from-(--kumo-button-emphasis-bg)";
export const KNOP_PRIMAIR_INHOUD = "relative flex items-center gap-1.5";
export const KNOP_UIT = "cursor-not-allowed opacity-50";

export const LABEL = "m-0 select-none text-base font-medium text-kumo-default";
// The label of a compact row, as the editor draws it.
export const LABEL_KLEIN = "text-kumo-subtle/50 text-xs font-normal";
export const ZIN = "text-sm leading-snug text-kumo-subtle col-span-full";
export const INVOER =
	"border-0 bg-kumo-control text-kumo-default ring ring-kumo-line outline-none focus:outline-none kumo-input-placeholder h-9 gap-1.5 rounded-lg px-3 text-base focus:ring-kumo-focus/50 focus:ring-[1.5px]";
// The text area of Kumo: the input with an automatic height plus room above and below.
export const TEKSTVAK =
	"border-0 bg-kumo-control text-kumo-default ring ring-kumo-line outline-none focus:outline-none kumo-input-placeholder gap-1.5 rounded-lg px-3 text-base focus:ring-kumo-focus/50 focus:ring-[1.5px] h-auto py-2";
export const KEUZE =
	"flex w-max items-center select-none appearance-none border-0 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand cursor-pointer h-9 gap-1.5 rounded-lg px-3 pr-9 text-base bg-kumo-base text-kumo-default ring ring-kumo-line font-normal focus:ring-kumo-focus/50";
export const PIJLTJE =
	"pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-kumo-subtle";
export const SCHAKELAAR =
	"relative inline-flex items-center ring cursor-pointer border-none p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand transition-colors duration-150 ease-out motion-reduce:transition-none h-4.5 w-9 rounded-[5px] supports-[corner-shape:squircle]:rounded-[10px] [corner-shape:squircle]";
export const SCHAKELAAR_UIT = "bg-neutral-200 dark:bg-neutral-700 ring-neutral-300 dark:ring-neutral-600";
export const SCHAKELAAR_AAN = "bg-blue-500 dark:bg-blue-600 ring-blue-600 dark:ring-blue-500";
export const SCHAKELAAR_KNOP =
	"absolute top-0 bottom-0 shadow-[0_0_1px_0.5px_var(--color-kumo-shadow-edge),0_1px_2px_var(--color-kumo-shadow-drop)] w-4.5 rounded-[5px] supports-[corner-shape:squircle]:rounded-[10px] [corner-shape:squircle] bg-kumo-base transition-all duration-150 ease-out motion-reduce:transition-none";
export const SCHAKELAAR_KNOP_UIT = "left-0";
export const SCHAKELAAR_KNOP_AAN = "left-4.5 dark:bg-blue-300";
// The caret of the admin's own select, an SVG path and no class.
export const CARET =
	"M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z";
