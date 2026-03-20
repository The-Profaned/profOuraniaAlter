import type { PriorityOverrides } from './loot-priority.js';

const ItemID = net.runelite.api.ItemID;

export const gems: number[] = [
	ItemID.UNCUT_OPAL,
	ItemID.OPAL,
	ItemID.UNCUT_JADE,
	ItemID.JADE,
	ItemID.UNCUT_RED_TOPAZ,
	ItemID.RED_TOPAZ,
	ItemID.UNCUT_SAPPHIRE,
	ItemID.SAPPHIRE,
	ItemID.UNCUT_EMERALD,
	ItemID.EMERALD,
	ItemID.UNCUT_RUBY,
	ItemID.RUBY,
	ItemID.UNCUT_DIAMOND,
	ItemID.DIAMOND,
	ItemID.UNCUT_DRAGONSTONE,
	ItemID.DRAGONSTONE,
	ItemID.UNCUT_ONYX,
	ItemID.ONYX,
];

export const gemsPriorityOverrides: PriorityOverrides = {
	[ItemID.UNCUT_OPAL]: 9,
	[ItemID.OPAL]: 9,
	[ItemID.UNCUT_JADE]: 8,
	[ItemID.JADE]: 8,
	[ItemID.UNCUT_RED_TOPAZ]: 7,
	[ItemID.RED_TOPAZ]: 7,
	[ItemID.UNCUT_SAPPHIRE]: 6,
	[ItemID.SAPPHIRE]: 6,
	[ItemID.UNCUT_EMERALD]: 5,
	[ItemID.EMERALD]: 5,
	[ItemID.UNCUT_RUBY]: 4,
	[ItemID.RUBY]: 4,
	[ItemID.UNCUT_DIAMOND]: 3,
	[ItemID.DIAMOND]: 3,
	[ItemID.UNCUT_DRAGONSTONE]: 2,
	[ItemID.DRAGONSTONE]: 2,
	[ItemID.UNCUT_ONYX]: 1,
	[ItemID.ONYX]: 1,
};
