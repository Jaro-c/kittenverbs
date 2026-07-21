import { useReducedMotion } from "../lib/useReducedMotion";
import "./background-cat.css";

/**
 * A cat playing with a ball, behind everything.
 *
 * Drawn as SVG animated by CSS, not on a canvas with a rAF loop. A background
 * animation runs for as long as the page is open, and a JS loop would keep the
 * main thread and the battery busy the whole time; CSS animations are handled by
 * the compositor and the browser throttles them by itself when the tab is not
 * visible. On a phone that is the difference between a nice touch and a reason
 * to close the app.
 *
 * It is never mounted during a round: she is reading `wrote` and deciding, and
 * something moving is competition for the one thing she has to look at.
 */
export function BackgroundCat() {
	const reduced = useReducedMotion();
	// Nothing at all rather than a frozen cat: the whole point is the motion, and
	// a still shape in the corner would just be clutter she cannot dismiss.
	if (reduced) return null;

	return (
		<div className="bgcat" aria-hidden="true">
			<svg viewBox="0 0 220 140" width="220" height="140">
				<g className="bgcat__ball">
					<circle cx="0" cy="0" r="9" className="bgcat__ball-body" />
					<path d="M-9 0 A9 9 0 0 1 9 0" className="bgcat__ball-line" />
					<path d="M0 -9 A9 9 0 0 0 0 9" className="bgcat__ball-line" />
				</g>

				<g className="bgcat__cat">
					{/* Tail first, so it passes behind the body. */}
					<path
						className="bgcat__tail"
						d="M46 108 C22 106 16 88 26 74 C31 67 41 68 43 76"
					/>

					<ellipse className="bgcat__fill" cx="66" cy="98" rx="30" ry="28" />

					{/* Front paws. */}
					<ellipse className="bgcat__fill" cx="82" cy="120" rx="11" ry="6" />
					<ellipse className="bgcat__fill" cx="62" cy="121" rx="11" ry="6" />

					<g className="bgcat__head">
						<path className="bgcat__fill" d="M78 52 L76 30 L94 42 Z" />
						<path className="bgcat__fill bgcat__ear" d="M104 40 L114 22 L118 44 Z" />
						<circle className="bgcat__fill" cx="97" cy="58" r="23" />
						<circle className="bgcat__eye" cx="106" cy="55" r="2.8" />
						<circle className="bgcat__eye" cx="91" cy="55" r="2.8" />
						<path
							className="bgcat__mouth"
							d="M99 64 q-4 5 -8 1 M99 64 q4 5 8 1"
						/>
					</g>
				</g>
			</svg>
		</div>
	);
}
