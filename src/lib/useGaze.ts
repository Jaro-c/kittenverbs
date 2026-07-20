import { useEffect, useState, type RefObject } from "react";

export interface Gaze {
	/** −1 (fully left) … 1 (fully right). */
	x: number;
	/** −1 (fully up) … 1 (fully down). */
	y: number;
}

const CENTER: Gaze = { x: 0, y: 0 };

/**
 * Where the pointer is, relative to the centre of `element`.
 *
 * Two things are deliberate here. The move handler only stores the coordinates
 * and lets a single animation frame publish them: a fast mouse fires far more
 * pointermove events than there are frames, and turning each one into a React
 * render would cost more than the whole rest of the app.
 *
 * And the distance is softened with a square root, so the eyes still travel a
 * noticeable amount while the cursor is near the cat and stop growing once it is
 * far away — a linear map spends most of the screen pinned at the limit, which
 * reads as broken rather than as following.
 */
export function useGaze(
	element: RefObject<SVGSVGElement | null>,
	enabled: boolean,
): Gaze {
	const [gaze, setGaze] = useState<Gaze>(CENTER);

	useEffect(() => {
		if (!enabled) {
			setGaze(CENTER);
			return;
		}

		let frame: number | null = null;
		let pending: { x: number; y: number } | null = null;

		const publish = () => {
			frame = null;
			const node = element.current;
			if (!node || !pending) return;
			const box = node.getBoundingClientRect();
			if (box.width === 0 || box.height === 0) return;
			// 1.4 box-widths away counts as "as far as it goes"; past that the
			// softening curve has already flattened out anyway.
			const dx = (pending.x - (box.left + box.width / 2)) / (box.width * 1.4);
			const dy = (pending.y - (box.top + box.height / 2)) / (box.height * 1.4);
			setGaze({ x: soften(dx), y: soften(dy) });
		};

		const onMove = (event: PointerEvent) => {
			pending = { x: event.clientX, y: event.clientY };
			if (frame === null) frame = requestAnimationFrame(publish);
		};

		window.addEventListener("pointermove", onMove, { passive: true });
		return () => {
			window.removeEventListener("pointermove", onMove);
			if (frame !== null) cancelAnimationFrame(frame);
		};
	}, [element, enabled]);

	return gaze;
}

function soften(value: number): number {
	const clamped = Math.max(-1, Math.min(1, value));
	return Math.sign(clamped) * Math.sqrt(Math.abs(clamped));
}
