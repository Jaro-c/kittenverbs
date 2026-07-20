import { useEffect, useRef, useState } from "react";
import { getVerb } from "../data/verbs";
import { FIELD_LABEL } from "../lib/exercises";
import { playFinish } from "../lib/sound";
import type { Attempt, SessionMode } from "../lib/types";
import { Kitten } from "./Kitten";
import { Particles, type Burst } from "./Particles";

interface Props {
	attempts: Attempt[];
	mode: SessionMode;
	timedOut: boolean;
	/** Ids of verbs missed at least once, for the review round. */
	missedVerbIds: string[];
	onReviewMissed: () => void;
	onHome: () => void;
}

export function Results({
	attempts,
	mode,
	timedOut,
	missedVerbIds,
	onReviewMissed,
	onHome,
}: Props) {
	const total = attempts.length;
	const right = attempts.filter((a) => a.correct).length;
	const percent = total === 0 ? 0 : Math.round((right / total) * 100);
	const wrong = attempts.filter((a) => !a.correct);

	const mood = percent >= 90 ? "celebrate" : percent >= 60 ? "happy" : "sad";

	const [burst, setBurst] = useState<Burst | null>(null);
	const played = useRef(false);

	// Once per mount. React 18+ runs effects twice in StrictMode during
	// development, and without the guard the fanfare stacks on itself.
	useEffect(() => {
		if (played.current) return;
		played.current = true;
		playFinish(percent >= 60);
		if (percent >= 60) {
			setBurst({ id: 1, kind: percent >= 90 ? "paws" : "confetti" });
		}
	}, [percent]);

	return (
		<section className="results">
			<Particles burst={burst} />

			<Kitten mood={mood} size={150} />

			<h2 className="results__score">
				{right} <span>/ {total}</span>
			</h2>
			<p className="results__percent">{percent}%</p>

			{timedOut && (
				<p className="results__note results__note--warn">
					Se acabó el tiempo. Las preguntas sin responder cuentan como falladas.
				</p>
			)}

			<p className="results__verdict">{verdict(percent, mode)}</p>

			{wrong.length > 0 && (
				<div className="misses">
					<h3 className="misses__title">Para repasar</h3>
					<ul className="misses__list">
						{wrong.map((attempt, i) => {
							const verb = getVerb(attempt.verbId);
							return (
								<li className="miss" key={`${attempt.exerciseId}-${i}`}>
									<span className="miss__verb">{verb?.base}</span>
									<span className="miss__detail">
										{attempt.ask.map((field, j) => (
											<span key={field}>
												{FIELD_LABEL[field]}:{" "}
												<b className="miss__right">{attempt.expected[j]}</b>
												{attempt.given[j]?.trim() ? (
													<span className="miss__yours">
														{" "}
														(escribiste “{attempt.given[j]}”)
													</span>
												) : null}
											</span>
										))}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			)}

			<div className="results__actions">
				{missedVerbIds.length > 0 && (
					<button className="btn btn--primary" type="button" onClick={onReviewMissed}>
						Repasar los {missedVerbIds.length} fallados
					</button>
				)}
				<button className="btn btn--ghost" type="button" onClick={onHome}>
					Volver al inicio
				</button>
			</div>
		</section>
	);
}

function verdict(percent: number, mode: SessionMode): string {
	if (mode === "exam") {
		if (percent >= 90) return "Listo para mañana.";
		if (percent >= 70) return "Vas bien. Repasa los fallados y repite el simulacro.";
		return "Todavía no. Practica los fallados y vuelve al simulacro.";
	}
	if (percent >= 90) return "Te los sabes. Prueba el simulacro cronometrado.";
	if (percent >= 60) return "Bien encaminado. Otra ronda y quedan.";
	return "Repasa la tabla y vuelve a intentarlo.";
}
