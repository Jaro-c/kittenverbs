import { flushSync } from "react-dom";

/**
 * Screen changes, handed to the browser.
 *
 * The old Screen component faded the new page IN and let the old one vanish on
 * the same frame, because animating a screen OUT means keeping it mounted after
 * React has decided it is gone. The View Transitions API removes the premise:
 * the browser photographs the page before the update, photographs it after, and
 * cross-fades the two by itself. Nothing has to stay mounted, no element is
 * duplicated, and a 40KB animation runtime buys nothing that this does not
 * already do — which matters, because she downloads this on mobile data.
 *
 * Capability is CHECKED, never assumed: where the API is absent the update runs
 * plainly and the CSS entrance in app.css (kept alive for exactly this case)
 * carries the change instead.
 */

type StartViewTransition = (callback: () => void) => { finished: Promise<unknown> };

/**
 * "page" is a whole address changing: a fade with a short vertical push.
 * "swap"  is content replaced in place — a filter, the wardrobe opening. Same
 *         machinery, half the time and no movement, because it answers a tap and
 *         sliding the entire page for a filter chip reads as lag.
 */
export type TransitionKind = "page" | "swap";

const start: StartViewTransition | undefined =
	typeof document === "undefined"
		? undefined
		: (document as unknown as { startViewTransition?: StartViewTransition })
				.startViewTransition;

export const supportsViewTransitions = typeof start === "function";

// The stylesheet needs to know, because the two entrances are mutually
// exclusive: where the browser animates the swap, the per-screen keyframe would
// play a second, redundant fade underneath it.
if (supportsViewTransitions) {
	document.documentElement.dataset.viewTransitions = "on";
}

function motionWanted(): boolean {
	return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The preference is read HERE, at the moment of the change, and not once at
 * import time: flipping the system setting has to settle the app on the next tap
 * without a reload. A `@media` block in CSS could not do this job at all — it
 * can shorten the pseudo-element animations, but the transition would still be
 * captured and replayed, and that is the thing being refused.
 */
export function withViewTransition(kind: TransitionKind, update: () => void): void {
	if (!supportsViewTransitions || !motionWanted()) {
		update();
		return;
	}

	const root = document.documentElement;
	root.dataset.vt = kind;

	// flushSync is what makes React's update land INSIDE the callback. Without it
	// the state change would be scheduled for later, the browser would photograph
	// an unchanged page, and the transition would animate nothing.
	const transition = start!.call(document, () => {
		flushSync(update);
	});

	void transition.finished
		.catch(() => {
			// A transition skipped by the next one rejects. There is nothing to
			// recover: the newer transition owns the screen now.
		})
		.finally(() => {
			if (root.dataset.vt === kind) delete root.dataset.vt;
		});
}
