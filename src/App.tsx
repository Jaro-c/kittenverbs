import { useCallback, useEffect, useMemo, useState } from "react";
import { Home } from "./components/Home";
import { Results } from "./components/Results";
import { Session } from "./components/Session";
import { buildSession } from "./lib/exercises";
import {
	loadProgress,
	recordSession,
	resetProgress,
	saveProgress,
	weakestVerbIds,
	type Progress,
} from "./lib/storage";
import type { Attempt, Exercise, SessionMode } from "./lib/types";
import "./app.css";

const EXAM_SIZE = 15;
const EXAM_SECONDS = 450; // 7:30 — thirty seconds a question.

type Screen =
	| { name: "home" }
	| { name: "session"; exercises: Exercise[]; mode: SessionMode }
	| { name: "results"; attempts: Attempt[]; mode: SessionMode; timedOut: boolean };

export default function App() {
	const [screen, setScreen] = useState<Screen>({ name: "home" });
	const [progress, setProgress] = useState<Progress>(loadProgress);

	useEffect(() => {
		saveProgress(progress);
	}, [progress]);

	const weakIds = useMemo(() => weakestVerbIds(progress, 10), [progress]);

	const startPractice = useCallback((verbIds?: string[]) => {
		setScreen({
			name: "session",
			mode: "practice",
			exercises: buildSession({
				mode: "practice",
				verbIds,
				// A review round of two verbs should still be worth opening, so it
				// asks each of them a few times rather than ending in two taps.
				size: verbIds ? Math.max(verbIds.length * 2, 8) : undefined,
			}),
		});
	}, []);

	const startExam = useCallback(() => {
		setScreen({
			name: "session",
			mode: "exam",
			exercises: buildSession({ mode: "exam", size: EXAM_SIZE }),
		});
	}, []);

	const finish = useCallback(
		(
			attempts: Attempt[],
			timedOut: boolean,
			exercises: Exercise[],
			mode: SessionMode,
		) => {
			// A run cut short by the clock is still scored out of the full paper —
			// grading only what was reached would hand a perfect score to someone
			// who answered three questions and then ran out of time.
			const graded: Attempt[] = timedOut
				? [
						...attempts,
						...exercises.slice(attempts.length).map((exercise) => ({
							exerciseId: exercise.id,
							verbId: exercise.verb.id,
							ask: exercise.kind === "row" ? exercise.blanks : [exercise.ask],
							given: [],
							expected: [],
							correct: false,
							elapsedMs: 0,
						})),
					]
				: attempts;

			const right = graded.filter((a) => a.correct).length;
			const scorePercent =
				graded.length === 0 ? 0 : Math.round((right / graded.length) * 100);

			setProgress((current) =>
				recordSession(
					current,
					graded.map((a) => ({ verbId: a.verbId, correct: a.correct })),
					mode === "exam" ? { scorePercent } : undefined,
				),
			);
			setScreen({ name: "results", attempts: graded, mode, timedOut });
		},
		[],
	);

	if (screen.name === "session") {
		return (
			<main className="app">
				<Session
					exercises={screen.exercises}
					mode={screen.mode}
					timeLimitSec={screen.mode === "exam" ? EXAM_SECONDS : undefined}
					onFinish={(attempts, timedOut) =>
						finish(attempts, timedOut, screen.exercises, screen.mode)
					}
					onQuit={() => setScreen({ name: "home" })}
				/>
			</main>
		);
	}

	if (screen.name === "results") {
		const missed = [
			...new Set(screen.attempts.filter((a) => !a.correct).map((a) => a.verbId)),
		];
		return (
			<main className="app">
				<Results
					attempts={screen.attempts}
					mode={screen.mode}
					timedOut={screen.timedOut}
					missedVerbIds={missed}
					onReviewMissed={() => startPractice(missed)}
					onHome={() => setScreen({ name: "home" })}
				/>
			</main>
		);
	}

	return (
		<main className="app">
			<Home
				progress={progress}
				weakIds={weakIds}
				onPractice={startPractice}
				onExam={startExam}
				onReset={() => {
					if (!confirm("¿Borrar todo tu progreso?")) return;
					resetProgress();
					setProgress(loadProgress());
				}}
			/>
		</main>
	);
}
