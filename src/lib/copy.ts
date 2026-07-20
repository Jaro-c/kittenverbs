import type { SessionMode } from "./types";
import type { Progress } from "./storage";

/**
 * Every sentence the app says to her, in one place.
 *
 * Two rules govern the wording. It is written to a person, not to a user, so the
 * app greets her by name and speaks Colombian Spanish rather than the flat,
 * manual-page neutral. And a wrong answer never gets a scolding: she is going to
 * be wrong hundreds of times on the way to knowing these verbs, and a tone that
 * stings the first time is unbearable the fiftieth. Kind, not sugary — being
 * congratulated for a mistake would be worse than being told off.
 */

const NAME = "Jasuviley";

export interface Greeting {
	/** The hello itself, keyed to the hour. */
	hello: string;
	/** One line under it, keyed to how she has been going. */
	line: string;
}

export function greeting(progress: Progress, now: Date = new Date()): Greeting {
	const hour = now.getHours();
	const hello =
		hour < 5
			? `Trasnochando, ${NAME}`
			: hour < 12
				? `Buenos días, ${NAME}`
				: hour < 19
					? `Buenas tardes, ${NAME}`
					: `Buenas noches, ${NAME}`;

	return { hello, line: streakLine(progress) };
}

function streakLine(progress: Progress): string {
	if (progress.sessionsDone === 0) {
		return "El gatito llevaba rato esperándote. Arranquemos suavecito.";
	}
	if (progress.streak === 0) {
		return "Volviste, que es lo que cuenta. El gatito ya se despertó.";
	}
	if (progress.streak === 1) {
		return "Día uno otra vez. Con una ronda basta para no romperla.";
	}
	if (progress.streak >= 7) {
		return `${progress.streak} días seguidos. Esto ya es costumbre tuya.`;
	}
	return `${progress.streak} días seguidos. Vas juiciosa.`;
}

// ─── Answer feedback ───────────────────────────────────────────────────────────

const PRAISE = ["¡Eso!", "¡Bien ahí!", "¡Clarito!", "¡Esa te la sabías!", "¡Perfecto!"];

/** One letter away: the knowledge was there, the fingers were not. */
const NEAR = [
	"Uy, por una letrica.",
	"Casi. Es la escritura, no el verbo.",
	"Estabas ahí mismo. Mira cómo se escribe.",
];

/** Plain wrong. Nothing here blames her, and nothing pretends it was right. */
const MISS = [
	"Nada grave, esa se le escapa a cualquiera.",
	"Tranquila, queda apuntada para el repaso.",
	"Esa es de las tramposas.",
	"No pasa nada, seguimos.",
	"Ojo con esa, la volvemos a ver.",
];

function pick(lines: string[]): string {
	return lines[Math.floor(Math.random() * lines.length)];
}

export function praiseLine(streak: number): string {
	if (streak >= 5) return `¡${streak} seguidas! No pares 🔥`;
	return pick(PRAISE);
}

export function missLine(nearMiss: boolean): string {
	return nearMiss ? pick(NEAR) : pick(MISS);
}

// ─── End of a run ──────────────────────────────────────────────────────────────

export function verdict(percent: number, mode: SessionMode): string {
	if (mode === "exam") {
		if (percent >= 90) return "Lista para mañana. En serio.";
		if (percent >= 70) return "Vas bien. Repasa los fallados y repítelo.";
		return "Todavía no, y está bien. Practica los fallados y vuelve.";
	}
	if (percent >= 90) return "Te los sabes. Mídete con el simulacro.";
	if (percent >= 60) return "Bien encaminada. Otra ronda y quedan.";
	return "Miremos la tabla un momento y volvemos. Nadie se los aprende de una.";
}

export const TIMED_OUT_NOTE =
	"Se acabó el tiempo. Las que quedaron en blanco cuentan como falladas, igual que en el examen.";

/** The heading over the list of misses. It is a to-do, not a report card. */
export const MISSES_TITLE = "Para la próxima";
