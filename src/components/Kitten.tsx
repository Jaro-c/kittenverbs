import type { Ref } from "react";
import type { AccessoryId } from "../lib/accessories";
import type { Gaze } from "../lib/useGaze";
import { KittenAccessory } from "./KittenAccessory";
import "./kitten.css";

export type Mood = "idle" | "thinking" | "happy" | "sad" | "celebrate";

interface KittenProps {
	mood: Mood;
	/** Rendered size in pixels. The drawing scales with it. */
	size?: number;
	/** What it is wearing, if anything. */
	accessory?: AccessoryId | null;
	/** Where the eyes point, −1…1 on each axis. Centre when absent. */
	look?: Gaze;
	/** Eyes shut for a fraction of a second. */
	blinking?: boolean;
	/** Dozed off after a long silence. */
	asleep?: boolean;
	/** Being stroked right now. */
	petting?: boolean;
	/**
	 * Hides the drawing from assistive tech entirely.
	 *
	 * Set wherever the cat sits INSIDE another control. Measured with a real Tab
	 * sweep: without it the wardrobe chips announced as "Gatito esperandozzSin
	 * nada" — the <title> and the two sleeping z glyphs were being folded into the
	 * button's accessible name. The surrounding control already says what it is,
	 * and the mood is announced properly by the feedback status line.
	 */
	decorative?: boolean;
	svgRef?: Ref<SVGSVGElement>;
}

/** How far the eyes can travel, in viewBox units. Past this they leave the face. */
const LOOK_X = 2.6;
const LOOK_Y = 1.8;

/**
 * The mascot, drawn inline rather than shipped as an image.
 *
 * Inline SVG means the eyes and mouth are addressable nodes, so a mood change is
 * a class swap on paths that are already in the DOM — no second network request,
 * no flash of the wrong face, and the whole cat inherits `currentColor` so it
 * follows the theme for free.
 *
 * This component stays dumb on purpose: it draws exactly the state it is handed.
 * The timers that decide when to blink or fall asleep live in hooks, so the
 * drawing can be reused in a 40px picker preview with none of that running.
 */
export function Kitten({
	mood,
	size = 160,
	accessory = null,
	look,
	blinking = false,
	asleep = false,
	petting = false,
	decorative = false,
	svgRef,
}: KittenProps) {
	const state = asleep ? "asleep" : petting ? "petting" : blinking ? "blinking" : null;
	const name = label(mood, asleep, petting);

	return (
		<svg
			ref={svgRef}
			className={`kitten kitten--${mood}${state ? ` kitten--${state}` : ""}`}
			width={size}
			height={size}
			viewBox="0 0 120 120"
			role={decorative ? "presentation" : "img"}
			aria-hidden={decorative || undefined}
			aria-label={decorative ? undefined : name}
		>
			{!decorative && <title>{name}</title>}

			<g className="kitten__body">
				{/* Ears */}
				<path className="kitten__ear" d="M24 46 L28 10 L56 28 Z" />
				<path className="kitten__ear" d="M96 46 L92 10 L64 28 Z" />
				<path className="kitten__ear-inner" d="M32 40 L34 21 L48 30 Z" />
				<path className="kitten__ear-inner" d="M88 40 L86 21 L72 30 Z" />

				{/* Worn behind the head so a scarf tucks under the chin. */}
				{accessory === "scarf" && <KittenAccessory id="scarf" />}

				{/* Head */}
				<ellipse className="kitten__head" cx="60" cy="66" rx="39" ry="35" />

				{/* Blush, only visible when pleased */}
				<ellipse className="kitten__blush" cx="30" cy="76" rx="8" ry="5" />
				<ellipse className="kitten__blush" cx="90" cy="76" rx="8" ry="5" />

				{/* Eyes — open by default, arcs when the eyes are shut. The whole open
				    pair rides on one group so following the cursor is a single
				    transform instead of four coordinates recomputed per frame. */}
				<g
					className="kitten__gaze"
					style={
						look
							? {
									transform: `translate(${(look.x * LOOK_X).toFixed(2)}px, ${(look.y * LOOK_Y).toFixed(2)}px)`,
								}
							: undefined
					}
				>
					<g className="kitten__eyes-open">
						<ellipse className="kitten__eye" cx="46" cy="62" rx="6.5" ry="8" />
						<ellipse className="kitten__eye" cx="74" cy="62" rx="6.5" ry="8" />
						<circle className="kitten__glint" cx="48" cy="59" r="2.4" />
						<circle className="kitten__glint" cx="76" cy="59" r="2.4" />
					</g>
				</g>
				<g className="kitten__eyes-shut">
					<path d="M39 63 Q46 55 53 63" />
					<path d="M67 63 Q74 55 81 63" />
				</g>

				{/* Glasses sit over the eyes but under the nose line. */}
				{accessory === "glasses" && <KittenAccessory id="glasses" />}

				{/* Nose and mouth. The mouth flips in JS rather than via the CSS `d`
				    property, which Firefox only learned recently. */}
				<path className="kitten__nose" d="M56 74 L64 74 L60 79 Z" />
				<path className="kitten__mouth" d={MOUTH[petting ? "happy" : mood]} />

				{/* Whiskers */}
				<g className="kitten__whiskers">
					<path d="M20 66 L38 69 M18 76 L38 76" />
					<path d="M100 66 L82 69 M102 76 L82 76" />
				</g>

				{/* Tear, sad only */}
				<circle className="kitten__tear" cx="74" cy="74" r="3.4" />

				{/* Worn on top of everything. */}
				{accessory === "bow" && <KittenAccessory id="bow" />}
				{accessory === "hat" && <KittenAccessory id="hat" />}
			</g>

			{/* Sparkles, celebration only */}
			<g className="kitten__sparkles">
				<path d="M14 26 l2.6 5.4 5.4 2.6 -5.4 2.6 -2.6 5.4 -2.6 -5.4 -5.4 -2.6 5.4 -2.6 Z" />
				<path d="M104 30 l2 4.2 4.2 2 -4.2 2 -2 4.2 -2 -4.2 -4.2 -2 4.2 -2 Z" />
				<path d="M98 92 l1.7 3.6 3.6 1.7 -3.6 1.7 -1.7 3.6 -1.7 -3.6 -3.6 -1.7 3.6 -1.7 Z" />
			</g>

			{/* Asleep only */}
			<g className="kitten__zzz" aria-hidden="true">
				<text className="kitten__z kitten__z--near" x="93" y="32">z</text>
				<text className="kitten__z kitten__z--far" x="102" y="18">z</text>
			</g>
		</svg>
	);
}

/** Smiling by default; the corners turn down when the answer was wrong. */
const MOUTH: Record<Mood, string> = {
	idle: "M60 79 Q53 87 47 80 M60 79 Q67 87 73 80",
	thinking: "M60 79 Q54 84 48 81 M60 79 Q66 84 72 81",
	happy: "M60 79 Q52 90 45 79 M60 79 Q68 90 75 79",
	celebrate: "M60 79 Q52 91 45 78 M60 79 Q68 91 75 78",
	sad: "M60 85 Q53 78 47 84 M60 85 Q67 78 73 84",
};

const MOOD_LABEL: Record<Mood, string> = {
	idle: "Gatito esperando",
	thinking: "Gatito pensando",
	happy: "Gatito contento: respuesta correcta",
	sad: "Gatito triste: respuesta incorrecta",
	celebrate: "Gatito celebrando",
};

/** Sleeping and purring outrank the mood: they are what is actually on screen. */
function label(mood: Mood, asleep: boolean, petting: boolean): string {
	if (asleep) return "Gatito dormido";
	if (petting) return "Gatito ronroneando";
	return MOOD_LABEL[mood];
}
