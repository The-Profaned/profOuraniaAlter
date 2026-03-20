import { ammo, ammoPriorityOverrides } from './ammo.js';
import {
	armourWeapons,
	armourWeaponsPriorityOverrides,
} from './armour-weapons.js';
import {
	combatSupplies,
	combatSuppliesPriorityOverrides,
} from './combat-supplies.js';
import { generalLoot, generalLootPriorityOverrides } from './general-loot.js';
import { gems, gemsPriorityOverrides } from './gems.js';
import { vorkathSeeds, vorkathSeedsPriorityOverrides } from './herbs-seeds.js';
import { oresBars, oresBarsPriorityOverrides } from './ores-bars.js';
import { runes, runesPriorityOverrides } from './runes.js';
import {
	clueScrolls,
	tertiary,
	tertiaryPriorityOverrides,
} from './tertiary.js';
import {
	DEFAULT_LOOT_PRIORITY,
	type LootPriority,
	type PriorityOverrides,
} from './loot-priority.js';

// This file serves as the central index for loot tables, defining loot categories, their associated item IDs, and priority overrides. It also builds efficient lookup structures for determining loot tags and priorities based on item IDs.
export type LootTag =
	| 'runes'
	| 'gems'
	| 'ores'
	| 'bars'
	| 'ammo.arrows'
	| 'ammo.bolts'
	| 'ammo.knives'
	| 'ammo.darts'
	| 'ammo.javelins'
	| 'ammo.unfinishedBolts'
	| 'ammo.javelinTips'
	| 'ammo.boltTips'
	| 'ammo.arrowtips'
	| 'ammo.dartTips'
	| 'ammo.enchantedBolts'
	| 'ammo.thrownAxes'
	| 'ammo.cannonballs'
	| 'ammo.poisonedArrows'
	| 'weapons'
	| 'armour'
	| 'supplies.cookedFood'
	| 'supplies.rawFood'
	| 'supplies.potions'
	| 'general.resources'
	| 'general.dragonhide'
	| 'general.materials'
	| 'herbs'
	| 'herbSeeds'
	| 'treeSeeds'
	| 'otherSeeds'
	| 'tertiary'
	| 'clueScrolls';

export const lootCategoryLists: Record<LootTag, number[]> = {
	runes: runes,
	gems: gems,
	ores: oresBars.ores,
	bars: oresBars.bars,
	'ammo.arrows': ammo.arrows,
	'ammo.bolts': ammo.bolts,
	'ammo.knives': ammo.knives,
	'ammo.darts': ammo.darts,
	'ammo.javelins': ammo.javelins,
	'ammo.unfinishedBolts': ammo.unfinishedBolts,
	'ammo.javelinTips': ammo.javelinTips,
	'ammo.boltTips': ammo.boltTips,
	'ammo.arrowtips': ammo.arrowtips,
	'ammo.dartTips': ammo.dartTips,
	'ammo.enchantedBolts': ammo.enchantedBolts,
	'ammo.thrownAxes': ammo.thrownAxes,
	'ammo.cannonballs': ammo.cannonballs,
	'ammo.poisonedArrows': ammo.poisonedArrows,
	weapons: armourWeapons.weapons,
	armour: armourWeapons.armour,
	'supplies.cookedFood': combatSupplies.cookedFood,
	'supplies.rawFood': combatSupplies.rawFood,
	'supplies.potions': combatSupplies.potions,
	'general.resources': generalLoot.resources,
	'general.dragonhide': generalLoot.dragonhide,
	'general.materials': generalLoot.materials,
	herbs: vorkathSeeds.herbIds,
	herbSeeds: vorkathSeeds.herbSeeds,
	treeSeeds: vorkathSeeds.treeSeeds,
	otherSeeds: vorkathSeeds.otherSeeds,
	tertiary: tertiary,
	clueScrolls: clueScrolls,
};

// Defines the loot category priority overrides for specific items within each category
export const lootCategoryPriorityOverrides: Partial<
	Record<LootTag, PriorityOverrides>
> = {
	runes: runesPriorityOverrides,
	gems: gemsPriorityOverrides,
	ores: oresBarsPriorityOverrides.ores,
	bars: oresBarsPriorityOverrides.bars,
	'ammo.arrows': ammoPriorityOverrides.arrows,
	'ammo.bolts': ammoPriorityOverrides.bolts,
	'ammo.knives': ammoPriorityOverrides.knives,
	'ammo.darts': ammoPriorityOverrides.darts,
	'ammo.javelins': ammoPriorityOverrides.javelins,
	'ammo.unfinishedBolts': ammoPriorityOverrides.unfinishedBolts,
	'ammo.javelinTips': ammoPriorityOverrides.javelinTips,
	'ammo.boltTips': ammoPriorityOverrides.boltTips,
	'ammo.arrowtips': ammoPriorityOverrides.arrowtips,
	'ammo.dartTips': ammoPriorityOverrides.dartTips,
	'ammo.enchantedBolts': ammoPriorityOverrides.enchantedBolts,
	'ammo.thrownAxes': ammoPriorityOverrides.thrownAxes,
	'ammo.cannonballs': ammoPriorityOverrides.cannonballs,
	'ammo.poisonedArrows': ammoPriorityOverrides.poisonedArrows,
	weapons: armourWeaponsPriorityOverrides.weapons,
	armour: armourWeaponsPriorityOverrides.armour,
	'supplies.cookedFood': combatSuppliesPriorityOverrides.cookedFood,
	'supplies.rawFood': combatSuppliesPriorityOverrides.rawFood,
	'supplies.potions': combatSuppliesPriorityOverrides.potions,
	'general.resources': generalLootPriorityOverrides.resources,
	'general.dragonhide': generalLootPriorityOverrides.dragonhide,
	'general.materials': generalLootPriorityOverrides.materials,
	herbs: vorkathSeedsPriorityOverrides.herbIds,
	herbSeeds: vorkathSeedsPriorityOverrides.herbSeeds,
	treeSeeds: vorkathSeedsPriorityOverrides.treeSeeds,
	otherSeeds: vorkathSeedsPriorityOverrides.otherSeeds,
	tertiary: tertiaryPriorityOverrides.tertiary,
	clueScrolls: tertiaryPriorityOverrides.clueScrolls,
};

// Builds an index mapping item IDs to their associated loot tags
const resolvePriority = (
	itemId: number,
	categoryOverrides: PriorityOverrides | undefined,
	defaultPriority: LootPriority,
): LootPriority => {
	const categoryPriority: LootPriority | undefined =
		categoryOverrides?.[itemId];
	if (typeof categoryPriority === 'number') {
		return categoryPriority;
	}

	return defaultPriority;
};

// Builds the catagory prioritization mapping for all categories based on the defined lists and overrides
const buildCategoryPriorities = (
	lists: Record<LootTag, number[]>,
	categoryOverrides: Partial<Record<LootTag, PriorityOverrides>>,
	defaultPriority: LootPriority,
): Record<LootTag, Record<number, LootPriority>> => {
	const priorities = {} as Record<LootTag, Record<number, LootPriority>>;
	const entries: [LootTag, number[]][] = Object.entries(lists) as [
		LootTag,
		number[],
	][];

	for (const [tag, items] of entries) {
		const overrides: PriorityOverrides | undefined = categoryOverrides[tag];
		const categoryPriorityMap: Record<number, LootPriority> = {};
		for (const itemId of items) {
			categoryPriorityMap[itemId] = resolvePriority(
				itemId,
				overrides,
				defaultPriority,
			);
		}
		priorities[tag] = categoryPriorityMap;
	}

	return priorities;
};

// Builds teh tag index mapping for all items based on the defined lists
const buildItemTagIndex = (
	lists: Record<LootTag, number[]>,
): Record<number, LootTag[]> => {
	const index: Record<number, LootTag[]> = {};
	const entries: [LootTag, number[]][] = Object.entries(lists) as [
		LootTag,
		number[],
	][];

	for (const [tag, items] of entries) {
		for (const itemId of items) {
			const existing: LootTag[] | undefined = index[itemId];
			if (existing) {
				if (!existing.includes(tag)) {
					existing.push(tag);
				}
				continue;
			}
			index[itemId] = [tag];
		}
	}

	return index;
};

// Builds the loot group configuration for a given category, resolving item priorities based on the provided getLootPriority function and any specified overrides
const buildCategorySets = (
	lists: Record<LootTag, number[]>,
): Record<LootTag, Set<number>> => {
	const sets: Record<LootTag, Set<number>> = {} as Record<
		LootTag,
		Set<number>
	>;

	const entries: [LootTag, number[]][] = Object.entries(lists) as [
		LootTag,
		number[],
	][];

	for (const [tag, items] of entries) {
		sets[tag] = new Set<number>(items);
	}

	return sets;
};

export const lootTagIndex = buildItemTagIndex(lootCategoryLists);
export const lootCategorySets = buildCategorySets(lootCategoryLists);
export const lootCategoryPriorities = buildCategoryPriorities(
	lootCategoryLists,
	lootCategoryPriorityOverrides,
	DEFAULT_LOOT_PRIORITY,
);

// Gets the loot tags associated with a given item ID, or an empty array if the item ID is not found in any category
export const getTagsForItem = (itemId: number): LootTag[] =>
	lootTagIndex[itemId] ?? [];

// Checks if a given item ID has a specific loot tag
export const hasLootTag = (tag: LootTag, itemId: number): boolean =>
	lootCategorySets[tag].has(itemId);

// Gets the loot priority for a given item ID, optionally within the context of a specific category, by checking for any applicable overrides and returning the best priority found
export const getLootPriority = (
	itemId: number,
	category?: LootTag,
): LootPriority => {
	if (category) {
		const categoryPriority: LootPriority | undefined =
			lootCategoryPriorities[category][itemId];
		if (typeof categoryPriority === 'number') {
			return categoryPriority;
		}
	}

	const tags: LootTag[] | undefined = lootTagIndex[itemId];
	if (!tags || tags.length === 0) {
		return DEFAULT_LOOT_PRIORITY;
	}

	let bestPriority: LootPriority = DEFAULT_LOOT_PRIORITY;
	for (const tag of tags) {
		const categoryPriority: LootPriority | undefined =
			lootCategoryPriorities[tag][itemId];
		if (
			typeof categoryPriority === 'number' &&
			categoryPriority < bestPriority
		) {
			bestPriority = categoryPriority;
		}
	}

	return bestPriority;
};
