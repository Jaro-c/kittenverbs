import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A router in sixty lines, because this app has six addresses.
 *
 * The point is not pretty URLs, it is the back button: without history entries
 * the browser's back gesture — the main way anyone navigates on a phone — leaves
 * the site entirely from the middle of a round.
 */
export type RouteName =
	| "home"
	| "practice"
	| "exam"
	| "verbs"
	| "achievements"
	| "records";

const PATHS: Record<RouteName, string> = {
	home: "/",
	practice: "/practicar",
	exam: "/simulacro",
	verbs: "/verbos",
	achievements: "/logros",
	records: "/marcas",
};

/** Routes that are a place to be, and so appear in the navigation bar. */
export const NAV: { route: RouteName; label: string }[] = [
	{ route: "home", label: "Inicio" },
	{ route: "verbs", label: "Verbos" },
	{ route: "records", label: "Marcas" },
	{ route: "achievements", label: "Logros" },
];

/** A round is running: the bar is hidden so she cannot wander out of it. */
export function isSession(route: RouteName): boolean {
	return route === "practice" || route === "exam";
}

const BY_PATH = new Map(
	Object.entries(PATHS).map(([name, path]) => [path, name as RouteName]),
);

export function routeFromPath(pathname: string): RouteName {
	// Trailing slashes and unknown paths both land on home rather than a blank
	// screen; a static host can serve this file for any URL.
	const clean =
		pathname.length > 1 && pathname.endsWith("/")
			? pathname.slice(0, -1)
			: pathname;
	return BY_PATH.get(clean) ?? "home";
}

export function pathForRoute(route: RouteName): string {
	return PATHS[route];
}

/**
 * Returning false from the guard cancels the navigation. The entry the browser
 * already popped has to be pushed back, or the URL would sit on the destination
 * while the screen stayed put — and the next back press would then escape the
 * app without asking.
 */
export type RouteGuard = (from: RouteName, to: RouteName) => boolean;

export function useRouter(guard?: RouteGuard) {
	const [route, setRoute] = useState<RouteName>(() =>
		typeof window === "undefined" ? "home" : routeFromPath(location.pathname),
	);

	const routeRef = useRef(route);
	routeRef.current = route;
	const guardRef = useRef(guard);
	guardRef.current = guard;

	useEffect(() => {
		const onPop = () => {
			const to = routeFromPath(location.pathname);
			const from = routeRef.current;
			if (to === from) return;
			if (guardRef.current && !guardRef.current(from, to)) {
				history.pushState(null, "", PATHS[from]);
				return;
			}
			setRoute(to);
		};
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);

	const navigate = useCallback(
		(to: RouteName, options?: { replace?: boolean }) => {
			const path = PATHS[to];
			if (options?.replace) history.replaceState(null, "", path);
			else history.pushState(null, "", path);
			setRoute(to);
		},
		[],
	);

	return { route, navigate };
}
