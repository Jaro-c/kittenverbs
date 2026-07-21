import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackgroundCat } from "./components/BackgroundCat";
import { BottomNav } from "./components/BottomNav";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Home } from "./components/Home";
import { RecordsPage } from "./components/RecordsPage";
import { Particles, type Burst, type BurstKind } from "./components/Particles";
import { Results } from "./components/Results";
import { Screen } from "./components/Screen";
import { Session } from "./components/Session";
import { Trophies } from "./components/Trophies";
import { UnlockToast } from "./components/UnlockToast";
import { VerbsPage } from "./components/VerbsPage";
import type { AccessoryId } from "./lib/accessories";
import { syncAchievements, type Achievement } from "./lib/achievements";
import { buildSession } from "./lib/exercises";
import { isSession, useRouter, type RouteName } from "./lib/router";
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

interface LiveSession {
	exercises: Exercise[];
	mode: SessionMode;
}

interface Outcome {
	attempts: Attempt[];
	mode: SessionMode;
	timedOut: boolean;
}

type Prompt = "leave" | "reset" | null;

export default function App() {
	const [progress, setProgress] = useState<Progress>(loadProgress);
	const [session, setSession] = useState<LiveSession | null>(null);
	const [outcome, setOutcome] = useState<Outcome | null>(null);
	const [answered, setAnswered] = useState(0);
	const [prompt, setPrompt] = useState<Prompt>(null);
	const [burst, setBurst] = useState<Burst | null>(null);
	const [unlocks, setUnlocks] = useState<Achievement[]>([]);
	const burstId = useRef(0);

	// A round is "live" while it is being answered. Once the results are up there
	// is nothing left to lose, so leaving needs no warning.
	const live = session !== null && outcome === null;
	const liveRef = useRef(live);
	liveRef.current = live;

	const guard = useCallback((from: RouteName, to: RouteName) => {
		void from;
		void to;
		if (!liveRef.current) return true;
		setPrompt("leave");
		return false;
	}, []);

	const { route, navigate } = useRouter(guard);

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

	const build = useCallback(
		(mode: SessionMode, verbIds?: string[]): LiveSession => ({
			mode,
			exercises: buildSession({
				mode,
				verbIds,
				// A review round of two verbs should still be worth opening, so it
				// asks each of them a few times rather than ending in two taps.
				size:
					mode === "exam"
						? EXAM_SIZE
						: verbIds
							? Math.max(verbIds.length * 2, 8)
							: undefined,
			}),
		}),
		[],
	);

	/**
	 * Keeps the screen in step with the address.
	 *
	 * This is what makes a cold load of /practicar work: there is no round in
	 * memory, so one is built. A round cannot be restored from a URL anyway — the
	 * questions are drawn at random when it starts — so opening the link starts a
	 * fresh round rather than trying to resurrect something that never existed.
	 */
	useEffect(() => {
		if (!isSession(route)) {
			setSession(null);
			setOutcome(null);
			setAnswered(0);
			return;
		}
		const mode: SessionMode = route === "exam" ? "exam" : "practice";
		setSession((current) => (current ? current : build(mode)));
	}, [route, build]);

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

	const start = useCallback(
		(mode: SessionMode, verbIds?: string[]) => {
			setOutcome(null);
			setAnswered(0);
			setSession(build(mode, verbIds));
			const to: RouteName = mode === "exam" ? "exam" : "practice";
			// Replacing when already there keeps "review my misses" from stacking a
			// second identical entry, which would make back land on a dead round.
			navigate(to, { replace: route === to });
		},
		[build, navigate, route],
	);

	const goHome = useCallback(() => {
		setSession(null);
		setOutcome(null);
		setAnswered(0);
		navigate("home");
	}, [navigate]);

	const finish = useCallback(
		(attempts: Attempt[], timedOut: boolean, exercises: Exercise[], mode: SessionMode) => {
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
			setOutcome({ attempts: graded, mode, timedOut });
		},
		[],
	);

	const dismissUnlock = useCallback(
		() => setUnlocks((queued) => queued.slice(1)),
		[],
	);

	const total = session?.exercises.length ?? 0;

	// The card is fixed to the bottom of the viewport, so on a short screen it
	// parks itself on top of the primary button. Reserving the room while one is
	// queued keeps every action reachable instead of hidden for seven seconds.
	const shellClass = `app${unlocks.length > 0 ? " app--toast" : ""}`;

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
			<ConfirmDialog
				open={prompt === "leave"}
				title="¿Dejas la ronda?"
				body={
					answered > 0
						? `Vas por la ${Math.min(answered + 1, total)} de ${total}. Si sales ahora se pierde.`
						: "Todavía no has respondido nada."
				}
				confirmLabel="Salir"
				cancelLabel="Seguir aquí"
				danger
				onConfirm={() => {
					setPrompt(null);
					goHome();
				}}
				onCancel={() => setPrompt(null)}
			/>
			<ConfirmDialog
				open={prompt === "reset"}
				title="¿Borrar tu progreso?"
				body="Se van la racha, los logros y los accesorios. No se puede deshacer."
				confirmLabel="Borrar todo"
				cancelLabel="Mejor no"
				danger
				onConfirm={() => {
					setPrompt(null);
					resetProgress();
					setProgress(loadProgress());
				}}
				onCancel={() => setPrompt(null)}
			/>
		</>
	);

	if (session && outcome) {
		const missed = [
			...new Set(outcome.attempts.filter((a) => !a.correct).map((a) => a.verbId)),
		];
		return (
			<main className={shellClass}>
				<Screen name="results">
					<Results
						attempts={outcome.attempts}
						mode={outcome.mode}
						timedOut={outcome.timedOut}
						missedVerbIds={missed}
						accessory={progress.accessory}
						onPet={pet}
						onBurst={fire}
						onReviewMissed={() => start("practice", missed)}
						onHome={goHome}
					/>
				</Screen>
				{overlays}
			</main>
		);
	}

	if (session) {
		return (
			<main className={shellClass}>
				<Screen name="session">
					<Session
						key={session.exercises[0]?.id ?? "empty"}
						exercises={session.exercises}
						mode={session.mode}
						timeLimitSec={session.mode === "exam" ? EXAM_SECONDS : undefined}
						accessory={progress.accessory}
						onPet={pet}
						onBurst={fire}
						onProgress={setAnswered}
						onFinish={(attempts, timedOut) =>
							finish(attempts, timedOut, session.exercises, session.mode)
						}
						onQuit={() => setPrompt("leave")}
					/>
				</Screen>
				{overlays}
			</main>
		);
	}

	// Everything below is a place she can be, so it all gets the nav bar. The two
	// session screens above return before this and deliberately do not: the only
	// ways out of a live round are Salir and the back gesture, and both ask first.
	return (
		<main className={`${shellClass} app--nav`}>
			<BackgroundCat />
			<Screen name={route}>{page()}</Screen>
			<BottomNav current={route} onGo={(to) => navigate(to)} />
			{overlays}
		</main>
	);

	function page() {
		if (route === "verbs") return <VerbsPage />;
		if (route === "achievements")
			return (
				<section className="page">
					<header className="page__head">
						<h1 className="page__title">Logros</h1>
						<p className="page__sub">
							Y el clóset: elige qué le pones al gatito.
						</p>
					</header>
					<Trophies progress={progress} onWear={wear} collapsible={false} />
				</section>
			);
		if (route === "records")
			return (
				<RecordsPage
					progress={progress}
					onPet={pet}
					onPractice={(verbIds) => start("practice", verbIds)}
				/>
			);
		return (
			<Home
				progress={progress}
				weakIds={weakIds}
				onPractice={(verbIds) => start("practice", verbIds)}
				onExam={() => start("exam")}
				onPet={pet}
				onReset={() => setPrompt("reset")}
			/>
		);
	}
}
