import { useState } from "react";
import { buzzCorrect, canVibrate, isHapticsOn, setHapticsOn } from "../lib/haptics";

/**
 * Its own switch, and deliberately not folded into the sound one.
 *
 * The two are used in opposite situations: sound goes off in a classroom, where
 * vibration is exactly what you want left on. Tying them together would force
 * her to lose one to silence the other.
 *
 * It renders nothing at all where the browser cannot vibrate — an iPhone, a
 * laptop — because a switch that promises something the platform will never do
 * is worse than no switch. That check is why this is a component and not two
 * lines in the footer.
 */
export function HapticsToggle() {
	const [on, setOn] = useState(isHapticsOn);

	if (!canVibrate()) return null;

	return (
		<button
			type="button"
			className="sound-toggle"
			aria-pressed={on}
			aria-label={on ? "Desactivar vibración" : "Activar vibración"}
			onClick={() => {
				const next = !on;
				setOn(next);
				setHapticsOn(next);
				// Turning it on demonstrates itself. There is no other way to find
				// out what "vibración" is going to feel like before committing to it.
				if (next) buzzCorrect();
			}}
		>
			<span aria-hidden="true">{on ? "📳" : "📴"}</span>
			<span>{on ? "Vibración activada" : "Vibración apagada"}</span>
		</button>
	);
}
