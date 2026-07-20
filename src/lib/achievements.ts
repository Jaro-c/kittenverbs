import { VERBS } from "../data/verbs";
import type { AccessoryId } from "./accessories";
import type { Progress } from "./storage";

/**
 * Milestones worth noticing, and the only way to get a new accessory.
 *
 * Every condition reads a counter that survives the fortnight prune in
 * storage.ts — `days` is trimmed, so a lifetime milestone can never be derived
 * from it. Nothing here depends on the current session, which means an
 * achievement can be re-checked at any moment and always gives the same answer.
 */
export interface Achievement {
	id: string;
	title: string;
	/** What it takes, shown while it is still locked. */
	hint: string;
	/** The accessory it hands over, when it hands over one. */
	grants?: AccessoryId;
	reached: (progress: Progress) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
	{
		id: "first",
		title: "El primer día",
		hint: "Termina tu primera ronda",
		grants: "bow",
		reached: (p) => p.sessionsDone >= 1,
	},
	{
		id: "streak3",
		title: "Tres días seguidos",
		hint: "Estudia tres días seguidos",
		reached: (p) => p.streak >= 3,
	},
	{
		id: "hundred",
		title: "Cien preguntas",
		hint: "Responde 100 preguntas en total",
		grants: "scarf",
		reached: (p) => p.answeredTotal >= 100,
	},
	{
		id: "allverbs",
		title: "Los quince verbos",
		hint: "Practica los 15 verbos al menos una vez",
		reached: (p) => Object.keys(p.verbs).length >= VERBS.length,
	},
	{
		id: "week",
		title: "Una semana entera",
		hint: "Siete días seguidos sin saltarte ninguno",
		grants: "hat",
		reached: (p) => p.streak >= 7,
	},
	{
		id: "perfect",
		title: "Simulacro perfecto",
		hint: "Saca 100 % en el simulacro cronometrado",
		grants: "glasses",
		reached: (p) => p.bestExam === 100,
	},
	{
		id: "pets",
		title: "Cincuenta caricias",
		hint: "Acaricia al gatito 50 veces",
		reached: (p) => p.pets >= 50,
	},
];

export function getAchievement(id: string): Achievement | undefined {
	return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Folds any newly reached milestone into progress.
 *
 * It returns the SAME object when nothing changed. That identity check is what
 * lets the caller run this on every progress update without looping: no change,
 * no new state, no re-render, no second pass.
 */
export function syncAchievements(progress: Progress): {
	progress: Progress;
	newly: Achievement[];
} {
	const already = new Set(progress.unlocked);
	const newly = ACHIEVEMENTS.filter(
		(a) => !already.has(a.id) && a.reached(progress),
	);
	if (newly.length === 0) return { progress, newly };
	return {
		progress: { ...progress, unlocked: [...progress.unlocked, ...newly.map((a) => a.id)] },
		newly,
	};
}

/** Accessories she has earned, in the order they are listed. */
export function unlockedAccessories(progress: Progress): AccessoryId[] {
	const earned = new Set(progress.unlocked);
	return ACHIEVEMENTS.filter((a) => a.grants && earned.has(a.id)).map(
		(a) => a.grants as AccessoryId,
	);
}
