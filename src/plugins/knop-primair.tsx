// The primary button of Kumo, built from its own classes, colors and layers, since Kumo cannot be imported here.
import type { CSSProperties, ReactNode } from "react";
import {
	KNOP_PRIMAIR,
	KNOP_PRIMAIR_INHOUD,
	KNOP_PRIMAIR_KLEUR,
	KNOP_PRIMAIR_VERLOOP,
	KNOP_UIT,
} from "./paneel-klassen";

export function KnopPrimair({
	children,
	disabled = false,
	onClick,
}: {
	children: ReactNode;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className={disabled ? `${KNOP_PRIMAIR} ${KNOP_UIT}` : KNOP_PRIMAIR}
			style={KNOP_PRIMAIR_KLEUR as CSSProperties}
			disabled={disabled}
			onClick={onClick}
		>
			<span aria-hidden="true" className={KNOP_PRIMAIR_VERLOOP} />
			<span className={KNOP_PRIMAIR_INHOUD}>{children}</span>
		</button>
	);
}
