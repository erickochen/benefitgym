// A modal window to pick a share image from the media library or to add one. The picker of the admin is not
// importable, so this one reads the same media route.
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { KnopPrimair } from "./knop-primair";
import { FOUT, laadMedia, MEDIA_PAD, uploadMedia, type Medium } from "./paneel-data";
import { KNOP } from "./paneel-klassen";

const KLAAR = "ready";
const BEELD = /^image\//;

export const T = {
	zin: "Kies een beeld uit de bibliotheek of zet er een nieuw bij. 1200 bij 630 pixels werkt het best.",
	nuInGebruik: "nu in gebruik",
	meer: "Meer",
	uploaden: "Nieuw beeld uploaden",
	annuleren: "Annuleren",
	gebruik: "Gebruik dit beeld",
	laden: "Laden…",
	sluiten: "Sluiten",
	geenBeeld: "kies een beeld",
	// A server message ends in a full stop of its own, which the sentence already has.
	mislukt: (melding: string) => `Het uploaden is niet gelukt: ${melding.replace(/\.$/, "")}.`,
};

export const padVan = (m: Medium) => `${MEDIA_PAD}${m.storageKey}`;
// An upload that is still processed or broke off is no image to pick yet.
const bruikbaar = (m: Medium) => !m.status || m.status === KLAAR;

export function Beeldkiezer({
	titel,
	huidig,
	alt,
	onKies,
	onSluit,
}: {
	titel: string;
	huidig: string | null;
	alt: string;
	onKies: (m: Medium) => void;
	onSluit: () => void;
}) {
	const [items, setItems] = useState<Medium[]>([]);
	const [cursor, setCursor] = useState<string | null | undefined>(undefined);
	const [gekozen, setGekozen] = useState<Medium | null>(null);
	const [fout, setFout] = useState<string | null>(null);
	const [bezig, setBezig] = useState(false);
	const [laadt, setLaadt] = useState(false);
	const venster = useRef<HTMLDialogElement>(null);
	const bestand = useRef<HTMLInputElement>(null);
	const raster = useRef<HTMLDivElement>(null);
	const uploadKnop = useRef<HTMLButtonElement>(null);
	// Where the press began, so a drag that ends on the backdrop does not close the window.
	const drukOp = useRef<EventTarget | null>(null);
	const geopend = useRef(true);

	async function laad(vanaf?: string | null) {
		setLaadt(true);
		const r = await laadMedia(vanaf);
		setLaadt(false);
		if (!r.ok) return setFout(FOUT);
		const beelden = r.data.items.filter(bruikbaar);
		setItems((nu) => (vanaf ? [...nu, ...beelden.filter((m) => !nu.some((n) => n.id === m.id))] : beelden));
		setCursor(r.data.nextCursor ?? null);
	}

	// An upload that is still running keeps the window open, so its result is never lost.
	const sluit = () => {
		if (!bezig) onSluit();
	};

	// The dialog opens in the top layer; closing it puts the focus back where it came from.
	useEffect(() => {
		geopend.current = true;
		const terug = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const d = venster.current;
		d?.showModal();
		void laad();
		return () => {
			geopend.current = false;
			d?.close();
			terug?.focus();
		};
	}, []);

	// The browser may close the dialog by itself after a second Escape. During an upload it opens again, so the result
	// still lands here; otherwise the picker goes away as with Annuleren.
	const naSluiten = () => {
		if (!geopend.current) return;
		if (bezig) venster.current?.showModal();
		else onSluit();
	};

	// A click on the backdrop lands on the dialog itself, outside its content.
	const opAchtergrond = (e: MouseEvent<HTMLDialogElement>) => {
		if (e.target === venster.current && drukOp.current === venster.current) sluit();
	};

	async function upload(f: File | undefined) {
		if (!f) return;
		// The chooser only suggests images; the library also takes other files.
		if (!BEELD.test(f.type)) {
			if (bestand.current) bestand.current.value = "";
			return setFout(T.mislukt(T.geenBeeld));
		}
		setBezig(true);
		setFout(null);
		const r = await uploadMedia(f, alt);
		setBezig(false);
		if (bestand.current) bestand.current.value = "";
		if (!r.ok) {
			setFout(T.mislukt(r.melding));
			window.requestAnimationFrame(() => uploadKnop.current?.focus());
			return;
		}
		setItems((nu) => [r.data, ...nu.filter((m) => m.id !== r.data.id)]);
		setGekozen(r.data);
		// The upload button was disabled while it ran, so the focus goes to the new image.
		window.requestAnimationFrame(() => raster.current?.querySelector("button")?.focus());
	}

	return (
		<dialog
			ref={venster}
			className="vind-venster shadow-lg ring ring-kumo-line rounded-xl bg-kumo-base text-kumo-default"
			aria-labelledby="vind-kiezer-titel"
			aria-describedby="vind-kiezer-zin"
			onCancel={(e) => {
				e.preventDefault();
				sluit();
			}}
			onClose={naSluiten}
			onMouseDown={(e) => {
				drukOp.current = e.target;
			}}
			onClick={opAchtergrond}
		>
			<div className="vind-venster-inhoud">
				<div className="flex items-start justify-between gap-3">
					<h2 id="vind-kiezer-titel" className="text-base font-semibold">
						{titel}
					</h2>
					<button type="button" className={KNOP} onClick={sluit} disabled={bezig} aria-label={T.sluiten} autoFocus>
						<span aria-hidden="true">×</span>
					</button>
				</div>
				<p id="vind-kiezer-zin" className="mt-1 text-sm text-kumo-subtle">
					{T.zin}
				</p>
				{cursor === undefined && !fout && <p className="mt-4 text-sm text-kumo-subtle">{T.laden}</p>}
				<div ref={raster} className="vind-raster">
					{items.map((m) => {
						const pad = padVan(m);
						const is = gekozen ? gekozen.id === m.id : pad === huidig;
						return (
							<button
								key={m.id}
								type="button"
								className={`vind-keuze${is ? " vind-gekozen" : ""}`}
								aria-pressed={is}
								onClick={() => setGekozen(m)}
							>
								<img src={pad} alt={m.alt ?? m.filename} loading="lazy" />
								<span className="mt-1 block text-xs text-kumo-subtle">
									{m.filename}
									{pad === huidig ? ` · ${T.nuInGebruik}` : ""}
								</span>
							</button>
						);
					})}
				</div>
				{cursor && (
					<button type="button" className={`${KNOP} mt-3`} disabled={laadt} onClick={() => void laad(cursor)}>
						{T.meer}
					</button>
				)}
				{fout && (
					<p className="mt-3 text-sm text-kumo-danger" role="alert">
						{fout}
					</p>
				)}
				<div className="mt-6 flex flex-wrap items-center gap-3">
					<input
						ref={bestand}
						type="file"
						accept="image/*"
						className="hidden"
						tabIndex={-1}
						onChange={(e) => void upload(e.target.files?.[0])}
					/>
					<button
						ref={uploadKnop}
						type="button"
						className={KNOP}
						disabled={bezig}
						onClick={() => bestand.current?.click()}
					>
						{T.uploaden}
					</button>
					<span className="grow" />
					<button type="button" className={KNOP} onClick={sluit} disabled={bezig}>
						{T.annuleren}
					</button>
					<KnopPrimair disabled={!gekozen || bezig} onClick={() => gekozen && onKies(gekozen)}>
						{T.gebruik}
					</KnopPrimair>
				</div>
			</div>
		</dialog>
	);
}
