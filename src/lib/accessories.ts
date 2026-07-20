/**
 * Things the cat can wear.
 *
 * Each one is earned by an achievement (see achievements.ts) and drawn inline in
 * KittenAccessory.tsx, in the same viewBox and with the same flat fill + dark
 * outline as the cat, so a hat never looks like a sticker pasted on top.
 */

export type AccessoryId = "bow" | "scarf" | "hat" | "glasses";

export interface Accessory {
	id: AccessoryId;
	/** Shown in the picker, in her Spanish. */
	name: string;
}

export const ACCESSORIES: Accessory[] = [
	{ id: "bow", name: "Lacito" },
	{ id: "scarf", name: "Bufanda" },
	{ id: "hat", name: "Gorrito" },
	{ id: "glasses", name: "Gafas" },
];

const BY_ID = new Map(ACCESSORIES.map((a) => [a.id, a]));

export function getAccessory(id: string | null): Accessory | undefined {
	return id === null ? undefined : BY_ID.get(id as AccessoryId);
}

/** Narrows a stored string, which may be from an older or hand-edited blob. */
export function isAccessoryId(value: unknown): value is AccessoryId {
	return typeof value === "string" && BY_ID.has(value as AccessoryId);
}
