import type { PriorityOverrides } from './loot-priority.js';

const ItemID = net.runelite.api.ItemID;

const herbIds: number[] = [
	ItemID.GRIMY_GUAM_LEAF as number,
	ItemID.GRIMY_MARRENTILL as number,
	ItemID.GRIMY_TARROMIN as number,
	ItemID.GRIMY_HARRALANDER as number,
	ItemID.GRIMY_RANARR_WEED as number,
	ItemID.GRIMY_TOADFLAX as number,
	ItemID.GRIMY_IRIT_LEAF as number,
	ItemID.GRIMY_AVANTOE as number,
	ItemID.GRIMY_KWUARM as number,
	ItemID.GRIMY_CADANTINE as number,
	ItemID.GRIMY_LANTADYME as number,
	ItemID.GRIMY_DWARF_WEED as number,
	ItemID.GRIMY_SNAPDRAGON as number,
	ItemID.GRIMY_TORSTOL as number,
];

const herbSeedIds: number[] = [
	ItemID.GUAM_SEED as number,
	ItemID.MARRENTILL_SEED as number,
	ItemID.TARROMIN_SEED as number,
	ItemID.HARRALANDER_SEED as number,
	ItemID.RANARR_SEED as number,
	ItemID.TOADFLAX_SEED as number,
	ItemID.IRIT_SEED as number,
	ItemID.AVANTOE_SEED as number,
	ItemID.KWUARM_SEED as number,
	ItemID.SNAPDRAGON_SEED as number,
	ItemID.CADANTINE_SEED as number,
	ItemID.LANTADYME_SEED as number,
	ItemID.DWARF_WEED_SEED as number,
	ItemID.TORSTOL_SEED as number,
	ItemID.HUASCA_SEED as number,
];

const treeSeedIds: number[] = [
	ItemID.ACORN as number,
	ItemID.WILLOW_SEED as number,
	ItemID.MAPLE_SEED as number,
	ItemID.YEW_SEED as number,
	ItemID.MAGIC_SEED as number,
	ItemID.MAHOGANY_SEED as number,
	ItemID.TEAK_SEED as number,
	ItemID.PAPAYA_TREE_SEED as number,
	ItemID.PALM_TREE_SEED as number,
	ItemID.CALQUAT_TREE_SEED as number,
	ItemID.SPIRIT_SEED as number,
	ItemID.DRAGONFRUIT_TREE_SEED as number,
	ItemID.CELASTRUS_SEED as number,
	ItemID.REDWOOD_TREE_SEED as number,
];

const otherSeedIds: number[] = [
	ItemID.POTATO_SEED as number,
	ItemID.ONION_SEED as number,
	ItemID.CABBAGE_SEED as number,
	ItemID.TOMATO_SEED as number,
	ItemID.SWEETCORN_SEED as number,
	ItemID.STRAWBERRY_SEED as number,
	ItemID.BELLADONNA_SEED as number,
	ItemID.POISON_IVY_SEED as number,
	ItemID.CACTUS_SEED as number,
	ItemID.POTATO_CACTUS_SEED as number,
	ItemID.SNAPE_GRASS_SEED as number,
	ItemID.WATERMELON_SEED as number,
];

export const vorkathSeeds = {
	herbIds: herbIds,
	herbSeeds: herbSeedIds,
	treeSeeds: treeSeedIds,
	otherSeeds: otherSeedIds,
	all: [...herbSeedIds, ...treeSeedIds, ...otherSeedIds],
};

export type VorkathSeedsCategory =
	| 'herbIds'
	| 'herbSeeds'
	| 'treeSeeds'
	| 'otherSeeds';

export const vorkathSeedsPriorityOverrides: Record<
	VorkathSeedsCategory,
	PriorityOverrides
> = {
	herbIds: {
		[ItemID.GRIMY_GUAM_LEAF as number]: 9,
		[ItemID.GRIMY_MARRENTILL as number]: 8,
		[ItemID.GRIMY_TARROMIN as number]: 7,
		[ItemID.GRIMY_HARRALANDER as number]: 6,
		[ItemID.GRIMY_RANARR_WEED as number]: 2,
		[ItemID.GRIMY_TOADFLAX as number]: 5,
		[ItemID.GRIMY_IRIT_LEAF as number]: 5,
		[ItemID.GRIMY_AVANTOE as number]: 4,
		[ItemID.GRIMY_KWUARM as number]: 3,
		[ItemID.GRIMY_CADANTINE as number]: 2,
		[ItemID.GRIMY_LANTADYME as number]: 2,
		[ItemID.GRIMY_DWARF_WEED as number]: 2,
		[ItemID.GRIMY_SNAPDRAGON as number]: 1,
		[ItemID.GRIMY_TORSTOL as number]: 1,
	},

	herbSeeds: {
		[ItemID.GUAM_SEED as number]: 9,
		[ItemID.MARRENTILL_SEED as number]: 8,
		[ItemID.TARROMIN_SEED as number]: 7,
		[ItemID.HARRALANDER_SEED as number]: 6,
		[ItemID.RANARR_SEED as number]: 2,
		[ItemID.TOADFLAX_SEED as number]: 5,
		[ItemID.IRIT_SEED as number]: 5,
		[ItemID.AVANTOE_SEED as number]: 4,
		[ItemID.KWUARM_SEED as number]: 3,
		[ItemID.CADANTINE_SEED as number]: 2,
		[ItemID.LANTADYME_SEED as number]: 2,
		[ItemID.DWARF_WEED_SEED as number]: 2,
		[ItemID.SNAPDRAGON_SEED as number]: 1,
		[ItemID.TORSTOL_SEED as number]: 1,
	},

	treeSeeds: {
		[ItemID.ACORN as number]: 10,
		[ItemID.WILLOW_SEED as number]: 4,
		[ItemID.MAPLE_SEED as number]: 3,
		[ItemID.YEW_SEED as number]: 2,
		[ItemID.MAGIC_SEED as number]: 1,
		[ItemID.MAHOGANY_SEED as number]: 1,
		[ItemID.TEAK_SEED as number]: 2,
		[ItemID.PAPAYA_TREE_SEED as number]: 3,
		[ItemID.PALM_TREE_SEED as number]: 2,
		[ItemID.CALQUAT_TREE_SEED as number]: 5,
		[ItemID.SPIRIT_SEED as number]: 1,
		[ItemID.DRAGONFRUIT_TREE_SEED as number]: 1,
		[ItemID.CELASTRUS_SEED as number]: 1,
		[ItemID.REDWOOD_TREE_SEED as number]: 1,
	},
	otherSeeds: {
		[ItemID.POTATO_SEED as number]: 10,
		[ItemID.ONION_SEED as number]: 10,
		[ItemID.CABBAGE_SEED as number]: 10,
		[ItemID.TOMATO_SEED as number]: 10,
		[ItemID.SWEETCORN_SEED as number]: 10,
		[ItemID.STRAWBERRY_SEED as number]: 10,
		[ItemID.BELLADONNA_SEED as number]: 6,
		[ItemID.POISON_IVY_SEED as number]: 9,
		[ItemID.CACTUS_SEED as number]: 9,
		[ItemID.POTATO_CACTUS_SEED as number]: 2,
		[ItemID.SNAPE_GRASS_SEED as number]: 3,
		[ItemID.WATERMELON_SEED as number]: 4,
	},
};
