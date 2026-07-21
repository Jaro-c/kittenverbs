import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * A number that climbs to its value instead of arriving already there.
 *
 * Her records are the one screen in the app that is purely a reward, and a
 * reward that is simply printed reads as a receipt. Counting is short — under a
 * second — because this fires by itself on arrival rather than answering a tap,
 * and anything that fires by itself has to get out of the way.
 *
 * The preference is honoured in the ENGINE, not in a stylesheet: a
 * `@media (prefers-reduced-motion)` block has no opinion whatsoever about a
 * requestAnimationFrame loop calling setState sixty times a second. Reduced
 * means the loop never starts and the final value is the first value rendered —
 * not a zero left frozen on screen, which is the failure that turns a comfort
 * setting into a broken page.
 */

/** Fast at the start, easing into place. A linear count reads like a spinner. */
function easeOut(t: number): number {
	return 1 - (1 - t) ** 3;
}

export function useCountUp(target: number, durationMs: number): number {
	const reduced = useReducedMotion();
	// Starts at zero rather than at the target, so the first painted frame is
	// already the bottom of the climb. Seeding it with the target instead showed
	// the final number for one frame and then snapped back to 0 to count up —
	// a flicker, and on the reduced path the wrong value entirely.
	const [value, setValue] = useState(() => (reduced || target === 0 ? target : 0));

	useEffect(() => {
		if (reduced || target === 0) {
			setValue(target);
			return;
		}

		let raf = 0;
		const started = performance.now();

		const tick = (now: number) => {
			// Clamped at BOTH ends. The timestamp requestAnimationFrame passes in is
			// the start of the current frame, which can predate the performance.now()
			// read a moment earlier in this same effect — so the first tick arrives
			// with a negative elapsed time. Measured, unclamped: the records opened
			// on "-5%", "-126", "-1/15". Only the upper bound was guarded, because
			// only the upper bound is the one anybody thinks of.
			const t = Math.min(Math.max((now - started) / durationMs, 0), 1);
			setValue(Math.round(easeOut(t) * target));
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [target, durationMs, reduced]);

	return value;
}
