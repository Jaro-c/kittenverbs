/**
 * How the exercise card answers back.
 *
 * Right and wrong used to differ almost only in colour, which puts the whole
 * weight of the most important moment in the app on one channel — and the
 * weakest one, since it is also the channel a colour-blind eye and a washed-out
 * phone screen in sunlight both lose first. A knock and a hop are read by the
 * part of the brain that does not need to be looking directly at the card.
 *
 * `null` is not an absence of feedback, it is the exam. In `mode === "exam"` the
 * Session never produces a Feedback object at all, so this can only ever be null
 * there — the invariant is enforced by the shape of the data, not by remembering
 * to check for it at four call sites.
 */
export type Reaction = "right" | "wrong" | null;

export function reactionClass(reaction: Reaction): string {
	return reaction === null ? "" : ` exercise--${reaction}`;
}
