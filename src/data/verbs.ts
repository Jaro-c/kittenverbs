import type { Verb } from "../lib/types";

/**
 * The 15 verbs on the evaluation list, in American English.
 *
 * Where British and American spelling diverge the American form is canonical and
 * the British one is accepted as an alt — `spell` is the only such case here.
 * Spanish glosses use Colombian usage; alts exist so a correct answer phrased a
 * different way is never marked wrong.
 *
 * ─── Adding a verb ───────────────────────────────────────────────────────────
 *
 * Append an entry to the array below. Nothing else needs touching: the exercise
 * builder, the distractors and the full table all read from here, and the `Verb`
 * type refuses to compile if a required field is missing.
 *
 *   id           Unique slug. Use the base form. It is what progress is keyed by,
 *                so changing an existing id loses that verb's history.
 *   base         Infinitive, without "to".
 *   past         Past simple.
 *   participle   Past participle.
 *   es           The ONE Spanish meaning shown when the answer is revealed. Pick
 *                the most common Colombian reading, not the most literal one.
 *   pattern      "ABB" when past and participle match (spend/spent/spent),
 *                "ABC" when all three differ (swim/swam/swum). This is what makes
 *                the multiple-choice distractors plausible, so it must be right.
 *   regular      Optional. True only if the verb ALSO takes the regular -ed form
 *                in American English. Today only `spell` qualifies.
 *
 * The three *Alt lists are answers that are ACCEPTED but never SHOWN. They exist
 * so a right answer worded differently is not marked wrong; they are not extra
 * things to memorise.
 *
 *   esAlt          Other Spanish translations that should count as correct.
 *   pastAlt        Other accepted past-simple spellings (British, mostly).
 *   participleAlt  The same, for the participle.
 *
 * A full example:
 *
 *   {
 *     id: "sing",
 *     base: "sing",
 *     past: "sang",
 *     participle: "sung",
 *     es: "cantar",
 *     pattern: "ABC",           // sing / sang / sung → the three differ
 *     esAlt: ["entonar"],       // accepted if she types it, never displayed
 *   },
 *
 * One caution about `es` and `esAlt`: Spanish is graded without accents, so
 * `enseñar` and `ensenar` both pass. Do not add an unaccented duplicate to the
 * alt list — it is already covered.
 */
export const VERBS: Verb[] = [
	{
		id: "spell",
		base: "spell",
		past: "spelled",
		participle: "spelled",
		es: "deletrear",
		pattern: "ABB",
		regular: true,
		esAlt: ["ortografiar", "escribir letra por letra"],
		pastAlt: ["spelt"],
		participleAlt: ["spelt"],
	},
	{
		id: "spend",
		base: "spend",
		past: "spent",
		participle: "spent",
		es: "gastar",
		pattern: "ABB",
		esAlt: ["pasar", "pasar tiempo", "gastar dinero", "invertir"],
	},
	{
		id: "stand",
		base: "stand",
		past: "stood",
		participle: "stood",
		es: "pararse",
		pattern: "ABB",
		esAlt: [
			"estar de pie",
			"ponerse de pie",
			"soportar",
			"aguantar",
			"pararse",
		],
	},
	{
		id: "steal",
		base: "steal",
		past: "stole",
		participle: "stolen",
		es: "robar",
		pattern: "ABC",
		esAlt: ["hurtar"],
	},
	{
		id: "swim",
		base: "swim",
		past: "swam",
		participle: "swum",
		es: "nadar",
		pattern: "ABC",
	},
	{
		id: "take",
		base: "take",
		past: "took",
		participle: "taken",
		es: "tomar",
		pattern: "ABC",
		esAlt: ["llevar", "coger", "agarrar"],
	},
	{
		id: "teach",
		base: "teach",
		past: "taught",
		participle: "taught",
		es: "enseñar",
		pattern: "ABB",
		esAlt: ["dar clase", "instruir"],
	},
	{
		id: "tell",
		base: "tell",
		past: "told",
		participle: "told",
		es: "contar",
		pattern: "ABB",
		esAlt: ["decir", "avisar", "relatar"],
	},
	{
		id: "think",
		base: "think",
		past: "thought",
		participle: "thought",
		es: "pensar",
		pattern: "ABB",
		esAlt: ["creer", "opinar", "reflexionar"],
	},
	{
		id: "throw",
		base: "throw",
		past: "threw",
		participle: "thrown",
		es: "lanzar",
		pattern: "ABC",
		esAlt: ["tirar", "arrojar", "botar"],
	},
	{
		id: "understand",
		base: "understand",
		past: "understood",
		participle: "understood",
		es: "entender",
		pattern: "ABB",
		esAlt: ["comprender"],
	},
	{
		id: "wake",
		base: "wake",
		past: "woke",
		participle: "woken",
		es: "despertarse",
		pattern: "ABC",
		esAlt: ["despertar", "levantarse", "despertarme"],
	},
	{
		id: "wear",
		base: "wear",
		past: "wore",
		participle: "worn",
		es: "usar",
		pattern: "ABC",
		esAlt: ["llevar puesto", "vestir", "ponerse", "llevar"],
	},
	{
		id: "win",
		base: "win",
		past: "won",
		participle: "won",
		es: "ganar",
		pattern: "ABB",
		esAlt: ["vencer", "triunfar"],
	},
	{
		id: "write",
		base: "write",
		past: "wrote",
		participle: "written",
		es: "escribir",
		pattern: "ABC",
		esAlt: ["redactar"],
	},
];

export const BY_ID = new Map(VERBS.map((v) => [v.id, v]));

export function getVerb(id: string): Verb | undefined {
	return BY_ID.get(id);
}
