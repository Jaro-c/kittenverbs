import { VERBS } from "../data/verbs";
import { acceptedAnswers, canonicalAnswer } from "./check";
import type { Exercise, Field, SessionMode, Verb } from "./types";

// ─── Random helpers ────────────────────────────────────────────────────────────

function shuffle<T>(items: readonly T[]): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

function pick<T>(items: readonly T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

// ─── Distractors ───────────────────────────────────────────────────────────────

/**
 * Wrong options are drawn from the SAME field of OTHER verbs, preferring verbs
 * that share the pattern. Confusing `stolen` with `swum` is the mistake a learner
 * actually makes; a random string teaches nothing because it is dismissed on
 * sight. Same-pattern distractors force the learner to know the verb, not the
 * shape of the word.
 */
function buildDistractors(verb: Verb, field: Field, count: number): string[] {
	const forbidden = new Set(
		acceptedAnswers(verb, field).map((a) => a.toLowerCase()),
	);
	const candidates = (pool: Verb[]) =>
		pool
			.filter((other) => other.id !== verb.id)
			.map((other) => canonicalAnswer(other, field))
			.filter((value) => !forbidden.has(value.toLowerCase()));

	const samePattern = shuffle(
		candidates(VERBS.filter((v) => v.pattern === verb.pattern)),
	);
	const anyVerb = shuffle(candidates(VERBS));

	const chosen: string[] = [];
	for (const value of [...samePattern, ...anyVerb]) {
		if (chosen.length >= count) break;
		if (chosen.some((c) => c.toLowerCase() === value.toLowerCase())) continue;
		chosen.push(value);
	}
	return chosen;
}

// ─── Field pairings ────────────────────────────────────────────────────────────

/**
 * Which clue can be shown for a given target. Spanish is never the clue for a
 * past or participle: with only the meaning to go on the learner has to recall
 * the base form first, which makes it two questions wearing one coat and turns a
 * single slip into a wrong answer for a form they may actually know.
 */
const CLUE_FOR: Record<Field, Field[]> = {
	base: ["es", "past", "participle"],
	past: ["base", "participle"],
	participle: ["base", "past"],
	es: ["base"],
};

const ASKABLE: Field[] = ["base", "past", "participle", "es"];

export const FIELD_LABEL: Record<Field, string> = {
	base: "Infinitive",
	past: "Past tense",
	participle: "Past participle",
	es: "Español",
};

// ─── Builders ──────────────────────────────────────────────────────────────────

let counter = 0;
const nextId = () => `ex-${counter++}`;

function buildType(verb: Verb): Exercise {
	const ask = pick(ASKABLE);
	return { kind: "type", id: nextId(), verb, ask, given: pick(CLUE_FOR[ask]) };
}

function buildChoice(verb: Verb): Exercise {
	const ask = pick(ASKABLE);
	const options = shuffle([
		canonicalAnswer(verb, ask),
		...buildDistractors(verb, ask, 3),
	]);
	return {
		kind: "choice",
		id: nextId(),
		verb,
		ask,
		given: pick(CLUE_FOR[ask]),
		options,
	};
}

function buildRow(verb: Verb): Exercise {
	// Never blank the Spanish column too: with base, past and participle all
	// hidden there is nothing left to identify which verb is meant.
	const blankable: Field[] = ["base", "past", "participle"];
	const howMany = Math.random() < 0.5 ? 1 : 2;
	return {
		kind: "row",
		id: nextId(),
		verb,
		blanks: shuffle(blankable).slice(0, howMany),
	};
}

const BUILDERS = [buildType, buildChoice, buildRow];

// ─── Session assembly ──────────────────────────────────────────────────────────

export interface SessionOptions {
	mode: SessionMode;
	/** How many questions. Defaults to one pass over every verb. */
	size?: number;
	/** Restrict to these verb ids. Defaults to all of them. */
	verbIds?: string[];
}

/**
 * Builds a session that covers every selected verb at least once before it
 * repeats any — a plain random draw would ask `write` four times and skip
 * `swim` entirely, which is exactly the wrong thing the night before an exam.
 */
export function buildSession(options: SessionOptions): Exercise[] {
	const pool = options.verbIds
		? VERBS.filter((v) => options.verbIds?.includes(v.id))
		: VERBS;
	if (pool.length === 0) return [];

	const size = options.size ?? pool.length;
	const exercises: Exercise[] = [];
	let bag: Verb[] = [];

	while (exercises.length < size) {
		if (bag.length === 0) bag = shuffle(pool);
		const verb = bag.pop() as Verb;
		// The exam is written, so it leans on recall rather than recognition;
		// multiple choice is dropped so a lucky guess cannot inflate the score.
		const builder =
			options.mode === "exam"
				? pick([buildType, buildRow])
				: pick(BUILDERS);
		exercises.push(builder(verb));
	}
	return exercises;
}

export { shuffle };
