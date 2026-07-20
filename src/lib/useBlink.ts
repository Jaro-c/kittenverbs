import { useEffect, useState } from "react";

/** How long the eyes stay shut. Long enough to see, short enough not to read as a mood. */
const BLINK_MS = 120;
const MIN_GAP_MS = 4000;
const EXTRA_GAP_MS = 4000;

/**
 * True while the cat is mid-blink.
 *
 * The gap is re-randomised after every blink instead of running on a fixed
 * interval. A metronome is the one thing that makes a blink read as a machine,
 * and this cat is going to be looked at for hundreds of sessions.
 */
export function useBlink(enabled: boolean): boolean {
	const [blinking, setBlinking] = useState(false);

	useEffect(() => {
		if (!enabled) {
			setBlinking(false);
			return;
		}

		let shut: number | undefined;
		let open: number | undefined;

		const schedule = () => {
			shut = window.setTimeout(
				() => {
					setBlinking(true);
					open = window.setTimeout(() => {
						setBlinking(false);
						schedule();
					}, BLINK_MS);
				},
				MIN_GAP_MS + Math.random() * EXTRA_GAP_MS,
			);
		};

		schedule();
		return () => {
			window.clearTimeout(shut);
			window.clearTimeout(open);
			setBlinking(false);
		};
	}, [enabled]);

	return blinking;
}
