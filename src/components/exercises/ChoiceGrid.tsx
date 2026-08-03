import { useEffect, useRef } from "react";
import { FIELD_LABEL } from "../../lib/exercises";
import { LangBadge } from "../LangBadge";
import { SpeakButton } from "../SpeakButton";
import type { ChoiceExercise } from "../../lib/types";
import type { Reaction } from "../../lib/reaction";
import { reactionClass } from "../../lib/reaction";

interface Props {
	exercise: ChoiceExercise;
	locked: boolean;
	/** Set once answered, so the picked option can be marked. */
	picked: string | null;
	correctAnswer: string;
	onSubmit: (answers: string[]) => void;
	/** Null in the exam, always: the card must not twitch either. */
	reaction: Reaction;
}

export function ChoiceGrid({
	exercise,
	locked,
	picked,
	correctAnswer,
	onSubmit,
	reaction,
}: Props) {
	const firstRef = useRef<HTMLButtonElement>(null);

	// The other two exercise kinds focus their input on a fresh question; this
	// one didn't, so a keyboard-only round worked for one question and then
	// dropped focus back to the top of the page on every single one after —
	// tabbing past Salir, the sound toggle and the cat just to reach an answer
	// again. Same fix, same reason: `option` is the button's key, and a new
	// question means new option strings, so React mounts fresh buttons rather
	// than reusing focus-holding ones.
	useEffect(() => {
		firstRef.current?.focus();
	}, [exercise.id]);

	const clue = exercise.verb[exercise.given];

	return (
		<div className={`exercise${reactionClass(reaction)}`}>
			<p className="exercise__instruction">
				Elige el <strong>{FIELD_LABEL[exercise.ask]}</strong>
				<LangBadge field={exercise.ask} />
			</p>

			<p className="exercise__clue">
				<span className="exercise__clue-label">
					{FIELD_LABEL[exercise.given]}
					<LangBadge field={exercise.given} />
				</span>
				<span className="exercise__clue-value">
					{clue}
					{exercise.given !== "es" && <SpeakButton words={[clue]} size="sm" />}
				</span>
			</p>

			<div className="choices">
				{exercise.options.map((option, i) => {
					const isPicked = picked === option;
					const isAnswer = option === correctAnswer;
					// After answering, always reveal which one was right — otherwise a
					// wrong pick teaches only that the guess failed, not what to learn.
					const state = !locked
						? ""
						: isAnswer
							? " choice--correct"
							: isPicked
								? " choice--wrong"
								: " choice--muted";
					return (
						<button
							key={option}
							ref={i === 0 ? firstRef : undefined}
							type="button"
							className={`choice${state}`}
							disabled={locked}
							onClick={() => onSubmit([option])}
						>
							{option}
						</button>
					);
				})}
			</div>
		</div>
	);
}
