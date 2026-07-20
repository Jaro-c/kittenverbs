import { useState } from "react";
import { isSoundOn, playCorrect, setSoundOn } from "../lib/sound";

/**
 * Turning sound back on plays a tone immediately — both as confirmation and
 * because that click is the user gesture the AudioContext needs, so the first
 * real answer is not the one that gets swallowed.
 */
export function SoundToggle({ compact = false }: { compact?: boolean }) {
	const [on, setOn] = useState(isSoundOn);

	return (
		<button
			type="button"
			className={`sound-toggle${compact ? " sound-toggle--compact" : ""}`}
			aria-pressed={on}
			aria-label={on ? "Desactivar sonido" : "Activar sonido"}
			onClick={() => {
				const next = !on;
				setOn(next);
				setSoundOn(next);
				if (next) playCorrect();
			}}
		>
			<span aria-hidden="true">{on ? "🔊" : "🔇"}</span>
			{!compact && <span>{on ? "Sonido activado" : "Sonido apagado"}</span>}
		</button>
	);
}
