const KEY = "kittenverbs:progress:v1";

export interface VerbStat {
	correct: number;
	wrong: number;
	/** Epoch ms of the last attempt, so the UI can show what is going stale. */
	lastSeen: number;
}

export interface Progress {
	verbs: Record<string, VerbStat>;
	/** Best exam score recorded, as a percentage 0–100. */
	bestExam: number | null;
	/** Consecutive days with at least one session. */
	streak: number;
	/** ISO date (YYYY-MM-DD) of the last session, for streak math. */
	lastDay: string | null;
}

const EMPTY: Progress = { verbs: {}, bestExam: null, streak: 0, lastDay: null };

/**
 * Reads are defensive: a half-written or schema-drifted blob must not brick the
 * app the night before the exam. Anything unparseable is treated as no progress.
 */
export function loadProgress(): Progress {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...EMPTY };
		const parsed = JSON.parse(raw) as Partial<Progress>;
		return {
			verbs: parsed.verbs ?? {},
			bestExam: parsed.bestExam ?? null,
			streak: parsed.streak ?? 0,
			lastDay: parsed.lastDay ?? null,
		};
	} catch {
		return { ...EMPTY };
	}
}

export function saveProgress(progress: Progress): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(progress));
	} catch {
		// Private browsing or a full quota. Losing progress is survivable; a
		// thrown error mid-session is not.
	}
}

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
	const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
	return Math.round(ms / 86_400_000);
}

/** Folds one finished session into stored progress and returns the new state. */
export function recordSession(
	progress: Progress,
	results: { verbId: string; correct: boolean }[],
	exam?: { scorePercent: number },
): Progress {
	const verbs = { ...progress.verbs };
	for (const { verbId, correct } of results) {
		const previous = verbs[verbId] ?? { correct: 0, wrong: 0, lastSeen: 0 };
		verbs[verbId] = {
			correct: previous.correct + (correct ? 1 : 0),
			wrong: previous.wrong + (correct ? 0 : 1),
			lastSeen: Date.now(),
		};
	}

	const day = today();
	let streak = progress.streak;
	if (progress.lastDay === null) streak = 1;
	else {
		const gap = daysBetween(progress.lastDay, day);
		if (gap === 1) streak = progress.streak + 1;
		else if (gap > 1) streak = 1;
		// gap === 0 → same day, streak unchanged
	}

	return {
		verbs,
		streak,
		lastDay: day,
		bestExam: exam
			? Math.max(progress.bestExam ?? 0, exam.scorePercent)
			: progress.bestExam,
	};
}

/** Verbs sorted worst-first, for a targeted review round. */
export function weakestVerbIds(progress: Progress, limit: number): string[] {
	return Object.entries(progress.verbs)
		.filter(([, stat]) => stat.wrong > 0)
		.sort((a, b) => {
			const rate = (s: VerbStat) => s.wrong / (s.correct + s.wrong);
			return rate(b[1]) - rate(a[1]) || b[1].wrong - a[1].wrong;
		})
		.slice(0, limit)
		.map(([id]) => id);
}

export function resetProgress(): void {
	try {
		localStorage.removeItem(KEY);
	} catch {
		/* nothing to do */
	}
}
