import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AccessoryId } from "../lib/accessories";
import { canonicalAnswer, isCorrect, isNearMiss } from "../lib/check";
import { missLine, praiseLine } from "../lib/copy";
import { FIELD_LABEL } from "../lib/exercises";
import { buzzCorrect, buzzWrong } from "../lib/haptics";
import type { Reaction } from "../lib/reaction";
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
import { type Mood } from "./Kitten";
import { KittenStage } from "./KittenStage";
import type { BurstKind } from "./Particles";
import { SoundToggle } from "./SoundToggle";

interface Props {
	exercises: Exercise[];
	mode: SessionMode;
	/** Total seconds for the whole run. Only used in exam mode. */
	timeLimitSec?: number;
	accessory: AccessoryId | null;
	onPet: (x: number, y: number) => void;
	onBurst: (kind: BurstKind, x?: number, y?: number) => void;
	onFinish: (attempts: Attempt[], timedOut: boolean) => void;
	onQuit: () => void;
	/** How many answers are in, so the leave prompt can name the question. */
	onProgress?: (answered: number) => void;
}

interface Feedback {
	correct: boolean;
	nearMiss: boolean;
	expected: string[];
	asked: Field[];
	/**
	 * Chosen when the answer is graded, not while rendering. Picking a random
	 * line inside the JSX would reword itself on every re-render — the timer tick
	 * alone would reshuffle it once a second.
	 */
	line: string;
}

/** Which fields a given exercise grades, in the order they are answered. */
function askedFields(exercise: Exercise): Field[] {
	return exercise.kind === "row" ? exercise.blanks : [exercise.ask];
}

export function Session({
	exercises,
	mode,
	timeLimitSec,
	accessory,
	onPet,
	onBurst,
	onFinish,
	onQuit,
	onProgress,
}: Props) {
	const [index, setIndex] = useState(0);
	const [attempts, setAttempts] = useState<Attempt[]>([]);
	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const [picked, setPicked] = useState<string | null>(null);
	const [streak, setStreak] = useState(0);
	const [remaining, setRemaining] = useState(timeLimitSec ?? 0);

	const shownAt = useRef(Date.now());
	const kittenRef = useRef<HTMLDivElement>(null);
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
	const fireBurst = (kind: BurstKind) => {
		const box = kittenRef.current?.getBoundingClientRect();
		onBurst(
			kind,
			box ? box.left + box.width / 2 : undefined,
			box ? box.top + box.height / 2 : undefined,
		);
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
		onProgress?.(nextAttempts.length);
		setStreak(nextStreak);
		if (exercise.kind === "choice") setPicked(given[0]);

		// In exam mode nothing is revealed mid-run: seeing the answer would turn
		// the remaining questions into a reading exercise and the final score
		// would stop meaning anything. Audio has to honour the same rule — a
		// rising chime after every right answer would announce the score one
		// question at a time, so the exam gets a neutral tick and nothing else.
		//
		// The same applies to the phone in her hand. A buzz she can tell apart
		// from another buzz is a channel exactly like sound or colour, and a
		// silent phone in a quiet exam room is the channel MOST likely to be the
		// one still being read. This early return is the single gate: every
		// reaction added below it — feedback, particles, the card's knock, the
		// vibration — is unreachable during a simulacro by construction.
		if (mode === "exam") {
			playTick();
			advance(nextAttempts);
			return;
		}

		if (correct) {
			if (nextStreak >= 3) playStreak();
			else playCorrect();
			buzzCorrect();
			fireBurst(nextStreak >= 3 ? "paws" : "confetti");
		} else {
			playWrong();
			buzzWrong();
		}

		setFeedback({
			correct,
			nearMiss,
			expected: attempt.expected,
			asked: fields,
			line: correct ? praiseLine(nextStreak) : missLine(nearMiss),
		});
	};

	useEffect(() => {
		if (feedback) continueRef.current?.focus();
	}, [feedback]);

	/**
	 * Derived from the feedback object rather than from `correct` and `mode`,
	 * which is what makes it exam-proof: in the exam `feedback` is never set, so
	 * this is null for the whole run without a single mode check.
	 */
	const reaction: Reaction = feedback ? (feedback.correct ? "right" : "wrong") : null;

	const mood: Mood = useMemo(() => {
		if (!feedback) return mode === "exam" ? "thinking" : "idle";
		if (!feedback.correct) return "sad";
		return streak >= 3 ? "celebrate" : "happy";
	}, [feedback, streak, mode]);

	if (!exercise) return null;

	const progressPercent = Math.round((index / exercises.length) * 100);

	return (
		<section className="session">
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
					// Keyed on the number so React replaces the node when it moves,
					// which is what replays the keyframe. A CSS class toggled on and
					// off in an effect would need a frame in between to restart, and
					// would sometimes silently skip.
					<span
						key={streak}
						className={`streak${streak > 0 ? " streak--up" : ""}`}
						aria-label={`Racha de ${streak}`}
					>
						🔥 {streak}
					</span>
				)}

				<SoundToggle compact />
			</header>

			<div className="session__stage">
				{/* The mood prop is the ONLY thing that reacts to an answer, and in
				    exam mode it never leaves "thinking". Petting is hers to start, so
				    it stays available even here: it reveals nothing about the score. */}
				<div ref={kittenRef}>
					<KittenStage
						mood={mood}
						size={140}
						accessory={accessory}
						onPet={onPet}
					/>
				</div>

				<span className="session__count">
					{index + 1} / {exercises.length}
				</span>

				{exercise.kind === "type" && (
					<TypeAnswer
						exercise={exercise}
						locked={feedback !== null}
						onSubmit={handleSubmit}
						reaction={reaction}
					/>
				)}
				{exercise.kind === "choice" && (
					<ChoiceGrid
						exercise={exercise}
						locked={feedback !== null}
						picked={picked}
						correctAnswer={canonicalAnswer(exercise.verb, exercise.ask)}
						onSubmit={handleSubmit}
						reaction={reaction}
					/>
				)}
				{exercise.kind === "row" && (
					<CompleteRow
						exercise={exercise}
						locked={feedback !== null}
						onSubmit={handleSubmit}
						reaction={reaction}
					/>
				)}
			</div>

			{feedback && (
				<footer
					className={`feedback ${feedback.correct ? "feedback--ok" : "feedback--bad"}`}
					role="status"
				>
					<div className="feedback__text">
						<strong>{feedback.line}</strong>
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
