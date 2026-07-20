// ─── Core domain types ─────────────────────────────────────────────────────────

/**
 * Shape of a verb's three principal parts, used to group study by pattern.
 * ABB → past and participle match (spend/spent/spent).
 * ABC → all three differ (swim/swam/swum).
 */
export type Pattern = "ABB" | "ABC";

/** The four columns an exercise can hide and ask for. */
export type Field = "base" | "past" | "participle" | "es";

export interface Verb {
	/** Unique slug, same as the base form. */
	id: string;
	/** Infinitive without "to". */
	base: string;
	/** Past simple. */
	past: string;
	/** Past participle. */
	participle: string;
	/** Primary Spanish meaning, Colombian usage where it differs. */
	es: string;
	pattern: Pattern;
	/**
	 * True when the verb also follows the regular -ed rule in American English.
	 * Only `spell` qualifies here; `spelt` is British and lives in the alt lists.
	 */
	regular?: boolean;
	/** Other Spanish translations accepted when typed. */
	esAlt?: string[];
	/** Accepted past-simple variants. */
	pastAlt?: string[];
	/** Accepted participle variants. */
	participleAlt?: string[];
}

// ─── Exercises ─────────────────────────────────────────────────────────────────

/** Free text: one field shown, another typed from memory. */
export interface TypeExercise {
	kind: "type";
	id: string;
	verb: Verb;
	/** Field the learner must produce. */
	ask: Field;
	/** Field shown as the clue. */
	given: Field;
}

/** Four options, one right. Distractors come from other verbs' real forms. */
export interface ChoiceExercise {
	kind: "choice";
	id: string;
	verb: Verb;
	ask: Field;
	given: Field;
	options: string[];
}

/** The full row with some cells blanked out. */
export interface RowExercise {
	kind: "row";
	id: string;
	verb: Verb;
	/** Cells the learner must fill. The rest are shown. */
	blanks: Field[];
}

export type Exercise = TypeExercise | ChoiceExercise | RowExercise;

export type ExerciseKind = Exercise["kind"];

// ─── Session ───────────────────────────────────────────────────────────────────

export type SessionMode = "practice" | "exam";

/** One graded attempt, kept so the results screen can explain what went wrong. */
export interface Attempt {
	exerciseId: string;
	verbId: string;
	/** What was asked, per blank for a row exercise. */
	ask: Field[];
	/** Exactly what the learner submitted. */
	given: string[];
	/** The canonical answer for each asked field. */
	expected: string[];
	correct: boolean;
	/** Milliseconds from question shown to answer submitted. */
	elapsedMs: number;
}
