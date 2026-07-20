import { useEffect, useRef } from "react";
import { getVerb } from "../data/verbs";
import type { AccessoryId } from "../lib/accessories";
import { MISSES_TITLE, TIMED_OUT_NOTE, verdict } from "../lib/copy";
import { FIELD_LABEL } from "../lib/exercises";
import { playFinish } from "../lib/sound";
import type { Attempt, SessionMode } from "../lib/types";
import { KittenStage } from "./KittenStage";
import type { BurstKind } from "./Particles";

interface Props {
	attempts: Attempt[];
	mode: SessionMode;
	timedOut: boolean;
	/** Ids of verbs missed at least once, for the review round. */
	missedVerbIds: string[];
	accessory: AccessoryId | null;
	onPet: (x: number, y: number) => void;
	onBurst: (kind: BurstKind, x?: number, y?: number) => void;
	onReviewMissed: () => void;
	onHome: () => void;
}

export function Results({
	attempts,
	mode,
	timedOut,
	missedVerbIds,
	accessory,
	onPet,
	onBurst,
	onReviewMissed,
	onHome,
}: Props) {
	const total = attempts.length;
	const right = attempts.filter((a) => a.correct).length;
	const percent = total === 0 ? 0 : Math.round((right / total) * 100);
	const wrong = attempts.filter((a) => !a.correct);

	const mood = percent >= 90 ? "celebrate" : percent >= 60 ? "happy" : "sad";

	const played = useRef(false);

	// Once per mount. React 18+ runs effects twice in StrictMode during
	// development, and without the guard the fanfare stacks on itself.
	useEffect(() => {
		if (played.current) return;
		played.current = true;
		playFinish(percent >= 60);
		if (percent >= 60) {
			onBurst(percent >= 90 ? "paws" : "confetti");
		}
	}, [percent, onBurst]);

	return (
		<section className="results">
			<KittenStage
				mood={mood}
				size={150}
				accessory={accessory}
				onPet={onPet}
			/>

			<h2 className="results__score">
				{right} <span>/ {total}</span>
			</h2>
			<p className="results__percent">{percent}%</p>

			{timedOut && (
				<p className="results__note results__note--warn">{TIMED_OUT_NOTE}</p>
			)}

			<p className="results__verdict">{verdict(percent, mode)}</p>

			{wrong.length > 0 && (
				<div className="misses">
					<h3 className="misses__title">{MISSES_TITLE}</h3>
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
						Repasar {missedVerbIds.length}{" "}
						{missedVerbIds.length === 1 ? "verbo" : "verbos"}
					</button>
				)}
				<button className="btn btn--ghost" type="button" onClick={onHome}>
					Volver al inicio
				</button>
			</div>
		</section>
	);
}
