// The schedule of SportBit: the ids its script looks for, the class names of the block plus the CSS that dresses its
// HTML in the letters plus colors of the site. SportBit sets everything to all: unset, so a doubled id wins.

// The SportBit environment of the gym, for a block that leaves its address empty.
export const ADRES = "https://elitebenefitgym.sportbitapp.nl/";

// SportBit fills the box with this id, so a page holds one; its popup hangs on the body under the second.
export const ROOSTER_ID = "sportbit-rooster";
export const VENSTER_ID = "sportbit-popup";

export const HOUDER = "praktisch-lesrooster";
export const VAK = `${HOUDER}-vak`;
// The line for a loading, failed or second schedule.
export const STAND = `${HOUDER}-stand`;
export const LINK = `${HOUDER}-link`;
// The line for a week without lessons to come.
export const LEEG = `${HOUDER}-leeg`;
// The week a screen reader hears after a week change.
export const MELDING = `${HOUDER}-melding`;

const REGULAR = '"Interstate Regular", "Interstate Regular Placeholder", sans-serif';
const BOLD = '"Interstate Bold", "Interstate Bold Placeholder", sans-serif';
const BLACK_CURSIEF = '"Interstate BlackItalic", "Interstate BlackItalic Placeholder", sans-serif';

const WIT = "rgb(255, 255, 255)";
const GRIJS = "rgb(46, 46, 46)";
const GRIJS_ZACHT = "rgba(46, 46, 46, 0.8)";
const DONKER = "rgb(26, 26, 26)";
const ORANJE = "rgb(236, 110, 29)";
// The tiles plus the pills, a little lighter than SportBit draws them.
const VLAK = "rgb(242, 242, 242)";
// The thin line of the tables under Praktisch.
const LIJN = "rgba(46, 46, 46, 0.2)";

// The tap target of the whole site, plus the sign-up button.
const TIK = 44;
const KNOP_HOOG = 48;
const RONDING = 999;
const VENSTER_RONDING = 8;
const FOCUS_DIK = 3;
const FOCUS_AFSTAND = 3;
// The thick line under the week bar, as above a table.
const KOP_LIJN = 2;
const RUIMTE = 24;
const KLEIN_GAT = 8;
const PIL_RAND = 22;
const TEGEL_RAND = 10;
// SportBit keeps 40 free below a tile for counts this schedule leaves out.
const TEGEL_ONDER = 28;
const LIJST_INSPRING = 14;
// The room above a day in the list, where its name hangs, plus how far the name stands above the line of its day.
const DAG_RUIMTE = 44;
const DAG_LABEL = 32;
// A lesson that is over: faint but still readable.
const VOORBIJ = 0.45;

const KORPS_TEGEL = 13;
const REGEL_TEGEL = 18;
const KORPS_TRAINER = 12;
const KORPS_DAG = 15;
const KORPS_PIJL = 26;
const KORPS_KNOP = 16;
const KORPS_VENSTER = 15;
const KORPS_VENSTERKOP = 18;
// The running text of the site.
const KORPS_TEKST = 18;
const REGEL_TEKST = 1.444;

// Below this width of its own box seven columns get too narrow and the schedule becomes a list per day.
const LIJST_ONDER = 960;
// The width SportBit itself switches its popup on.
const TELEFOON = 750;

const R = `#${ROOSTER_ID}#${ROOSTER_ID} .embed-rooster`;
const P = `#${VENSTER_ID}#${VENSTER_ID}`;

export const LESROOSTER_CSS = `
.${HOUDER} { width: 100%; position: relative; container-type: inline-size; container-name: ${HOUDER}; }
.${LINK} { color: ${GRIJS}; font-family: ${BOLD}; text-decoration-color: ${ORANJE}; }
.${MELDING} { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
${R} { font-family: ${REGULAR}; color: ${GRIJS}; }
${R} .top { align-items: center; border-bottom: ${KOP_LIJN}px solid ${GRIJS}; padding-bottom: ${RUIMTE}px; margin-bottom: ${RUIMTE}px; }
${R} .top .today a { display: inline-flex; align-items: center; justify-content: center; width: auto; min-height: ${TIK}px; padding: 0 ${PIL_RAND}px; border-radius: ${RONDING}px; background-color: ${GRIJS}; color: ${WIT}; font: 400 ${KORPS_KNOP}px/1 ${BLACK_CURSIEF}; }
${R} .top .period { display: flex; align-items: center; justify-content: center; min-height: ${TIK}px; padding: 0 ${PIL_RAND}px; border-radius: ${RONDING}px; background-color: ${VLAK}; color: ${GRIJS}; font: 400 ${KORPS_DAG}px/1.2 ${BOLD}; }
${R} .top .week { display: flex; align-items: center; gap: ${KLEIN_GAT}px; width: auto; margin-right: 0; padding-top: 0; font: 400 ${KORPS_TEGEL}px/1 ${BOLD}; }
${R} .top .week span { color: ${GRIJS}; font-family: ${BOLD}; }
${R} .top .week a { display: flex; align-items: center; justify-content: center; width: ${TIK}px; height: ${TIK}px; margin: 0; padding: 0; border-radius: 50%; background-color: ${VLAK}; color: ${GRIJS}; font: 400 ${KORPS_PIJL}px/1 ${BOLD}; }
${R} .days { border-bottom: 1px solid ${LIJN}; padding-bottom: ${RUIMTE}px; margin-bottom: ${RUIMTE}px; }
${R} .days > div span { color: ${GRIJS}; }
${R} .days > div .day-name { font: 400 ${KORPS_DAG}px/1.3 ${BOLD}; }
${R} .days > div .day-month, ${R} .days > div .day-holiday { font: 400 ${KORPS_TEGEL}px/1.3 ${REGULAR}; }
${R} .sepparator { color: ${GRIJS}; font: 400 ${KORPS_TEGEL}px/50px ${BOLD}; text-transform: uppercase; }
${R} .calendar .items-day div.evtitem { background-color: ${VLAK}; padding: ${TEGEL_RAND}px ${TEGEL_RAND}px ${TEGEL_ONDER}px; }
${R} .calendar .items-day div.evtitem.gepasseerd { opacity: ${VOORBIJ}; }
${R} .calendar .items-day div.evtitem.gepasseerd::after { background-color: transparent; }
${R} .calendar .items-day div.evtitem span { font: 400 ${KORPS_TEGEL}px/${REGEL_TEGEL}px ${REGULAR}; color: ${GRIJS}; }
${R} .calendar .items-day div.evtitem span.title { font-family: ${BOLD}; width: 100%; }
${R} .calendar .items-day div.evtitem span.trainer { font-size: ${KORPS_TRAINER}px; color: ${GRIJS_ZACHT}; }
${R} .loading span { font-family: ${BOLD}; color: ${WIT}; }
${R} .loading .lds-dual-ring:after { border-color: ${ORANJE} transparent ${ORANJE} transparent !important; }
${R} [role="button"]:focus-visible { outline: ${FOCUS_DIK}px solid ${ORANJE}; outline-offset: ${FOCUS_AFSTAND}px; }
${R} .${LEEG} { display: none; }
@container ${HOUDER} (max-width: ${LIJST_ONDER - 1}px) {
  ${R} .days, ${R} .sepparator { display: none; }
  ${R} .${LEEG} { display: block; margin: 0; color: ${GRIJS}; font: 400 ${KORPS_TEKST}px/${REGEL_TEKST} ${REGULAR}; }
  ${R} .calendar .items-day:not(:has(.evtitem:not(.gepasseerd))) { display: none; }
  ${R} .calendar { flex-direction: column; padding-top: ${DAG_RUIMTE}px; }
  ${R} .calendar .items-day { width: 100%; position: relative; padding-top: ${KLEIN_GAT + KLEIN_GAT / 2}px; border-top: 1px solid ${LIJN}; margin-bottom: ${DAG_RUIMTE}px; }
  ${R} .calendar .items-day.gepasseerd { display: none; }
  ${R} .calendar .items-day::before { content: attr(data-dayname); position: absolute; top: -${DAG_LABEL}px; left: 0; font: 400 ${KORPS_DAG}px/1.3 ${BOLD}; color: ${GRIJS}; }
  ${R} .calendar .items-day[data-afwijkendRoosterdag]:not([data-afwijkendRoosterdag=""])::before { content: attr(data-dayname) " - " attr(data-afwijkendRoosterdag); }
  ${R} .calendar .items-day::after { content: attr(data-month); position: absolute; top: -${DAG_LABEL}px; right: 0; font: 400 ${KORPS_DAG}px/1.3 ${REGULAR}; color: ${GRIJS}; }
  ${R} .calendar .items-day div.ochtend, ${R} .calendar .items-day div.middag, ${R} .calendar .items-day div.avond { height: auto !important; }
  ${R} .calendar .items-day div.opvulling, ${R} .calendar .items-day div.evtitem.gepasseerd { display: none; }
  ${R} .calendar .items-day div.evtitem { padding: ${TEGEL_RAND}px ${TEGEL_RAND}px ${TEGEL_RAND}px ${LIJST_INSPRING}px; margin-bottom: ${KLEIN_GAT}px; }
  ${R} .calendar .items-day div.evtitem span.title { white-space: normal; overflow: visible; font-size: ${KORPS_DAG}px; }
}
${P} * { font-family: ${REGULAR}; color: ${GRIJS}; }
${P} [role="button"]:focus-visible, ${P} a:focus-visible { outline: ${FOCUS_DIK}px solid ${ORANJE}; outline-offset: ${FOCUS_AFSTAND}px; }
${P} .window { min-height: 0; border-radius: ${VENSTER_RONDING}px; overflow: hidden; }
${P} .window .window-img { display: none; }
${P} .window .window-top { background-color: ${GRIJS}; border-radius: 0; }
${P} .window .window-top h1 { color: ${WIT}; font: 400 ${KORPS_VENSTERKOP}px/1.3 ${BLACK_CURSIEF}; padding: ${RUIMTE}px ${TIK + RUIMTE}px ${RUIMTE}px ${RUIMTE}px; }
${P} .window .window-top a.window-close { display: flex; align-items: center; justify-content: center; width: ${TIK}px; height: ${TIK}px; right: ${KLEIN_GAT}px; color: ${WIT}; font: 400 ${KORPS_VENSTERKOP}px/1 ${BOLD}; }
${P} .window .info { padding: ${RUIMTE}px; margin-bottom: 0; }
${P} .window .info div, ${P} .window .info p { font-size: ${KORPS_VENSTER}px; line-height: 1.5; }
${P} .window .info .details strong { font-family: ${BOLD}; color: ${GRIJS}; }
${P} .window .btn { display: flex; align-items: center; justify-content: center; min-height: ${KNOP_HOOG}px; padding: 0 ${RUIMTE}px; border-radius: ${RONDING}px; background-color: ${ORANJE}; color: ${DONKER}; font: 400 ${KORPS_KNOP}px/1 ${BLACK_CURSIEF}; }
@media screen and (max-width: ${TELEFOON}px) {
  ${P} .window { min-height: 100%; border-radius: 0; }
}
`;
