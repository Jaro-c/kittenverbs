import { useEffect, useRef, useState } from "react";
import { FIELD_LABEL } from "../../lib/exercises";
import type { Field, RowExercise } from "../../lib/types";
import type { Reaction } from "../../lib/reaction";
import { reactionClass } from "../../lib/reaction";

const COLUMNS: Field[] = ["base", "past", "participle", "es"];

interface Props {
	exercise: RowExercise;
	locked: boolean;
	onSubmit: (answers: string[]) => void;
	/** Null in the exam, always: the card must not twitch either. */
	reaction: Reaction;
}

/**
 * The written-exam format: the whole row is on screen and the missing cells get
 * filled in. Showing the row rather than one isolated prompt is the point —
 * it is how the paper will look tomorrow.
 */
export function CompleteRow({ exercise, locked, onSubmit, reaction }: Props) {
	const [values, setValues] = useState<Record<string, string>>({});
	const firstRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setValues({});
		firstRef.current?.focus();
	}, [exercise.id]);

	const answers = exercise.blanks.map((field) => values[field] ?? "");
	const ready = answers.every((value) => value.trim() !== "");

	return (
		<form
			className={`exercise${reactionClass(reaction)}`}
			onSubmit={(event) => {
				event.preventDefault();
				if (locked || !ready) return;
				onSubmit(answers);
			}}
		>
			<p className="exercise__instruction">
				Completa la fila{" "}
				<strong>
					({exercise.blanks.length}{" "}
					{exercise.blanks.length === 1 ? "casilla" : "casillas"})
				</strong>
			</p>

			<div className="row-grid" role="group" aria-label="Fila del verbo">
				{COLUMNS.map((field) => {
					const isBlank = exercise.blanks.includes(field);
					const blankIndex = exercise.blanks.indexOf(field);
					return (
						<div className="row-cell" key={field}>
							<span className="row-cell__label">{FIELD_LABEL[field]}</span>
							{isBlank ? (
								<input
									ref={blankIndex === 0 ? firstRef : undefined}
									className="row-cell__input"
									type="text"
									value={values[field] ?? ""}
									onChange={(event) =>
										setValues((previous) => ({
											...previous,
											[field]: event.target.value,
										}))
									}
									disabled={locked}
									autoComplete="off"
									autoCorrect="off"
									autoCapitalize="off"
									spellCheck={false}
									lang={field === "es" ? "es" : "en"}
									aria-label={FIELD_LABEL[field]}
									placeholder="?"
								/>
							) : (
								<span className="row-cell__given">{exercise.verb[field]}</span>
							)}
						</div>
					);
				})}
			</div>

			<button className="btn btn--primary" type="submit" disabled={locked || !ready}>
				Comprobar
			</button>
		</form>
	);
}
