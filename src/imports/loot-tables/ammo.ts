import type { PriorityOverrides } from './loot-priority.js';

const ItemID = net.runelite.api.ItemID;

const arrowIds: number[] = [
	ItemID.BRONZE_ARROW as number,
	ItemID.IRON_ARROW as number,
	ItemID.STEEL_ARROW as number,
	ItemID.MITHRIL_ARROW as number,
	ItemID.ADAMANT_ARROW as number,
	ItemID.RUNE_ARROW as number,
	ItemID.DRAGON_ARROW as number,
];

const boltIds: number[] = [
	ItemID.BRONZE_BOLTS as number,
	ItemID.IRON_BOLTS as number,
	ItemID.STEEL_BOLTS as number,
	ItemID.MITHRIL_BOLTS as number,
	ItemID.ADAMANT_BOLTS as number,
	ItemID.RUNITE_BOLTS as number,
	ItemID.DRAGON_BOLTS as number,
	ItemID.DRAGONSTONE_BOLTS_E as number,
	ItemID.ONYX_BOLTS as number,
];

const knifeIds: number[] = [
	ItemID.BRONZE_KNIFE as number,
	ItemID.IRON_KNIFE as number,
	ItemID.STEEL_KNIFE as number,
	ItemID.BLACK_KNIFE as number,
	ItemID.MITHRIL_KNIFE as number,
	ItemID.ADAMANT_KNIFE as number,
	ItemID.RUNE_KNIFE as number,
	ItemID.RUNE_KNIFEP as number,
	ItemID.DRAGON_KNIFE as number,
];

const dartIds: number[] = [
	ItemID.BRONZE_DART as number,
	ItemID.IRON_DART as number,
	ItemID.STEEL_DART as number,
	ItemID.BLACK_DART as number,
	ItemID.MITHRIL_DART as number,
	ItemID.ADAMANT_DART as number,
	ItemID.RUNE_DART as number,
	ItemID.DRAGON_DART as number,
];

const javelinIds: number[] = [
	ItemID.BRONZE_JAVELIN as number,
	ItemID.MITHRIL_JAVELIN as number,
	ItemID.ADAMANT_JAVELIN as number,
	ItemID.RUNE_JAVELIN as number,
];

const unfinishedBoltIds: number[] = [
	ItemID.BRONZE_BOLTS_UNF as number,
	ItemID.IRON_BOLTS_UNF as number,
	ItemID.STEEL_BOLTS_UNF as number,
	ItemID.MITHRIL_BOLTS_UNF as number,
	ItemID.ADAMANT_BOLTSUNF as number,
	ItemID.RUNITE_BOLTS_UNF as number,
	ItemID.DRAGON_BOLTS_UNF as number,
];

const javelinTipIds: number[] = [
	ItemID.BRONZE_JAVELIN_TIPS as number,
	ItemID.IRON_JAVELIN_TIPS as number,
	ItemID.STEEL_JAVELIN_TIPS as number,
	ItemID.MITHRIL_JAVELIN_TIPS as number,
	ItemID.ADAMANT_JAVELIN_TIPS as number,
	ItemID.RUNE_JAVELIN_TIPS as number,
	ItemID.DRAGON_JAVELIN_TIPS as number,
];

const boltTipIds: number[] = [
	ItemID.OPAL_BOLT_TIPS as number,
	ItemID.JADE_BOLT_TIPS as number,
	ItemID.PEARL_BOLT_TIPS as number,
	ItemID.TOPAZ_BOLT_TIPS as number,
	ItemID.SAPPHIRE_BOLT_TIPS as number,
	ItemID.EMERALD_BOLT_TIPS as number,
	ItemID.RUBY_BOLT_TIPS as number,
	ItemID.DIAMOND_BOLT_TIPS as number,
	ItemID.DRAGONSTONE_BOLT_TIPS as number,
	ItemID.ONYX_BOLT_TIPS as number,
];

const arrowtipIds: number[] = [ItemID.DRAGON_ARROWTIPS as number];

const dartTipIds: number[] = [
	ItemID.RUNE_DART_TIP as number,
	ItemID.DRAGON_DART_TIP as number,
];

const enchantedBoltIds: number[] = [
	ItemID.DIAMOND_BOLTS_E as number,
	ItemID.ONYX_BOLTS_E as number,
];

const poisonedArrowIds: number[] = [ItemID.ADAMANT_ARROWP as number];

const thrownAxeIds: number[] = [ItemID.RUNE_THROWNAXE as number];

const cannonballIds: number[] = [
	ItemID.STEEL_CANNONBALL as number,
	ItemID.ADAMANT_CANNONBALL as number,
	ItemID.RUNE_CANNONBALL as number,
];

export const ammo = {
	arrows: arrowIds,
	bolts: boltIds,
	knives: knifeIds,
	darts: dartIds,
	javelins: javelinIds,
	unfinishedBolts: unfinishedBoltIds,
	javelinTips: javelinTipIds,
	boltTips: boltTipIds,
	arrowtips: arrowtipIds,
	dartTips: dartTipIds,
	enchantedBolts: enchantedBoltIds,
	thrownAxes: thrownAxeIds,
	cannonballs: cannonballIds,
	poisonedArrows: poisonedArrowIds,
	all: [
		...arrowIds,
		...boltIds,
		...knifeIds,
		...dartIds,
		...javelinIds,
		...unfinishedBoltIds,
		...javelinTipIds,
		...boltTipIds,
		...arrowtipIds,
		...dartTipIds,
		...enchantedBoltIds,
		...thrownAxeIds,
		...cannonballIds,
		...poisonedArrowIds,
	],
};

export type AmmoCategory =
	| 'arrows'
	| 'bolts'
	| 'knives'
	| 'darts'
	| 'javelins'
	| 'unfinishedBolts'
	| 'javelinTips'
	| 'boltTips'
	| 'arrowtips'
	| 'dartTips'
	| 'enchantedBolts'
	| 'thrownAxes'
	| 'cannonballs'
	| 'poisonedArrows';

export const ammoPriorityOverrides: Record<AmmoCategory, PriorityOverrides> = {
	arrows: {
		[ItemID.BRONZE_ARROW]: 7,
		[ItemID.IRON_ARROW]: 6,
		[ItemID.STEEL_ARROW]: 5,
		[ItemID.MITHRIL_ARROW]: 4,
		[ItemID.ADAMANT_ARROW]: 3,
		[ItemID.RUNE_ARROW]: 2,
		[ItemID.DRAGON_ARROW]: 1,
	},

	bolts: {
		[ItemID.BRONZE_BOLTS]: 8,
		[ItemID.IRON_BOLTS]: 7,
		[ItemID.STEEL_BOLTS]: 6,
		[ItemID.MITHRIL_BOLTS]: 5,
		[ItemID.ADAMANT_BOLTS]: 4,
		[ItemID.RUNITE_BOLTS]: 3,
		[ItemID.DRAGON_BOLTS]: 2,
		[ItemID.DRAGONSTONE_BOLTS_E]: 1,
		[ItemID.ONYX_BOLTS]: 1,
	},

	knives: {
		[ItemID.BRONZE_KNIFE]: 7,
		[ItemID.IRON_KNIFE]: 6,
		[ItemID.STEEL_KNIFE]: 5,
		[ItemID.BLACK_KNIFE]: 4,
		[ItemID.MITHRIL_KNIFE]: 3,
		[ItemID.ADAMANT_KNIFE]: 2,
		[ItemID.RUNE_KNIFE]: 1,
		[ItemID.RUNE_KNIFEP]: 1,
		[ItemID.DRAGON_KNIFE]: 1,
	},

	darts: {
		[ItemID.BRONZE_DART]: 7,
		[ItemID.IRON_DART]: 6,
		[ItemID.STEEL_DART]: 5,
		[ItemID.BLACK_DART]: 4,
		[ItemID.MITHRIL_DART]: 3,
		[ItemID.ADAMANT_DART]: 2,
		[ItemID.RUNE_DART]: 1,
		[ItemID.DRAGON_DART]: 1,
	},

	javelins: {
		[ItemID.BRONZE_JAVELIN]: 5,
		[ItemID.MITHRIL_JAVELIN]: 4,
		[ItemID.ADAMANT_JAVELIN]: 3,
		[ItemID.RUNE_JAVELIN]: 2,
		[ItemID.DRAGON_JAVELIN]: 1,
	},

	unfinishedBolts: {
		[ItemID.BRONZE_BOLTS_UNF]: 7,
		[ItemID.IRON_BOLTS_UNF]: 6,
		[ItemID.STEEL_BOLTS_UNF]: 5,
		[ItemID.MITHRIL_BOLTS_UNF]: 4,
		[ItemID.ADAMANT_BOLTSUNF]: 3,
		[ItemID.RUNITE_BOLTS_UNF]: 2,
		[ItemID.DRAGON_BOLTS_UNF]: 1,
	},

	javelinTips: {
		[ItemID.BRONZE_JAVELIN_TIPS]: 7,
		[ItemID.IRON_JAVELIN_TIPS]: 6,
		[ItemID.STEEL_JAVELIN_TIPS]: 5,
		[ItemID.MITHRIL_JAVELIN_TIPS]: 4,
		[ItemID.ADAMANT_JAVELIN_TIPS]: 3,
		[ItemID.RUNE_JAVELIN_TIPS]: 2,
		[ItemID.DRAGON_JAVELIN_TIPS]: 1,
	},

	boltTips: {
		[ItemID.OPAL_BOLT_TIPS]: 10,
		[ItemID.JADE_BOLT_TIPS]: 9,
		[ItemID.PEARL_BOLT_TIPS]: 8,
		[ItemID.TOPAZ_BOLT_TIPS]: 7,
		[ItemID.SAPPHIRE_BOLT_TIPS]: 6,
		[ItemID.EMERALD_BOLT_TIPS]: 5,
		[ItemID.RUBY_BOLT_TIPS]: 4,
		[ItemID.DIAMOND_BOLT_TIPS]: 3,
		[ItemID.DRAGONSTONE_BOLT_TIPS]: 2,
		[ItemID.ONYX_BOLT_TIPS]: 1,
	},

	arrowtips: {
		[ItemID.DRAGON_ARROWTIPS]: 1,
	},

	dartTips: {
		[ItemID.RUNE_DART_TIP]: 2,
		[ItemID.DRAGON_DART_TIP]: 1,
	},

	enchantedBolts: {
		[ItemID.DIAMOND_BOLTS_E]: 2,
		[ItemID.ONYX_BOLTS_E]: 1,
	},

	thrownAxes: {
		[ItemID.RUNE_THROWNAXE]: 1,
	},
	cannonballs: {
		[ItemID.STEEL_CANNONBALL]: 3,
		[ItemID.ADAMANT_CANNONBALL]: 2,
		[ItemID.RUNE_CANNONBALL]: 1,
	},
	poisonedArrows: {
		[ItemID.ADAMANT_ARROWP]: 1,
	},
};
