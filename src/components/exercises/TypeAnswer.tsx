import { useEffect, useRef, useState } from "react";
import { FIELD_LABEL } from "../../lib/exercises";
import { SpeakButton } from "../SpeakButton";
import type { TypeExercise } from "../../lib/types";

interface Props {
	exercise: TypeExercise;
	locked: boolean;
	onSubmit: (answers: string[]) => void;
}

export function TypeAnswer({ exercise, locked, onSubmit }: Props) {
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// A fresh question means a fresh, focused field. Without keying on the id the
	// previous answer would linger and the learner would submit it by reflex.
	useEffect(() => {
		setValue("");
		inputRef.current?.focus();
	}, [exercise.id]);

	const clue = exercise.verb[exercise.given];

	return (
		<form
			className="exercise"
			onSubmit={(event) => {
				event.preventDefault();
				if (locked || value.trim() === "") return;
				onSubmit([value]);
			}}
		>
			<p className="exercise__instruction">
				Escribe el <strong>{FIELD_LABEL[exercise.ask]}</strong>
			</p>

			<p className="exercise__clue">
				<span className="exercise__clue-label">
					{FIELD_LABEL[exercise.given]}
				</span>
				<span className="exercise__clue-value">
					{clue}
					{/* Only the English columns get a speaker, and only because the clue
					    is already on screen — reading out a form she has not produced
					    yet would hand her the answer. */}
					{exercise.given !== "es" && (
						<SpeakButton words={[clue]} size="sm" />
					)}
				</span>
			</p>

			<input
				ref={inputRef}
				className="exercise__input"
				type="text"
				value={value}
				onChange={(event) => setValue(event.target.value)}
				disabled={locked}
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck={false}
				// The Spanish column is the only one typed in Spanish; everything else
				// is English, and telling the keyboard so fixes mobile autocorrect.
				lang={exercise.ask === "es" ? "es" : "en"}
				aria-label={`${FIELD_LABEL[exercise.ask]} de ${clue}`}
				placeholder="…"
			/>

			<button className="btn btn--primary" type="submit" disabled={locked || value.trim() === ""}>
				Comprobar
			</button>
		</form>
	);
}
