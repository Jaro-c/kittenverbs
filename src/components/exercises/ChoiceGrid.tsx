import { FIELD_LABEL } from "../../lib/exercises";
import type { ChoiceExercise } from "../../lib/types";

interface Props {
	exercise: ChoiceExercise;
	locked: boolean;
	/** Set once answered, so the picked option can be marked. */
	picked: string | null;
	correctAnswer: string;
	onSubmit: (answers: string[]) => void;
}

export function ChoiceGrid({
	exercise,
	locked,
	picked,
	correctAnswer,
	onSubmit,
}: Props) {
	const clue = exercise.verb[exercise.given];

	return (
		<div className="exercise">
			<p className="exercise__instruction">
				Elige el <strong>{FIELD_LABEL[exercise.ask]}</strong>
			</p>

			<p className="exercise__clue">
				<span className="exercise__clue-label">
					{FIELD_LABEL[exercise.given]}
				</span>
				<span className="exercise__clue-value">{clue}</span>
			</p>

			<div className="choices">
				{exercise.options.map((option) => {
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
