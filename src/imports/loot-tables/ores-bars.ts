import type { PriorityOverrides } from './loot-priority.js';

const ItemID = net.runelite.api.ItemID;

const oreIds: number[] = [
	ItemID.COPPER_ORE as number,
	ItemID.TIN_ORE as number,
	ItemID.IRON_ORE as number,
	ItemID.SILVER_ORE as number,
	ItemID.COAL as number,
	ItemID.GOLD_ORE as number,
	ItemID.MITHRIL_ORE as number,
	ItemID.ADAMANTITE_ORE as number,
	ItemID.RUNITE_ORE as number,
];

const barIds: number[] = [
	ItemID.BRONZE_BAR as number,
	ItemID.IRON_BAR as number,
	ItemID.STEEL_BAR as number,
	ItemID.SILVER_BAR as number,
	ItemID.GOLD_BAR as number,
	ItemID.MITHRIL_BAR as number,
	ItemID.ADAMANTITE_BAR as number,
	ItemID.RUNITE_BAR as number,
];

export const oresBars = {
	ores: oreIds,
	bars: barIds,
	all: [...oreIds, ...barIds],
};

export type OresBarsCategory = 'ores' | 'bars';

export const oresBarsPriorityOverrides: Record<
	OresBarsCategory,
	PriorityOverrides
> = {
	ores: {
		[ItemID.COPPER_ORE]: 9,
		[ItemID.TIN_ORE]: 8,
		[ItemID.IRON_ORE]: 7,
		[ItemID.SILVER_ORE]: 6,
		[ItemID.COAL]: 5,
		[ItemID.GOLD_ORE]: 4,
		[ItemID.MITHRIL_ORE]: 3,
		[ItemID.ADAMANTITE_ORE]: 2,
		[ItemID.RUNITE_ORE]: 1,
	},
	bars: {
		[ItemID.BRONZE_BAR]: 8,
		[ItemID.IRON_BAR]: 7,
		[ItemID.STEEL_BAR]: 6,
		[ItemID.SILVER_BAR]: 5,
		[ItemID.GOLD_BAR]: 4,
		[ItemID.MITHRIL_BAR]: 3,
		[ItemID.ADAMANTITE_BAR]: 2,
		[ItemID.RUNITE_BAR]: 1,
	},
};
