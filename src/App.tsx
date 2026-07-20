import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home } from "./components/Home";
import { Particles, type Burst, type BurstKind } from "./components/Particles";
import { Results } from "./components/Results";
import { Screen } from "./components/Screen";
import { Session } from "./components/Session";
import { UnlockToast } from "./components/UnlockToast";
import type { AccessoryId } from "./lib/accessories";
import { syncAchievements, type Achievement } from "./lib/achievements";
import { buildSession } from "./lib/exercises";
import {
	loadProgress,
	recordPet,
	recordSession,
	resetProgress,
	saveProgress,
	wearAccessory,
	weakestVerbIds,
	type Progress,
} from "./lib/storage";
import type { Attempt, Exercise, SessionMode } from "./lib/types";
import "./app.css";

const EXAM_SIZE = 15;
const EXAM_SECONDS = 450; // 7:30 — thirty seconds a question.

type ScreenState =
	| { name: "home" }
	| { name: "session"; exercises: Exercise[]; mode: SessionMode }
	| { name: "results"; attempts: Attempt[]; mode: SessionMode; timedOut: boolean };

export default function App() {
	const [screen, setScreen] = useState<ScreenState>({ name: "home" });
	const [progress, setProgress] = useState<Progress>(loadProgress);
	const [burst, setBurst] = useState<Burst | null>(null);
	const [unlocks, setUnlocks] = useState<Achievement[]>([]);
	const burstId = useRef(0);

	useEffect(() => {
		saveProgress(progress);
	}, [progress]);

	// Milestones are checked here and not at the end of a run, because not all of
	// them come from a run: the fiftieth caress can land on any screen.
	// syncAchievements returns the very same object when nothing changed, so this
	// effect cannot loop on its own output.
	useEffect(() => {
		const { progress: next, newly } = syncAchievements(progress);
		if (newly.length === 0) return;
		setProgress(next);
		setUnlocks((queued) => {
			// StrictMode runs this effect twice on mount; without the id check a
			// milestone reached before the app opened would announce itself twice.
			const seen = new Set(queued.map((a) => a.id));
			const add = newly.filter((a) => !seen.has(a.id));
			return add.length === 0 ? queued : [...queued, ...add];
		});
	}, [progress]);

	const weakIds = useMemo(() => weakestVerbIds(progress, 10), [progress]);

	/**
	 * One particle canvas for the whole app, driven from here.
	 *
	 * It used to live inside Session and Results, which left the home screen with
	 * no way to throw anything — and petting the cat has to work wherever the cat
	 * is. One overlay also means one resize listener instead of three.
	 */
	const fire = useCallback((kind: BurstKind, x?: number, y?: number) => {
		burstId.current += 1;
		setBurst({ id: burstId.current, kind, x, y });
	}, []);

	const pet = useCallback(
		(x: number, y: number) => {
			fire("hearts", x, y);
			setProgress(recordPet);
		},
		[fire],
	);

	const wear = useCallback((accessory: AccessoryId | null) => {
		setProgress((current) => wearAccessory(current, accessory));
	}, []);

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

	const dismissUnlock = useCallback(
		() => setUnlocks((queued) => queued.slice(1)),
		[],
	);

	// The card is fixed to the bottom of the viewport, so on a short screen it
	// parks itself on top of the primary button. Reserving the room while one is
	// queued keeps every action reachable instead of hidden for seven seconds.
	const shellClass = `app${unlocks.length > 0 ? " app--toast" : ""}`;

	// The same on every screen: the canvas that never takes a click, and the one
	// milestone card at the front of the queue.
	const overlays = (
		<>
			<Particles burst={burst} />
			{unlocks[0] && (
				<UnlockToast
					key={unlocks[0].id}
					achievement={unlocks[0]}
					onWear={wear}
					onDismiss={dismissUnlock}
				/>
			)}
		</>
	);

	if (screen.name === "session") {
		return (
			<main className={shellClass}>
				<Screen name="session">
					<Session
						exercises={screen.exercises}
						mode={screen.mode}
						timeLimitSec={screen.mode === "exam" ? EXAM_SECONDS : undefined}
						accessory={progress.accessory}
						onPet={pet}
						onBurst={fire}
						onFinish={(attempts, timedOut) =>
							finish(attempts, timedOut, screen.exercises, screen.mode)
						}
						onQuit={() => setScreen({ name: "home" })}
					/>
				</Screen>
				{overlays}
			</main>
		);
	}

	if (screen.name === "results") {
		const missed = [
			...new Set(screen.attempts.filter((a) => !a.correct).map((a) => a.verbId)),
		];
		return (
			<main className={shellClass}>
				<Screen name="results">
					<Results
						attempts={screen.attempts}
						mode={screen.mode}
						timedOut={screen.timedOut}
						missedVerbIds={missed}
						accessory={progress.accessory}
						onPet={pet}
						onBurst={fire}
						onReviewMissed={() => startPractice(missed)}
						onHome={() => setScreen({ name: "home" })}
					/>
				</Screen>
				{overlays}
			</main>
		);
	}

	return (
		<main className={shellClass}>
			<Screen name="home">
				<Home
					progress={progress}
					weakIds={weakIds}
					onPractice={startPractice}
					onExam={startExam}
					onPet={pet}
					onWear={wear}
					onReset={() => {
						if (!confirm("¿Borrar todo tu progreso?")) return;
						resetProgress();
						setProgress(loadProgress());
					}}
				/>
			</Screen>
			{overlays}
		</main>
	);
}
