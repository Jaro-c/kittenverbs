import "./kitten.css";

export type Mood = "idle" | "thinking" | "happy" | "sad" | "celebrate";

interface KittenProps {
	mood: Mood;
	/** Rendered size in pixels. The drawing scales with it. */
	size?: number;
}

/**
 * The mascot, drawn inline rather than shipped as an image.
 *
 * Inline SVG means the eyes and mouth are addressable nodes, so a mood change is
 * a class swap on paths that are already in the DOM — no second network request,
 * no flash of the wrong face, and the whole cat inherits `currentColor` so it
 * follows the theme for free.
 */
export function Kitten({ mood, size = 160 }: KittenProps) {
	return (
		<svg
			className={`kitten kitten--${mood}`}
			width={size}
			height={size}
			viewBox="0 0 120 120"
			role="img"
			aria-label={MOOD_LABEL[mood]}
		>
			<title>{MOOD_LABEL[mood]}</title>

			<g className="kitten__body">
				{/* Ears */}
				<path className="kitten__ear" d="M24 46 L28 10 L56 28 Z" />
				<path className="kitten__ear" d="M96 46 L92 10 L64 28 Z" />
				<path className="kitten__ear-inner" d="M32 40 L34 21 L48 30 Z" />
				<path className="kitten__ear-inner" d="M88 40 L86 21 L72 30 Z" />

				{/* Head */}
				<ellipse className="kitten__head" cx="60" cy="66" rx="39" ry="35" />

				{/* Blush, only visible when pleased */}
				<ellipse className="kitten__blush" cx="30" cy="76" rx="8" ry="5" />
				<ellipse className="kitten__blush" cx="90" cy="76" rx="8" ry="5" />

				{/* Eyes — open by default, arcs when the eyes are shut */}
				<g className="kitten__eyes-open">
					<ellipse className="kitten__eye" cx="46" cy="62" rx="6.5" ry="8" />
					<ellipse className="kitten__eye" cx="74" cy="62" rx="6.5" ry="8" />
					<circle className="kitten__glint" cx="48" cy="59" r="2.4" />
					<circle className="kitten__glint" cx="76" cy="59" r="2.4" />
				</g>
				<g className="kitten__eyes-shut">
					<path d="M39 63 Q46 55 53 63" />
					<path d="M67 63 Q74 55 81 63" />
				</g>

				{/* Nose and mouth. The mouth flips in JS rather than via the CSS `d`
				    property, which Firefox only learned recently. */}
				<path className="kitten__nose" d="M56 74 L64 74 L60 79 Z" />
				<path className="kitten__mouth" d={MOUTH[mood]} />

				{/* Whiskers */}
				<g className="kitten__whiskers">
					<path d="M20 66 L38 69 M18 76 L38 76" />
					<path d="M100 66 L82 69 M102 76 L82 76" />
				</g>

				{/* Tear, sad only */}
				<circle className="kitten__tear" cx="74" cy="74" r="3.4" />
			</g>

			{/* Sparkles, celebration only */}
			<g className="kitten__sparkles">
				<path d="M14 26 l2.6 5.4 5.4 2.6 -5.4 2.6 -2.6 5.4 -2.6 -5.4 -5.4 -2.6 5.4 -2.6 Z" />
				<path d="M104 30 l2 4.2 4.2 2 -4.2 2 -2 4.2 -2 -4.2 -4.2 -2 4.2 -2 Z" />
				<path d="M98 92 l1.7 3.6 3.6 1.7 -3.6 1.7 -1.7 3.6 -1.7 -3.6 -3.6 -1.7 3.6 -1.7 Z" />
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
