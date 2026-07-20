import { useEffect, useState } from "react";

/**
 * Anything that counts as "she is still here". `keydown` matters as much as the
 * pointer: someone typing an answer is not idle even if the mouse never moves.
 */
const SIGNALS = [
	"pointerdown",
	"pointermove",
	"keydown",
	"touchstart",
	"wheel",
	"focusin",
] as const;

/**
 * True once `ms` have passed with no sign of life.
 *
 * The timer is a plain timeout reset by each event rather than a tick that polls
 * a timestamp — an idle page should cost nothing at all, and a page that is
 * being used should not be running a second loop next to the one drawing.
 */
export function useIdle(ms: number, enabled: boolean): boolean {
	const [idle, setIdle] = useState(false);

	useEffect(() => {
		if (!enabled) {
			setIdle(false);
			return;
		}

		let timer = window.setTimeout(() => setIdle(true), ms);

		const wake = () => {
			setIdle(false);
			window.clearTimeout(timer);
			timer = window.setTimeout(() => setIdle(true), ms);
		};

		for (const signal of SIGNALS) {
			window.addEventListener(signal, wake, { passive: true });
		}
		return () => {
			window.clearTimeout(timer);
			for (const signal of SIGNALS) window.removeEventListener(signal, wake);
			setIdle(false);
		};
	}, [ms, enabled]);

	return idle;
}
