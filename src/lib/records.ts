import { VERBS, getVerb } from "../data/verbs";
import type { Progress, VerbStat } from "./storage";
import type { Verb } from "./types";

/**
 * Personal records, derived rather than stored.
 *
 * Everything here is computed from the progress blob on read. Storing a second
 * copy of "best ever" numbers would give two places for the same truth to live,
 * and they would drift the first time the shape of a session changes.
 */

export interface VerbAccuracy {
	verb: Verb;
	correct: number;
	wrong: number;
	total: number;
	/** 0–100. */
	percent: number;
}

function accuracy(id: string, stat: VerbStat): VerbAccuracy | null {
	const verb = getVerb(id);
	const total = stat.correct + stat.wrong;
	if (!verb || total === 0) return null;
	return {
		verb,
		correct: stat.correct,
		wrong: stat.wrong,
		total,
		percent: Math.round((stat.correct / total) * 100),
	};
}

export function verbAccuracies(progress: Progress): VerbAccuracy[] {
	return Object.entries(progress.verbs)
		.map(([id, stat]) => accuracy(id, stat))
		.filter((v): v is VerbAccuracy => v !== null);
}

/**
 * Ranked worst first, but only counting verbs seen enough times to mean
 * anything: one unlucky miss on the first try would otherwise crown a verb she
 * actually knows as her nemesis.
 */
const MIN_ATTEMPTS = 3;

export function toughest(progress: Progress, limit = 5): VerbAccuracy[] {
	return verbAccuracies(progress)
		.filter((v) => v.total >= MIN_ATTEMPTS)
		.sort((a, b) => a.percent - b.percent || b.wrong - a.wrong)
		.slice(0, limit);
}

export function strongest(progress: Progress, limit = 5): VerbAccuracy[] {
	return verbAccuracies(progress)
		.filter((v) => v.total >= MIN_ATTEMPTS)
		.sort((a, b) => b.percent - a.percent || b.total - a.total)
		.slice(0, limit);
}

export interface Overall {
	answered: number;
	correct: number;
	percent: number;
	sessions: number;
	seen: number;
	ofTotal: number;
	bestExam: number | null;
	streak: number;
	bestStreak: number;
	pets: number;
	unlocked: number;
}

export function overall(progress: Progress): Overall {
	const stats = Object.values(progress.verbs);
	const correct = stats.reduce((sum, s) => sum + s.correct, 0);
	const wrong = stats.reduce((sum, s) => sum + s.wrong, 0);
	const graded = correct + wrong;
	return {
		// answeredTotal counts questions; a row exercise grades several fields at
		// once, so the two never match exactly and the percentage uses the graded
		// figure it was actually computed from.
		answered: progress.answeredTotal,
		correct,
		percent: graded === 0 ? 0 : Math.round((correct / graded) * 100),
		sessions: progress.sessionsDone,
		seen: Object.keys(progress.verbs).length,
		ofTotal: VERBS.length,
		bestExam: progress.bestExam,
		streak: progress.streak,
		bestStreak: progress.bestStreak,
		pets: progress.pets,
		unlocked: progress.unlocked.length,
	};
}

/** True once there is enough history for the page to say anything useful. */
export function hasHistory(progress: Progress): boolean {
	return progress.sessionsDone > 0;
}
