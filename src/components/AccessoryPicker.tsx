import { ACCESSORIES, type AccessoryId } from "../lib/accessories";
import { Kitten } from "./Kitten";

interface Props {
	/** Only the ones she has earned; the rest are not shown at all. */
	unlocked: AccessoryId[];
	worn: AccessoryId | null;
	onWear: (accessory: AccessoryId | null) => void;
}

/**
 * The wardrobe.
 *
 * Each option previews the cat actually wearing the thing rather than showing
 * the accessory on its own — a bow floating in a box tells her nothing about how
 * it will look, and the drawing is already inline SVG so the preview is free.
 *
 * Locked accessories are absent rather than greyed out. The achievements list
 * right above already says what is missing and how to get it; repeating it here
 * as a row of locks would turn a treat into a checklist.
 */
export function AccessoryPicker({ unlocked, worn, onWear }: Props) {
	if (unlocked.length === 0) return null;

	const options = ACCESSORIES.filter((a) => unlocked.includes(a.id));

	return (
		<div className="wardrobe">
			<h3 className="wardrobe__title">El clóset del gatito</h3>
			<div className="wardrobe__row" role="radiogroup" aria-label="Accesorio del gatito">
				<Option
					label="Sin nada"
					accessory={null}
					selected={worn === null}
					onWear={onWear}
				/>
				{options.map((accessory) => (
					<Option
						key={accessory.id}
						label={accessory.name}
						accessory={accessory.id}
						selected={worn === accessory.id}
						onWear={onWear}
					/>
				))}
			</div>
		</div>
	);
}

function Option({
	label,
	accessory,
	selected,
	onWear,
}: {
	label: string;
	accessory: AccessoryId | null;
	selected: boolean;
	onWear: (accessory: AccessoryId | null) => void;
}) {
	return (
		<button
			type="button"
			role="radio"
			aria-checked={selected}
			className={`wardrobe__option${selected ? " wardrobe__option--on" : ""}`}
			onClick={() => onWear(accessory)}
		>
			<span className="wardrobe__preview">
				<Kitten mood="idle" size={44} accessory={accessory} decorative />
			</span>
			{label}
		</button>
	);
}
