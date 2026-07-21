import { useState } from "react";
import { ACHIEVEMENTS, unlockedAccessories } from "../lib/achievements";
import { getAccessory, type AccessoryId } from "../lib/accessories";
import type { Progress } from "../lib/storage";
import { AccessoryPicker } from "./AccessoryPicker";

interface Props {
	progress: Progress;
	onWear: (accessory: AccessoryId | null) => void;
	/** False on the page that exists only for this, where a toggle is a hurdle. */
	collapsible?: boolean;
}

/**
 * Milestones and the wardrobe, folded away behind one line.
 *
 * Collapsed by default because this is not why she opened the app: the two study
 * buttons have to stay the first thing on the screen. Locked entries show their
 * condition rather than a row of question marks — a goal she can read is worth
 * something, a mystery is just noise.
 */
export function Trophies({ progress, onWear, collapsible = true }: Props) {
	const [open, setOpen] = useState(!collapsible);
	const earned = new Set(progress.unlocked);
	const count = ACHIEVEMENTS.filter((a) => earned.has(a.id)).length;

	return (
		<section className="trophies">
			{collapsible && <button
				type="button"
				className="trophies__toggle"
				aria-expanded={open}
				onClick={() => setOpen((current) => !current)}
			>
				{open ? "Ocultar" : "Ver"} logros y accesorios
				<span className="trophies__count">
					{count}/{ACHIEVEMENTS.length}
				</span>
			</button>}

			{open && (
				<>
					<ul className="trophies__list">
						{ACHIEVEMENTS.map((achievement) => {
							const done = earned.has(achievement.id);
							const prize = getAccessory(achievement.grants ?? null);
							return (
								<li
									key={achievement.id}
									className={`trophy${done ? " trophy--done" : ""}`}
								>
									<span className="trophy__mark" aria-hidden="true">
										{done ? "🐾" : "·"}
									</span>
									<span className="trophy__text">
										<b>{achievement.title}</b>
										<small>
											{done ? "Conseguido" : achievement.hint}
											{prize ? ` · ${prize.name}` : ""}
										</small>
									</span>
									<span className="sr-only">
										{done ? "conseguido" : "todavía no conseguido"}
									</span>
								</li>
							);
						})}
					</ul>

					<AccessoryPicker
						unlocked={unlockedAccessories(progress)}
						worn={progress.accessory}
						onWear={onWear}
					/>
				</>
			)}
		</section>
	);
}
