import { NAV, type RouteName } from "../lib/router";

interface Props {
	current: RouteName;
	onGo: (route: RouteName) => void;
}

/**
 * Fixed to the bottom because that is where a thumb reaches on a phone.
 *
 * It is hidden during a round: the only ways out of a session are Salir and the
 * back gesture, and both ask first. A nav bar sitting there would be a one-tap
 * way to lose a round with no warning at all.
 */
export function BottomNav({ current, onGo }: Props) {
	return (
		<nav className="nav" aria-label="Secciones">
			{NAV.map(({ route, label }) => {
				const active = route === current;
				return (
					<button
						key={route}
						type="button"
						className={`nav__item${active ? " nav__item--on" : ""}`}
						// aria-current is what tells a screen reader which section she is
						// in; the orange is only visible to people who can see it.
						aria-current={active ? "page" : undefined}
						onClick={() => onGo(route)}
					>
						<span className="nav__icon" aria-hidden="true">
							{ICON[route]}
						</span>
						<span className="nav__label">{label}</span>
					</button>
				);
			})}
		</nav>
	);
}

const ICON: Partial<Record<RouteName, string>> = {
	home: "🐱",
	verbs: "📖",
	records: "📈",
	achievements: "🏅",
};
