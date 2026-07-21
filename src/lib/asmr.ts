/**
 * A purr that does not end, synthesised.
 *
 * Making sound last forever is the easy half: an oscillator started without a
 * matching stop() runs until the page closes. The hard half is that a loop which
 * repeats exactly turns into a fridge hum inside about twenty seconds, because
 * the ear is extremely good at spotting a period.
 *
 * So three things fight the machine:
 *   · TEXTURE — a real purr is broadband rumble, not a tone. Filtered noise is
 *     what sounds like fur; the oscillator only supplies the body underneath.
 *   · DRIFT — a very slow LFO wanders the purr rate between roughly 22 and 28 Hz.
 *     Cats do not hold a tempo, and holding one is what gives a synth away.
 *   · BREATH — a slow swell every few seconds, because a purr rides on breathing.
 *
 * Every number here is a guess by someone who cannot hear the result. They are
 * all in ONE place on purpose, so they are cheap to change once someone can.
 */

export interface AsmrSettings {
	/** Overall loudness, 0–1. */
	master: number;
	/** The rumble itself. */
	purr: number;
	/** Occasional licking. */
	licks: number;
	/** Slow soft kneading with the paws. */
	knead: number;
}

export const DEFAULT_SETTINGS: AsmrSettings = {
	master: 0.55,
	purr: 0.8,
	licks: 0.35,
	knead: 0.3,
};

/** The tuning knobs. Everything an ear might complain about lives here. */
const TUNE = {
	/** Purr rate in Hz. Domestic cats sit around 25. */
	rate: 25,
	/** How far the rate is allowed to wander, ± Hz. */
	rateDrift: 2.6,
	/** How long one full wander takes, in seconds. Deliberately far too slow to
	 *  hear as a rhythm — it should only register as "not a machine". */
	driftPeriod: 19,
	/** Body oscillator, Hz. Below this it is felt rather than heard. */
	bodyHz: 52,
	/** Cutoff for the noise layer. Higher is raspier, lower is softer. */
	furCutoff: 420,
	/** Cutoff for the body layer. */
	bodyCutoff: 180,
	/** One breath in seconds. */
	breath: 2.9,
	/** How deep the breath swell goes, 0–1. */
	breathDepth: 0.22,
	/** Seconds between licks, randomised inside this range. */
	lickGap: [5, 11] as const,
	/** Seconds between kneads. */
	kneadGap: [4, 9] as const,
};

const KEY = "kittenverbs:asmr:v1";

interface Graph {
	ctx: AudioContext;
	master: GainNode;
	purrBus: GainNode;
	lickBus: GainNode;
	kneadBus: GainNode;
	nodes: AudioScheduledSourceNode[];
	timers: number[];
}

let graph: Graph | null = null;
let playing = false;
let settings: AsmrSettings = { ...DEFAULT_SETTINGS };

// ─── Settings persistence ──────────────────────────────────────────────────────

export function loadSettings(): AsmrSettings {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...DEFAULT_SETTINGS };
		const parsed = JSON.parse(raw) as Partial<AsmrSettings>;
		return {
			master: clamp01(parsed.master ?? DEFAULT_SETTINGS.master),
			purr: clamp01(parsed.purr ?? DEFAULT_SETTINGS.purr),
			licks: clamp01(parsed.licks ?? DEFAULT_SETTINGS.licks),
			knead: clamp01(parsed.knead ?? DEFAULT_SETTINGS.knead),
		};
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export function saveSettings(next: AsmrSettings): void {
	settings = next;
	try {
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		/* the mix simply will not survive a reload */
	}
	applySettings();
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function applySettings() {
	if (!graph) return;
	const t = graph.ctx.currentTime;
	// Ramped, never assigned: a jump in gain is an audible click, and a click in
	// something meant to relax you is worse than no sound at all.
	graph.master.gain.setTargetAtTime(settings.master, t, 0.08);
	graph.purrBus.gain.setTargetAtTime(settings.purr, t, 0.08);
	graph.lickBus.gain.setTargetAtTime(settings.licks, t, 0.08);
	graph.kneadBus.gain.setTargetAtTime(settings.knead, t, 0.08);
}

// ─── Building blocks ───────────────────────────────────────────────────────────

/** Two seconds of white noise, looped. Long enough that the loop point is not a
 *  rhythm of its own. */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
	const length = ctx.sampleRate * 2;
	const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
	return buffer;
}

function lfo(
	ctx: AudioContext,
	hz: number,
	depth: number,
	target: AudioParam,
	nodes: AudioScheduledSourceNode[],
) {
	const osc = ctx.createOscillator();
	const amount = ctx.createGain();
	osc.frequency.value = hz;
	amount.gain.value = depth;
	osc.connect(amount).connect(target);
	osc.start();
	nodes.push(osc);
	return osc;
}

// ─── The engine ────────────────────────────────────────────────────────────────

function build(): Graph | null {
	if (typeof window === "undefined") return null;
	const Ctor =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	if (!Ctor) return null;

	const ctx = new Ctor();
	const nodes: AudioScheduledSourceNode[] = [];
	const timers: number[] = [];

	const master = ctx.createGain();
	master.gain.value = 0;
	master.connect(ctx.destination);

	// ─ Purr: fur texture over a body tone, both gated by the same tremolo ─
	const purrBus = ctx.createGain();
	purrBus.gain.value = settings.purr;
	purrBus.connect(master);

	const tremolo = ctx.createGain();
	// Offset 0.55 with depth 0.45 keeps the modulation from ever reaching silence:
	// a purr pulses, it does not stutter on and off.
	tremolo.gain.value = 0.55;
	tremolo.connect(purrBus);

	const beat = lfo(ctx, TUNE.rate, 0.45, tremolo.gain, nodes);
	// The wander. Without it every cycle is identical and the ear files the whole
	// thing under "machine" within seconds.
	lfo(ctx, 1 / TUNE.driftPeriod, TUNE.rateDrift, beat.frequency, nodes);
	// And the breath on top of everything.
	lfo(ctx, 1 / TUNE.breath, TUNE.breathDepth, purrBus.gain, nodes);

	const fur = ctx.createBufferSource();
	fur.buffer = noiseBuffer(ctx);
	fur.loop = true;
	const furFilter = ctx.createBiquadFilter();
	furFilter.type = "lowpass";
	furFilter.frequency.value = TUNE.furCutoff;
	furFilter.Q.value = 0.7;
	const furGain = ctx.createGain();
	furGain.gain.value = 0.5;
	fur.connect(furFilter).connect(furGain).connect(tremolo);
	fur.start();
	nodes.push(fur);

	const body = ctx.createOscillator();
	body.type = "sawtooth";
	body.frequency.value = TUNE.bodyHz;
	const bodyFilter = ctx.createBiquadFilter();
	bodyFilter.type = "lowpass";
	bodyFilter.frequency.value = TUNE.bodyCutoff;
	const bodyGain = ctx.createGain();
	bodyGain.gain.value = 0.22;
	body.connect(bodyFilter).connect(bodyGain).connect(tremolo);
	body.start();
	nodes.push(body);

	// ─ Licks and kneads: one-shots on irregular timers ─
	const lickBus = ctx.createGain();
	lickBus.gain.value = settings.licks;
	lickBus.connect(master);

	const kneadBus = ctx.createGain();
	kneadBus.gain.value = settings.knead;
	kneadBus.connect(master);

	const built: Graph = { ctx, master, purrBus, lickBus, kneadBus, nodes, timers };
	scheduleLoop(built, TUNE.lickGap, () => lick(built));
	scheduleLoop(built, TUNE.kneadGap, () => knead(built));
	return built;
}

/** Re-arms itself with a fresh random gap each time, so nothing lands on a grid. */
function scheduleLoop(
	g: Graph,
	[min, max]: readonly [number, number],
	fire: () => void,
) {
	const next = () => {
		const wait = (min + Math.random() * (max - min)) * 1000;
		const id = window.setTimeout(() => {
			if (playing) fire();
			next();
		}, wait);
		g.timers.push(id);
	};
	next();
}

/** A short rasp of filtered noise. */
function lick(g: Graph) {
	const { ctx } = g;
	const t = ctx.currentTime;
	const dur = 0.16 + Math.random() * 0.1;

	const source = ctx.createBufferSource();
	source.buffer = noiseBuffer(ctx);
	const band = ctx.createBiquadFilter();
	band.type = "bandpass";
	// Wanders per lick, because two identical licks in a row read as a sample.
	band.frequency.value = 1900 + Math.random() * 1500;
	band.Q.value = 1.1;
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, t);
	gain.gain.exponentialRampToValueAtTime(0.5, t + dur * 0.35);
	gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

	source.connect(band).connect(gain).connect(g.lickBus);
	source.start(t);
	source.stop(t + dur + 0.02);
}

/** Two soft muffled presses, the way a cat kneads a blanket. */
function knead(g: Graph) {
	const { ctx } = g;
	const base = ctx.currentTime;
	for (let i = 0; i < 2; i++) {
		const t = base + i * (0.34 + Math.random() * 0.1);
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(120, t);
		osc.frequency.exponentialRampToValueAtTime(70, t + 0.18);
		gain.gain.setValueAtTime(0.0001, t);
		gain.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
		osc.connect(gain).connect(g.kneadBus);
		osc.start(t);
		osc.stop(t + 0.26);
	}
}

// ─── Control ───────────────────────────────────────────────────────────────────

export function asmrAvailable(): boolean {
	if (typeof window === "undefined") return false;
	return (
		"AudioContext" in window ||
		"webkitAudioContext" in (window as unknown as Record<string, unknown>)
	);
}

/**
 * Must be called from a real user gesture. Browsers refuse to start audio
 * otherwise, which is why there is no "purring when the page opens" — that is a
 * platform rule, not an omission.
 */
export function startAsmr(): boolean {
	if (!graph) graph = build();
	if (!graph) return false;
	playing = true;
	void graph.ctx.resume();
	const t = graph.ctx.currentTime;
	// Four seconds to fade in. Anything abrupt defeats the entire point.
	graph.master.gain.cancelScheduledValues(t);
	graph.master.gain.setValueAtTime(graph.master.gain.value, t);
	graph.master.gain.linearRampToValueAtTime(settings.master, t + 4);
	return true;
}

export function stopAsmr(): void {
	playing = false;
	if (!graph) return;
	const t = graph.ctx.currentTime;
	graph.master.gain.cancelScheduledValues(t);
	graph.master.gain.setValueAtTime(graph.master.gain.value, t);
	graph.master.gain.linearRampToValueAtTime(0.0001, t + 1.6);
}

export function isAsmrPlaying(): boolean {
	return playing;
}

/**
 * Tears the whole graph down. Called when she leaves the page: a suspended
 * context still holds the audio hardware open, and this is meant to be kind to
 * a phone she might fall asleep holding.
 */
export function disposeAsmr(): void {
	playing = false;
	if (!graph) return;
	for (const id of graph.timers) clearTimeout(id);
	for (const node of graph.nodes) {
		try {
			node.stop();
		} catch {
			/* already stopped */
		}
	}
	void graph.ctx.close();
	graph = null;
}

/** Pauses the audio hardware while the tab is in the background. */
export function handleVisibility(): void {
	if (!graph) return;
	if (document.hidden) void graph.ctx.suspend();
	else if (playing) void graph.ctx.resume();
}

export function currentSettings(): AsmrSettings {
	return settings;
}

export function primeSettings(next: AsmrSettings): void {
	settings = next;
}
