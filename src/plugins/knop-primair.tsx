// The primary button of Kumo, built from its own classes, colors and layers, since Kumo cannot be imported here. While
// it is busy it keeps the focus and ignores a click, so a keyboard user stays where the save started.
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
	bezig = false,
	onClick,
}: {
	children: ReactNode;
	disabled?: boolean;
	bezig?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className={disabled || bezig ? `${KNOP_PRIMAIR} ${KNOP_UIT}` : KNOP_PRIMAIR}
			style={KNOP_PRIMAIR_KLEUR as CSSProperties}
			disabled={disabled}
			aria-disabled={bezig || undefined}
			onClick={bezig ? undefined : onClick}
		>
			<span aria-hidden="true" className={KNOP_PRIMAIR_VERLOOP} />
			<span className={KNOP_PRIMAIR_INHOUD}>{children}</span>
		</button>
	);
}
