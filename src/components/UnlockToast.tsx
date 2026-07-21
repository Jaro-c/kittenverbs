import { useEffect } from "react";
import type { Achievement } from "../lib/achievements";
import { getAccessory, type AccessoryId } from "../lib/accessories";
import { buzzUnlock } from "../lib/haptics";
import { playUnlock } from "../lib/sound";
import { Kitten } from "./Kitten";

interface Props {
	achievement: Achievement;
	onWear: (accessory: AccessoryId) => void;
	onDismiss: () => void;
	/**
	 * False while a simulacro is being answered. A milestone can land mid-exam —
	 * the fiftieth caress does not care what screen she is on — and the exam's
	 * rule is that the phone stays perfectly still, whatever the reason.
	 */
	haptic?: boolean;
}

/** Long enough to read the line and look at the cat, short enough not to nag. */
const LINGER_MS = 7000;

/**
 * Announces one milestone, at the app root rather than per screen.
 *
 * Milestones are reached at the end of a run but also mid-home — the fiftieth
 * pet lands wherever she happens to be — so this cannot live inside Results. It
 * queues: one card at a time, dismissed before the next appears.
 *
 * The preview shows the cat already wearing the prize, because "un lacito" means
 * nothing until she sees it on him.
 */
export function UnlockToast({ achievement, onWear, onDismiss, haptic = true }: Props) {
	const prize = getAccessory(achievement.grants ?? null);

	useEffect(() => {
		playUnlock();
		// A milestone is the one moment worth a buzz she did not ask for.
		if (haptic) buzzUnlock();
		const timer = window.setTimeout(onDismiss, LINGER_MS);
		return () => window.clearTimeout(timer);
	}, [onDismiss, haptic]);

	return (
		<div className="unlock" role="status">
			{prize && (
				<span className="unlock__preview" aria-hidden="true">
					<Kitten mood="happy" size={54} accessory={prize.id} decorative />
				</span>
			)}

			<span className="unlock__text">
				<b>{achievement.title}</b>
				<small>
					{prize
						? `Te ganaste un accesorio nuevo: ${prize.name.toLowerCase()}.`
						: "Un logro más para la colección."}
				</small>
			</span>

			<span className="unlock__actions">
				{prize && (
					<button
						type="button"
						className="btn btn--primary unlock__wear"
						onClick={() => {
							onWear(prize.id);
							onDismiss();
						}}
					>
						Póntelo
					</button>
				)}
				<button
					type="button"
					className="btn btn--ghost unlock__close"
					onClick={onDismiss}
				>
					Cerrar
				</button>
			</span>
		</div>
	);
}
