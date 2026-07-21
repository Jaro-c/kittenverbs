/**
 * Pronunciation via the browser's own speech synthesis.
 *
 * No audio files and no service: the voices already installed on her phone or
 * laptop are better than anything this project could ship, they work offline,
 * and they cost nothing to download.
 */

/** Slower than conversation. She is learning the word, not listening to prose. */
const RATE = 0.85;

let voice: SpeechSynthesisVoice | null = null;
let searched = false;
/** Flipped when an utterance actually fails, so dead buttons stop being offered. */
let broken = false;

function synth(): SpeechSynthesis | null {
	if (typeof window === "undefined") return null;
	return "speechSynthesis" in window ? window.speechSynthesis : null;
}

export function speechAvailable(): boolean {
	return synth() !== null && !broken;
}

/**
 * getVoices() is famously empty on the first call — the list arrives
 * asynchronously and fires `voiceschanged`. Asking once at startup and caching
 * the empty result is the bug that makes speech "work on my machine" and stay
 * silent everywhere else, so we re-read until something shows up.
 */
function pickVoice(): SpeechSynthesisVoice | null {
	const s = synth();
	if (!s) return null;
	if (voice) return voice;

	const voices = s.getVoices();
	if (voices.length === 0) {
		if (!searched) {
			searched = true;
			s.addEventListener("voiceschanged", () => {
				voice = null;
				pickVoice();
			});
		}
		return null;
	}

	const english = voices.filter((v) => v.lang.replace("_", "-").startsWith("en"));
	voice =
		english.find((v) => v.lang.replace("_", "-") === "en-US" && v.localService) ??
		english.find((v) => v.lang.replace("_", "-") === "en-US") ??
		english[0] ??
		null;
	return voice;
}

/** Call once from a real user gesture to warm the voice list up. */
export function primeSpeech(): void {
	pickVoice();
}

/**
 * Says one English word or phrase.
 *
 * `lang` is set explicitly and never left to default: the document is
 * `lang="es-CO"`, and an utterance with no language of its own inherits that,
 * which makes a Spanish voice read "write" as if it were Spanish.
 */
export function speak(text: string): void {
	const s = synth();
	if (!s || broken || !text.trim()) return;
	try {
		// Without cancelling, repeated taps queue up and she hears the same word
		// five times in a row instead of once.
		s.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = "en-US";
		utterance.rate = RATE;
		const chosen = pickVoice();
		if (chosen) utterance.voice = chosen;
		utterance.onerror = (event) => {
			// "interrupted" and "canceled" are our own cancel() landing, not a fault.
			if (event.error === "interrupted" || event.error === "canceled") return;
			broken = true;
		};
		s.speak(utterance);
	} catch {
		broken = true;
	}
}

/**
 * Says several forms in a row with a beat between them, for reading a whole row
 * aloud: "write — wrote — written". Commas are what create the pause; separate
 * utterances would run together or need timers that drift.
 */
export function speakForms(forms: string[]): void {
	speak(forms.filter(Boolean).join(", "));
}

export function stopSpeaking(): void {
	synth()?.cancel();
}
