import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The motion preference read in JavaScript, not only in CSS.
 *
 * A media query can stop a keyframe animation, but it cannot stop a pointer
 * handler that writes `transform` on every frame — that motion has to be refused
 * at the source, before the loop starts. Listening for changes rather than
 * reading once means flipping the system setting settles the cat immediately,
 * without a reload.
 */
export function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState(
		() => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
	);

	useEffect(() => {
		const query = window.matchMedia(QUERY);
		const sync = () => setReduced(query.matches);
		sync();
		query.addEventListener("change", sync);
		return () => query.removeEventListener("change", sync);
	}, []);

	return reduced;
}
