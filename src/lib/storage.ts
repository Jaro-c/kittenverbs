const KEY = "kittenverbs:progress:v1";

/** Questions answered in a day to count it toward the weekly goal. */
export const DEFAULT_GOAL_PER_DAY = 20;

export interface VerbStat {
	correct: number;
	wrong: number;
	/** Epoch ms of the last attempt, so the UI can show what is going stale. */
	lastSeen: number;
}

export interface DayRecord {
	answered: number;
	correct: number;
}

export interface Progress {
	verbs: Record<string, VerbStat>;
	/** Keyed by local YYYY-MM-DD, pruned to the last fortnight. */
	days: Record<string, DayRecord>;
	/** Questions per day that count the day as done. */
	goalPerDay: number;
	/** Best exam score recorded, as a percentage 0–100. */
	bestExam: number | null;
	/** Consecutive days with at least one session. */
	streak: number;
	/** Local ISO date (YYYY-MM-DD) of the last session, for streak math. */
	lastDay: string | null;
}

const EMPTY: Progress = {
	verbs: {},
	days: {},
	goalPerDay: DEFAULT_GOAL_PER_DAY,
	bestExam: null,
	streak: 0,
	lastDay: null,
};

/**
 * Reads are defensive: a half-written or schema-drifted blob must not brick the
 * app the night before the exam. Anything unparseable is treated as no progress,
 * and fields added after a save are filled from the defaults.
 */
export function loadProgress(): Progress {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...EMPTY };
		const parsed = JSON.parse(raw) as Partial<Progress>;
		return {
			verbs: parsed.verbs ?? {},
			days: parsed.days ?? {},
			goalPerDay: parsed.goalPerDay ?? DEFAULT_GOAL_PER_DAY,
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

// ─── Dates ─────────────────────────────────────────────────────────────────────

/**
 * The day key is built from LOCAL date parts, never toISOString().
 *
 * toISOString() is UTC: in Colombia (UTC-5) a session at 7pm is already the next
 * calendar day in UTC, so an evening study habit would look like a session every
 * "tomorrow" and the streak would misfire exactly when it is used most.
 */
export function dayKey(date: Date = new Date()): string {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

function fromKey(key: string): Date {
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, m - 1, d);
}

function daysBetween(from: string, to: string): number {
	const ms = fromKey(to).getTime() - fromKey(from).getTime();
	return Math.round(ms / 86_400_000);
}

function shiftDays(date: Date, delta: number): Date {
	const copy = new Date(date);
	copy.setDate(copy.getDate() + delta);
	return copy;
}

/** Drops day records older than two weeks so the blob cannot grow forever. */
function pruneDays(days: Record<string, DayRecord>, today: string) {
	const kept: Record<string, DayRecord> = {};
	for (const [key, value] of Object.entries(days)) {
		if (daysBetween(key, today) <= 13) kept[key] = value;
	}
	return kept;
}

// ─── Recording ─────────────────────────────────────────────────────────────────

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

	const day = dayKey();
	const previousDay = progress.days[day] ?? { answered: 0, correct: 0 };
	const days = pruneDays(
		{
			...progress.days,
			[day]: {
				answered: previousDay.answered + results.length,
				correct: previousDay.correct + results.filter((r) => r.correct).length,
			},
		},
		day,
	);

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
		days,
		goalPerDay: progress.goalPerDay,
		streak,
		lastDay: day,
		bestExam: exam
			? Math.max(progress.bestExam ?? 0, exam.scorePercent)
			: progress.bestExam,
	};
}

// ─── Weekly goal ───────────────────────────────────────────────────────────────

export interface WeekDay {
	key: string;
	/** Single-letter Spanish weekday label. */
	label: string;
	answered: number;
	correct: number;
	/** Reached the daily target. */
	met: boolean;
	isToday: boolean;
}

const LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

/**
 * The last seven days ending today, oldest first.
 *
 * A rolling window rather than a calendar week: starting the week on Monday
 * would show an almost empty strip to anyone who begins studying on a Saturday,
 * which reads as failure on day one.
 */
export function weekView(progress: Progress): WeekDay[] {
	const today = new Date();
	const todayKey = dayKey(today);
	return Array.from({ length: 7 }, (_, i) => {
		const date = shiftDays(today, i - 6);
		const key = dayKey(date);
		const record = progress.days[key] ?? { answered: 0, correct: 0 };
		return {
			key,
			label: LETTERS[date.getDay()],
			answered: record.answered,
			correct: record.correct,
			met: record.answered >= progress.goalPerDay,
			isToday: key === todayKey,
		};
	});
}

/** How many of the last seven days hit the target. */
export function daysMet(progress: Progress): number {
	return weekView(progress).filter((d) => d.met).length;
}

/** Questions still needed today to tick the day off. */
export function remainingToday(progress: Progress): number {
	const record = progress.days[dayKey()] ?? { answered: 0, correct: 0 };
	return Math.max(0, progress.goalPerDay - record.answered);
}

// ─── Review ────────────────────────────────────────────────────────────────────

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
