/**
 * Feedback tones, synthesised rather than loaded.
 *
 * Oscillators mean no audio files, no network request and no decode delay — the
 * sound lands on the same frame as the visual. It also lets the relationship
 * between right and wrong be tuned directly: correct rises, wrong falls, so the
 * two are told apart without looking at the screen.
 */

const KEY = "kittenverbs:sound:v1";

let ctx: AudioContext | null = null;

/**
 * Browsers refuse to start an AudioContext until the page has seen a user
 * gesture, and one created earlier is stuck in "suspended" — the classic bug
 * where audio works locally and is silent in production. Creating it lazily on
 * the first play (which always follows a click) sidesteps that, and resume()
 * covers a context suspended later by a backgrounded tab.
 */
function audio(): AudioContext | null {
	if (typeof window === "undefined") return null;
	try {
		if (!ctx) {
			const Ctor =
				window.AudioContext ??
				(window as unknown as { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext;
			if (!Ctor) return null;
			ctx = new Ctor();
		}
		if (ctx.state === "suspended") void ctx.resume();
		return ctx;
	} catch {
		return null;
	}
}

export function isSoundOn(): boolean {
	try {
		return localStorage.getItem(KEY) !== "off";
	} catch {
		return true;
	}
}

export function setSoundOn(on: boolean): void {
	try {
		localStorage.setItem(KEY, on ? "on" : "off");
	} catch {
		// Nothing to do; the preference simply will not survive a reload.
	}
}

interface ToneOptions {
	/** Start offset in seconds from now. */
	at?: number;
	/** Length in seconds. */
	dur?: number;
	type?: OscillatorType;
	/** Peak gain, 0–1. Kept low; these fire on every answer. */
	peak?: number;
	/** Slide to this frequency over the note, for a rise or a fall. */
	to?: number;
}

function tone(freq: number, options: ToneOptions = {}): void {
	const c = audio();
	if (!c) return;
	const { at = 0, dur = 0.12, type = "sine", peak = 0.16, to } = options;
	const start = c.currentTime + at;

	const osc = c.createOscillator();
	const gain = c.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, start);
	if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(to, start + dur);

	// An envelope, not a raw on/off: switching gain instantly puts a step in the
	// waveform, which is audible as a click on every single note.
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

	osc.connect(gain).connect(c.destination);
	osc.start(start);
	osc.stop(start + dur + 0.02);
}

function guard(): boolean {
	return isSoundOn();
}

/** Two rising notes. Short enough not to delay the next question. */
export function playCorrect(): void {
	if (!guard()) return;
	tone(659.25, { dur: 0.09, peak: 0.14 }); // E5
	tone(987.77, { at: 0.08, dur: 0.13, peak: 0.13 }); // B5
}

/** One falling note, duller timbre so it reads as a stop, not a punishment. */
export function playWrong(): void {
	if (!guard()) return;
	tone(311.13, { dur: 0.22, type: "triangle", peak: 0.13, to: 196 });
}

/** A rising arpeggio for a streak worth noticing. */
export function playStreak(): void {
	if (!guard()) return;
	const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
	notes.forEach((f, i) =>
		tone(f, { at: i * 0.07, dur: 0.16, peak: 0.13 }),
	);
}

/** End of a run. Longer, resolves downward to feel like a full stop. */
export function playFinish(passed: boolean): void {
	if (!guard()) return;
	const notes = passed
		? [523.25, 659.25, 783.99, 1046.5, 1318.51]
		: [440, 392, 349.23];
	notes.forEach((f, i) =>
		tone(f, { at: i * 0.11, dur: 0.24, peak: 0.12, type: "sine" }),
	);
}

/** A click for the answer being committed, below the feedback tone. */
export function playTick(): void {
	if (!guard()) return;
	tone(880, { dur: 0.04, peak: 0.06, type: "square" });
}
