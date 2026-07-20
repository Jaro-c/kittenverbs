import type { Field, Verb } from "./types";

/**
 * Answer checking is deliberately asymmetric.
 *
 * English is graded on exact spelling, because spelling IS the thing being
 * tested — forgiving `writen` would teach the misspelling. Only case and
 * stray whitespace are normalized away.
 *
 * Spanish is graded leniently: accents are stripped, and any listed alt counts.
 * Typing `enseñar` without the tilde is a keyboard problem, not a knowledge gap,
 * and this app is not testing Spanish.
 */

function normalize(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function stripAccents(value: string): string {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Spanish also ignores a leading reflexive/infinitive article noise like "to ". */
function normalizeSpanish(raw: string): string {
	return stripAccents(normalize(raw));
}

/** Every string accepted as correct for this field, canonical answer first. */
export function acceptedAnswers(verb: Verb, field: Field): string[] {
	switch (field) {
		case "base":
			return [verb.base];
		case "past":
			return [verb.past, ...(verb.pastAlt ?? [])];
		case "participle":
			return [verb.participle, ...(verb.participleAlt ?? [])];
		case "es":
			return [verb.es, ...(verb.esAlt ?? [])];
	}
}

/** The single answer shown to the learner when they get it wrong. */
export function canonicalAnswer(verb: Verb, field: Field): string {
	return acceptedAnswers(verb, field)[0];
}

export function isCorrect(input: string, verb: Verb, field: Field): boolean {
	const accepted = acceptedAnswers(verb, field);
	if (field === "es") {
		const given = normalizeSpanish(input);
		return accepted.some((answer) => normalizeSpanish(answer) === given);
	}
	const given = normalize(input);
	return accepted.some((answer) => normalize(answer) === given);
}

/**
 * True when the answer is one character away from correct — a likely typo.
 * Used only to soften the feedback wording, never to mark a wrong answer right:
 * `sit`/`sat` are one character apart and are genuinely different forms.
 */
export function isNearMiss(input: string, verb: Verb, field: Field): boolean {
	if (isCorrect(input, verb, field)) return false;
	const given = field === "es" ? normalizeSpanish(input) : normalize(input);
	if (given.length === 0) return false;
	return acceptedAnswers(verb, field).some((answer) => {
		const target = field === "es" ? normalizeSpanish(answer) : normalize(answer);
		return editDistance(given, target) === 1;
	});
}

/** Levenshtein distance, capped early since we only ever care about "is it 1?". */
function editDistance(a: string, b: string): number {
	if (Math.abs(a.length - b.length) > 1) return 2;
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			current[j] = Math.min(
				current[j - 1] + 1,
				previous[j] + 1,
				previous[j - 1] + cost,
			);
		}
		previous = current;
	}
	return previous[b.length];
}
