import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canonicalAnswer, isCorrect, isNearMiss } from "../lib/check";
import { FIELD_LABEL } from "../lib/exercises";
import type { Attempt, Exercise, Field, SessionMode } from "../lib/types";
import {
	playCorrect,
	playStreak,
	playTick,
	playWrong,
} from "../lib/sound";
import { ChoiceGrid } from "./exercises/ChoiceGrid";
import { CompleteRow } from "./exercises/CompleteRow";
import { TypeAnswer } from "./exercises/TypeAnswer";
import { Kitten, type Mood } from "./Kitten";
import { Particles, type Burst } from "./Particles";
import { SoundToggle } from "./SoundToggle";

interface Props {
	exercises: Exercise[];
	mode: SessionMode;
	/** Total seconds for the whole run. Only used in exam mode. */
	timeLimitSec?: number;
	onFinish: (attempts: Attempt[], timedOut: boolean) => void;
	onQuit: () => void;
}

interface Feedback {
	correct: boolean;
	nearMiss: boolean;
	expected: string[];
	asked: Field[];
}

/** Which fields a given exercise grades, in the order they are answered. */
function askedFields(exercise: Exercise): Field[] {
	return exercise.kind === "row" ? exercise.blanks : [exercise.ask];
}

export function Session({
	exercises,
	mode,
	timeLimitSec,
	onFinish,
	onQuit,
}: Props) {
	const [index, setIndex] = useState(0);
	const [attempts, setAttempts] = useState<Attempt[]>([]);
	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const [picked, setPicked] = useState<string | null>(null);
	const [streak, setStreak] = useState(0);
	const [remaining, setRemaining] = useState(timeLimitSec ?? 0);
	const [burst, setBurst] = useState<Burst | null>(null);

	const shownAt = useRef(Date.now());
	const kittenRef = useRef<HTMLDivElement>(null);
	const burstId = useRef(0);
	const continueRef = useRef<HTMLButtonElement>(null);
	// onFinish is called from inside the timer effect; holding it in a ref keeps
	// the countdown from resetting every time the parent re-renders.
	const finishRef = useRef(onFinish);
	finishRef.current = onFinish;

	const exercise = exercises[index];
	const isLast = index === exercises.length - 1;

	useEffect(() => {
		shownAt.current = Date.now();
	}, [index]);

	// ─── Exam countdown ────────────────────────────────────────────────────────
	const attemptsRef = useRef(attempts);
	attemptsRef.current = attempts;

	useEffect(() => {
		if (mode !== "exam" || !timeLimitSec) return;
		const id = setInterval(() => {
			setRemaining((left) => {
				if (left <= 1) {
					clearInterval(id);
					finishRef.current(attemptsRef.current, true);
					return 0;
				}
				return left - 1;
			});
		}, 1000);
		return () => clearInterval(id);
	}, [mode, timeLimitSec]);

	const advance = useCallback(
		(nextAttempts: Attempt[]) => {
			setFeedback(null);
			setPicked(null);
			if (isLast) {
				finishRef.current(nextAttempts, false);
			} else {
				setIndex((i) => i + 1);
			}
		},
		[isLast],
	);

	/** Spawns particles from wherever the cat currently is on screen. */
	const fireBurst = (kind: Burst["kind"]) => {
		const box = kittenRef.current?.getBoundingClientRect();
		burstId.current += 1;
		setBurst({
			id: burstId.current,
			kind,
			x: box ? box.left + box.width / 2 : undefined,
			y: box ? box.top + box.height / 2 : undefined,
		});
	};

	const handleSubmit = (given: string[]) => {
		const fields = askedFields(exercise);
		const correct = fields.every((field, i) =>
			isCorrect(given[i] ?? "", exercise.verb, field),
		);
		const nearMiss =
			!correct &&
			fields.some((field, i) => isNearMiss(given[i] ?? "", exercise.verb, field));

		const attempt: Attempt = {
			exerciseId: exercise.id,
			verbId: exercise.verb.id,
			ask: fields,
			given,
			expected: fields.map((field) => canonicalAnswer(exercise.verb, field)),
			correct,
			elapsedMs: Date.now() - shownAt.current,
		};
		const nextAttempts = [...attempts, attempt];
		const nextStreak = correct ? streak + 1 : 0;
		setAttempts(nextAttempts);
		setStreak(nextStreak);
		if (exercise.kind === "choice") setPicked(given[0]);

		// In exam mode nothing is revealed mid-run: seeing the answer would turn
		// the remaining questions into a reading exercise and the final score
		// would stop meaning anything. Audio has to honour the same rule — a
		// rising chime after every right answer would announce the score one
		// question at a time, so the exam gets a neutral tick and nothing else.
		if (mode === "exam") {
			playTick();
			advance(nextAttempts);
			return;
		}

		if (correct) {
			if (nextStreak >= 3) playStreak();
			else playCorrect();
			fireBurst(nextStreak >= 3 ? "paws" : "confetti");
		} else {
			playWrong();
		}

		setFeedback({
			correct,
			nearMiss,
			expected: attempt.expected,
			asked: fields,
		});
	};

	useEffect(() => {
		if (feedback) continueRef.current?.focus();
	}, [feedback]);

	const mood: Mood = useMemo(() => {
		if (!feedback) return mode === "exam" ? "thinking" : "idle";
		if (!feedback.correct) return "sad";
		return streak >= 3 ? "celebrate" : "happy";
	}, [feedback, streak, mode]);

	if (!exercise) return null;

	const progressPercent = Math.round((index / exercises.length) * 100);

	return (
		<section className="session">
			<Particles burst={burst} />

			<header className="session__bar">
				<button className="btn btn--ghost" type="button" onClick={onQuit}>
					Salir
				</button>

				<div
					className="progress"
					role="progressbar"
					aria-valuenow={index}
					aria-valuemin={0}
					aria-valuemax={exercises.length}
					aria-label="Progreso de la sesión"
				>
					<div className="progress__fill" style={{ width: `${progressPercent}%` }} />
				</div>

				{mode === "exam" && timeLimitSec ? (
					<span
						className={`timer${remaining <= 30 ? " timer--urgent" : ""}`}
						aria-live="off"
					>
						{formatClock(remaining)}
					</span>
				) : (
					<span className="streak" aria-label={`Racha de ${streak}`}>
						🔥 {streak}
					</span>
				)}

				<SoundToggle compact />
			</header>

			<div className="session__stage">
				<div ref={kittenRef}>
					<Kitten mood={mood} size={140} />
				</div>

				<span className="session__count">
					{index + 1} / {exercises.length}
				</span>

				{exercise.kind === "type" && (
					<TypeAnswer
						exercise={exercise}
						locked={feedback !== null}
						onSubmit={handleSubmit}
					/>
				)}
				{exercise.kind === "choice" && (
					<ChoiceGrid
						exercise={exercise}
						locked={feedback !== null}
						picked={picked}
						correctAnswer={canonicalAnswer(exercise.verb, exercise.ask)}
						onSubmit={handleSubmit}
					/>
				)}
				{exercise.kind === "row" && (
					<CompleteRow
						exercise={exercise}
						locked={feedback !== null}
						onSubmit={handleSubmit}
					/>
				)}
			</div>

			{feedback && (
				<footer
					className={`feedback ${feedback.correct ? "feedback--ok" : "feedback--bad"}`}
					role="status"
				>
					<div className="feedback__text">
						<strong>
							{feedback.correct
								? pickPraise(streak)
								: feedback.nearMiss
									? "Casi — revisa la escritura"
									: "No era esa"}
						</strong>
						{!feedback.correct && (
							<span>
								{feedback.asked.map((field, i) => (
									<span key={field} className="feedback__answer">
										{FIELD_LABEL[field]}: <b>{feedback.expected[i]}</b>
									</span>
								))}
							</span>
						)}
					</div>
					<button
						ref={continueRef}
						className="btn btn--primary"
						type="button"
						onClick={() => advance(attempts)}
					>
						{isLast ? "Ver resultado" : "Continuar"}
					</button>
				</footer>
			)}
		</section>
	);
}

function formatClock(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

const PRAISE = ["¡Bien!", "¡Correcto!", "¡Eso es!", "¡Exacto!"];

function pickPraise(streak: number): string {
	if (streak >= 5) return `¡${streak} seguidas! 🔥`;
	return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}
