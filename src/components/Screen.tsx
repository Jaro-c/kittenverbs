import type { ReactNode } from "react";

/**
 * The fade between home, session and results.
 *
 * Entrance only, and on purpose: animating a screen OUT means keeping it mounted
 * after React has decided it is gone, which is the one job that would justify an
 * animation library — and a 30KB runtime is a poor trade for 200ms of leaving.
 * A short fade in is enough for the swap to feel like a move rather than a cut.
 *
 * The `key` is what replays it: same element, different screen name, so React
 * remounts and the animation runs from the top.
 */
export function Screen({ name, children }: { name: string; children: ReactNode }) {
	return (
		<div className="screen" key={name}>
			{children}
		</div>
	);
}
