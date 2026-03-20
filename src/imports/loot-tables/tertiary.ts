import type { PriorityOverrides } from './loot-priority.js';

const ItemID = net.runelite.api.ItemID;

export const clueScrolls: number[] = [
	ItemID.CLUE_SCROLL_BEGINNER as number,
	ItemID.CLUE_SCROLL_EASY as number,
	ItemID.CLUE_SCROLL_MEDIUM as number,
	ItemID.CLUE_SCROLL_HARD as number,
	ItemID.CLUE_SCROLL_ELITE as number,
	ItemID.CLUE_SCROLL_MASTER as number,
];

export const tertiary: number[] = [ItemID.BRIMSTONE_KEY as number];

export type TertiaryCategory = 'tertiary' | 'clueScrolls';

export const tertiaryPriorityOverrides: Record<
	TertiaryCategory,
	PriorityOverrides
> = {
	tertiary: {
		[ItemID.BRIMSTONE_KEY]: 1,
	},
	clueScrolls: {
		[ItemID.CLUE_SCROLL_BEGINNER]: 6,
		[ItemID.CLUE_SCROLL_EASY]: 5,
		[ItemID.CLUE_SCROLL_MEDIUM]: 4,
		[ItemID.CLUE_SCROLL_HARD]: 3,
		[ItemID.CLUE_SCROLL_ELITE]: 2,
		[ItemID.CLUE_SCROLL_MASTER]: 1,
	},
};
