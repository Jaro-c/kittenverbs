import type { Field } from "../lib/types";
import { FIELD_LANG } from "../lib/exercises";

interface Props {
	field: Field;
}

/**
 * A two-letter pill next to a field label: EN in the brand colour, ES neutral.
 *
 * The label text already said "Past tense" vs "Español", but that reads as
 * just another word in a small uppercase row — easy to skim past mid-exercise,
 * which is exactly the complaint this fixes. Colour is a second channel on top
 * of the text, never the only one: EN/ES stays readable in grayscale too.
 */
export function LangBadge({ field }: Props) {
	const lang = FIELD_LANG[field];
	return (
		<span className={`lang-badge lang-badge--${lang}`}>
			{lang === "es" ? "ES" : "EN"}
		</span>
	);
}
