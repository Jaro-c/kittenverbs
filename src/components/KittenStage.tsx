import { useCallback, useEffect, useRef, useState } from "react";
import type { AccessoryId } from "../lib/accessories";
import { playPurr } from "../lib/sound";
import { useBlink } from "../lib/useBlink";
import { useGaze } from "../lib/useGaze";
import { useIdle } from "../lib/useIdle";
import { useReducedMotion } from "../lib/useReducedMotion";
import { Kitten, type Mood } from "./Kitten";
import "./kitten-life.css";

/** Long enough that it never dozes off mid-question, short enough to be found. */
const SLEEP_AFTER_MS = 45_000;
/** While a caress is held, a heart every so often rather than one per frame. */
const HEART_EVERY_MS = 380;
/** A tap-and-release still gets its purr; the squint lingers a beat after. */
const AFTERGLOW_MS = 900;

interface Props {
	mood: Mood;
	size?: number;
	accessory?: AccessoryId | null;
	/**
	 * Called on each stroke, with the cat's centre in viewport pixels so hearts
	 * can come out of the cat and not out of the middle of the screen.
	 */
	onPet?: (x: number, y: number) => void;
	/** Set on the home screen only, where there is room for a nudge. */
	hint?: boolean;
}

/**
 * The cat, alive: eyes that follow the cursor, an irregular blink, a nap after a
 * long silence, and a purr when she strokes it.
 *
 * All the timing lives here and in the hooks, so Kitten.tsx stays a pure drawing
 * that can also be rendered as a 40px preview in the accessory picker without
 * dragging four timers along with it.
 *
 * None of this reacts to whether an answer was right — the mood prop is the only
 * channel for that, and in exam mode the parent never changes it. A cat that
 * perked up on a correct answer would be reading the score out loud.
 */
export function KittenStage({ mood, size = 150, accessory = null, onPet, hint = false }: Props) {
	const reduced = useReducedMotion();
	const svgRef = useRef<SVGSVGElement>(null);
	const stageRef = useRef<HTMLButtonElement>(null);
	const [petting, setPetting] = useState(false);

	// Only the resting cat dozes off. In the timed exam the mood is "thinking"
	// throughout, and a mascot falling asleep during her test is not charming.
	const asleep = useIdle(SLEEP_AFTER_MS, !reduced && mood === "idle" && !petting);
	const gaze = useGaze(svgRef, !reduced && !asleep && !petting);
	const blinking = useBlink(!reduced && !asleep && !petting);

	const lastHeart = useRef(0);
	const afterglow = useRef<number | undefined>(undefined);

	const stroke = useCallback(() => {
		const now = Date.now();
		if (now - lastHeart.current < HEART_EVERY_MS) return;
		lastHeart.current = now;
		playPurr();
		const box = stageRef.current?.getBoundingClientRect();
		onPet?.(
			box ? box.left + box.width / 2 : window.innerWidth / 2,
			box ? box.top + box.height * 0.35 : window.innerHeight / 3,
		);
	}, [onPet]);

	useEffect(() => () => window.clearTimeout(afterglow.current), []);

	const release = () => {
		setPetting(false);
		window.clearTimeout(afterglow.current);
	};

	return (
		<span className="kitten-stage-wrap">
			<button
				ref={stageRef}
				type="button"
				className="kitten-stage"
				// The name describes the one thing this control does; the mood inside the
				// SVG is decoration on top of it, not the label.
				aria-label={asleep ? "Despertar y acariciar al gatito" : "Acariciar al gatito"}
				onPointerDown={() => {
					setPetting(true);
					stroke();
				}}
				onPointerMove={() => {
					if (petting) stroke();
				}}
				onPointerUp={release}
				onPointerLeave={release}
				onPointerCancel={release}
				// Fires for Enter and Space too, which is the whole point of the button.
				onClick={() => {
					setPetting(true);
					stroke();
					window.clearTimeout(afterglow.current);
					afterglow.current = window.setTimeout(() => setPetting(false), AFTERGLOW_MS);
				}}
			>
				<Kitten
					svgRef={svgRef}
					mood={mood}
					size={size}
					accessory={accessory}
					look={reduced ? undefined : gaze}
					blinking={blinking}
					asleep={asleep}
					petting={petting}
					decorative
				/>
			</button>

			{/* Outside the button: inside it the nudge would sit within the circular
			    focus ring and, worse, become part of what the control announces. */}
			{hint && <span className="kitten-hint">Tócalo, le gusta</span>}
		</span>
	);
}
