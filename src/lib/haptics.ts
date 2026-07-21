/**
 * A tap she feels, on the phone she will actually use this on.
 *
 * `navigator.vibrate` is Android-only: iOS Safari has never shipped it and shows
 * no sign of doing so, so this is a bonus for one platform and must be
 * completely invisible on the other. Two consequences that are easy to get
 * wrong and are handled here rather than at the call sites:
 *
 *   1. The call is capability-checked, not try/caught after the fact. Reading a
 *      missing method off `navigator` is not an exception, it is `undefined`
 *      being invoked — a hard TypeError in the middle of grading an answer.
 *   2. The switch that turns it off is only OFFERED where the thing exists.
 *      A dead toggle on an iPhone is worse than no toggle: it promises
 *      something the browser will never deliver.
 *
 * Patterns are deliberately under 100ms of total buzz. This fires on every
 * single answer, and a phone that thumps hard fifteen times a round is a phone
 * put face down on the table.
 */

const KEY = "kittenverbs:haptics:v1";

type Vibrate = (pattern: number | number[]) => boolean;

function driver(): Vibrate | null {
	if (typeof navigator === "undefined") return null;
	const fn = (navigator as Navigator & { vibrate?: Vibrate }).vibrate;
	return typeof fn === "function" ? fn : null;
}

/** True only where the browser can actually buzz. Gates the toggle's existence. */
export function canVibrate(): boolean {
	return driver() !== null;
}

export function isHapticsOn(): boolean {
	try {
		return localStorage.getItem(KEY) !== "off";
	} catch {
		return true;
	}
}

export function setHapticsOn(on: boolean): void {
	try {
		localStorage.setItem(KEY, on ? "on" : "off");
	} catch {
		// Private browsing. The preference just will not survive a reload.
	}
}

/**
 * Measured, not assumed: Chrome refuses `vibrate()` until the frame has been
 * touched, and it does not fail quietly — it logs an error to the console every
 * time. A milestone card can appear on a cold load (the achievement sync runs
 * against saved progress before she has touched anything), so this fired four
 * times on the first paint before the check existed.
 *
 * It is also the right rule on its own terms. A phone that buzzes on a page she
 * has only just opened is a phone that buzzed for no reason she can name.
 */
function activated(): boolean {
	const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
		.userActivation;
	return ua ? ua.hasBeenActive : true;
}

function buzz(pattern: number | number[]): void {
	const vibrate = driver();
	if (!vibrate || !isHapticsOn() || !activated()) return;
	// Bound to navigator on purpose: called bare it throws "Illegal invocation".
	vibrate.call(navigator, pattern);
}

/** One short tick. Confirmation, not celebration. */
export function buzzCorrect(): void {
	buzz(18);
}

/**
 * Two knocks. Different in COUNT, not merely in length — a single longer buzz
 * is indistinguishable from a single shorter one in a pocket, and this is the
 * one signal that has to be unmistakable without looking.
 */
export function buzzWrong(): void {
	buzz([26, 55, 26]);
}

/** A little flourish, and the only pattern allowed to be longer than 150ms. */
export function buzzUnlock(): void {
	buzz([14, 60, 14, 60, 30]);
}
