import type { AccessoryId } from "../lib/accessories";
import "./kitten-accessories.css";

/**
 * The wearables, drawn in the cat's own 120×120 viewBox.
 *
 * They are separate from Kitten.tsx only so a new accessory is one entry here
 * rather than another branch inside the face. Everything uses the same flat fill
 * plus dark outline as the cat, and the same colours in both themes — the cat
 * does not change wardrobe when the sun goes down.
 *
 * Order matters: this renders after the ears and head but before nothing, so
 * each piece places itself with explicit coordinates rather than relying on
 * being drawn last.
 */
export function KittenAccessory({ id }: { id: AccessoryId }) {
	switch (id) {
		case "bow":
			return (
				<g className="acc acc--bow" transform="rotate(-10 34 26)">
					<path className="acc__wool" d="M34 26 L20 16 L20 35 Z" />
					<path className="acc__wool" d="M34 26 L48 16 L48 35 Z" />
					<circle className="acc__knot" cx="34" cy="26" r="4.6" />
				</g>
			);

		case "scarf":
			// The hanging end starts INSIDE the band. Drawn as a separate shape that
			// merely sits near it, it reads as a blue blob floating off the chin.
			return (
				<g className="acc acc--scarf">
					<path className="acc__cloth" d="M27 92 Q60 110 93 92 L94 101 Q60 119 26 101 Z" />
					<path className="acc__cloth" d="M80 100 L92 114 L83 119 L73 105 Z" />
					<path className="acc__stripe" d="M79 109 L87 106" />
				</g>
			);

		case "hat":
			// Tilted, because a hat sitting square on top reads as a logo. Every
			// point stays inside the 0–120 box: the SVG is overflow:visible, so a
			// pompom drawn at y=-5 renders happily in isolation and then collides
			// with whatever sits above the cat on a real screen.
			return (
				<g className="acc acc--hat" transform="rotate(14 60 34)">
					<path className="acc__cone" d="M36 32 Q60 2 84 32 Z" />
					<circle className="acc__pom" cx="60" cy="14" r="6" />
					<rect className="acc__brim" x="33" y="29" width="54" height="10" rx="5" />
				</g>
			);

		case "glasses":
			return (
				<g className="acc acc--glasses">
					<circle className="acc__lens" cx="46" cy="62" r="11" />
					<circle className="acc__lens" cx="74" cy="62" r="11" />
					<path className="acc__frame" d="M57 61 Q60 58 63 61" />
					<path className="acc__frame" d="M35 59 L24 55" />
					<path className="acc__frame" d="M85 59 L96 55" />
				</g>
			);
	}
}
