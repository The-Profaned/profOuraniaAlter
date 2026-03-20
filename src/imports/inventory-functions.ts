/* eslint-disable @typescript-eslint/restrict-template-expressions */
// imports
import { handleFailure } from './general-function.js';
import { logger } from './logger.js';
import { timeoutManager } from './timeout-manager.js';
import { State } from './types.js';
import { getTileItemId, type LootTileItem } from './loot-tables/loot-utils.js';

// inventory functions
export const dropItem = (
	state: State,
	itemId: number,
	failResetState?: string,
): boolean => {
	if (bot.inventory.containsId(itemId)) {
		bot.inventory.interactWithIds([itemId], ['Drop']);
		itemInventoryTimeoutAbsent(state, itemId, failResetState);
		return false;
	}
	return true;
};

export const getExistingItemId = (
	itemIds: number[],
	selector: 'first' | 'random' = 'first',
): number | undefined => {
	if (!bot.inventory.containsAnyIds(itemIds)) return undefined;
	const existingItemIds = itemIds.filter((id) =>
		bot.inventory.containsId(id),
	);
	if (existingItemIds.length === 0) return undefined;
	return selector === 'random'
		? existingItemIds[Math.floor(Math.random() * existingItemIds.length)]
		: existingItemIds[0];
};

export const getFirstExistingItemId = (itemIds: number[]): number | undefined =>
	getExistingItemId(itemIds, 'first');

export const getRandomExistingItemId = (
	itemIds: number[],
): number | undefined => getExistingItemId(itemIds, 'random');

export const checkQuantities = (
	state: State,
	items: { itemId: number; quantity: number }[],
): boolean => {
	logger(
		state,
		'debug',
		`checkQuantities`,
		'Checking inventory item quantities.',
	);
	for (const item of items) {
		if (bot.inventory.getQuantityOfId(item.itemId) !== item.quantity)
			return false;
	}
	return true;
};

export const itemInventoryTimeoutPresent = (
	state: State,
	itemId: number,
	failResetState?: string,
): boolean => itemInventoryTimeoutCore(state, itemId, failResetState, true);

export const itemInventoryTimeoutAbsent = (
	state: State,
	itemId: number,
	failResetState?: string,
): boolean => itemInventoryTimeoutCore(state, itemId, failResetState, false);

export const swapGear = (
	state: State,
	itemIds: number[],
	itemNames: string[],
	targetSlot: number,
	failResetState?: string,
): boolean => {
	// Try to find item by ID first
	if (bot.inventory.containsAnyIds(itemIds)) {
		const sourceSlot = bot.inventory.interactWithIds(itemIds, ['Equip']);
		if (sourceSlot !== undefined) {
			logger(
				state,
				'debug',
				'swapGear',
				`Swapping item ID ${itemIds.join(', ')} from slot ${sourceSlot} to slot ${targetSlot}`,
			);
			return true;
		}
	}

	// Fallback to item names if IDs not found
	if (itemNames && itemNames.length > 0) {
		const sourceSlot = bot.inventory.interactWithNames(itemNames, [
			'Equip',
		]);
		if (sourceSlot !== undefined) {
			logger(
				state,
				'debug',
				'swapGear',
				`Swapping item by name "${itemNames}" from slot ${sourceSlot} to slot ${targetSlot}`,
			);
			return true;
		}
	}

	logger(
		state,
		'debug',
		'swapGear',
		`No items found with IDs ${itemIds} or names ${itemNames}`,
	);
	if (failResetState) {
		handleFailure(
			state,
			'swapGear',
			`Item not found for swapping`,
			failResetState,
		);
	}
	return false;
};

// Cache the current inventory state into a structured object mapping slot indices to item IDs and quantities
export const cacheInventory = (
	state: State,
): Record<number, { itemId: number; quantity: number }> => {
	const cachedInventory: Record<
		number,
		{ itemId: number; quantity: number }
	> = {};

	type InventoryItem = {
		getId?: () => number;
		getItemId?: () => number;
		id?: number;
		getQuantity?: () => number;
		getStackSize?: () => number;
		quantity?: number;
		getSlot?: () => number;
		getIndex?: () => number;
		slot?: number;
		index?: number;
	};

	type InventoryApi = {
		getItems?: () => InventoryItem[];
		getItemsInInventory?: () => InventoryItem[];
		getAllItems?: () => InventoryItem[];
		getItemIds?: () => number[];
		getInventoryItemIds?: () => number[];
	};

	const inventoryApi: InventoryApi = bot.inventory as InventoryApi;
	const inventoryItems: InventoryItem[] | null =
		inventoryApi.getItems?.() ??
		inventoryApi.getItemsInInventory?.() ??
		inventoryApi.getAllItems?.() ??
		null;

	if (inventoryItems && inventoryItems.length > 0) {
		inventoryItems.forEach((item, index) => {
			const rawId = item.getId?.() ?? item.getItemId?.() ?? item.id ?? -1;
			const rawQuantity =
				item.getQuantity?.() ??
				item.getStackSize?.() ??
				item.quantity ??
				0;
			const rawSlot =
				item.getSlot?.() ??
				item.getIndex?.() ??
				item.slot ??
				item.index ??
				index;

			if (rawId > 0 && rawQuantity > 0 && rawSlot >= 0) {
				cachedInventory[rawSlot] = {
					itemId: rawId,
					quantity: rawQuantity,
				};
			}
		});
	} else {
		const inventoryIdsRaw: number[] | undefined =
			inventoryApi.getItemIds?.() ?? inventoryApi.getInventoryItemIds?.();

		if (inventoryIdsRaw && inventoryIdsRaw.length > 0) {
			let slotIndex = 0;
			const seenIds = new Set<number>();
			for (const rawId of inventoryIdsRaw) {
				const itemId = Number(rawId);
				if (itemId <= 0 || seenIds.has(itemId)) {
					continue;
				}
				const quantity = bot.inventory.getQuantityOfId(itemId);
				if (quantity <= 0) {
					continue;
				}
				cachedInventory[slotIndex] = {
					itemId,
					quantity,
				};
				seenIds.add(itemId);
				slotIndex += 1;
			}
		} else {
			const inventoryContainer = client.getItemContainer(93);
			if (inventoryContainer) {
				const items = inventoryContainer.getItems();
				for (const [slot, item] of items.entries()) {
					if (item && item.getId() > 0) {
						cachedInventory[slot] = {
							itemId: item.getId(),
							quantity: item.getQuantity(),
						};
					}
				}
			}
		}
	}

	// Log the complete inventory snapshot
	logger(
		state,
		'debug',
		'cacheInventory',
		`Cached inventory state: ${JSON.stringify(cachedInventory, null, 2)}`,
	);

	// Also log in a more readable format
	let inventoryLog: string = 'Inventory Cache:\n';
	for (let slot: number = 0; slot < 28; slot++) {
		inventoryLog += cachedInventory[slot]
			? `Slot ${slot}: Item ID ${cachedInventory[slot].itemId} x${cachedInventory[slot].quantity}\n`
			: `Slot ${slot}: Empty\n`;
	}
	logger(state, 'debug', 'cacheInventory', inventoryLog);

	return cachedInventory;
};

export type DoseMap = Record<number, number>;

// Calculates the total number of doses for a given set of item counts and a mapping of item IDs to their respective doses
export const getTotalDosesFromCounts = (
	counts: Record<number, number>,
	doseMap: DoseMap,
): number => {
	let total = 0;
	for (const [idString, dose] of Object.entries(doseMap)) {
		const itemId = Number(idString);
		const quantity = counts[itemId] ?? 0;
		total += quantity * dose;
	}
	return total;
};

// Calculates the total number of doses for a given mapping of item IDs to their respective doses, based on the current inventory counts
export const getTotalDosesFromInventory = (doseMap: DoseMap): number => {
	let total = 0;
	for (const [idString, dose] of Object.entries(doseMap)) {
		const itemId = Number(idString);
		const quantity = bot.inventory.getQuantityOfId(itemId);
		total += quantity * dose;
	}
	return total;
};

// Calculates the total count of specified food items in the inventory based on their item IDs
export const getTotalFoodCount = (foodItemIds: number[]): number => {
	let total = 0;
	for (const itemId of foodItemIds) {
		total += bot.inventory.getQuantityOfId(itemId);
	}
	return total;
};

// Configuration type for supply checks, including initial counts, dose mappings, food item IDs, and minimum thresholds for doses and food
export type SupplyCheckConfig = {
	initialCounts: Record<number, number>;
	prayerDoseMap: DoseMap;
	restoreDoseMap: DoseMap;
	foodItemIds: number[];
	minDoses: number;
	minFood: number;
};

// Determines whether the bot should bank for supplies based on the current inventory counts compared to the initial counts and specified minimum thresholds for doses and food
export const shouldBankForSupplies = (config: SupplyCheckConfig): boolean => {
	const initialPrayerDoses = getTotalDosesFromCounts(
		config.initialCounts,
		config.prayerDoseMap,
	);
	const initialRestoreDoses = getTotalDosesFromCounts(
		config.initialCounts,
		config.restoreDoseMap,
	);
	const currentPrayerDoses = getTotalDosesFromInventory(config.prayerDoseMap);
	const currentRestoreDoses = getTotalDosesFromInventory(
		config.restoreDoseMap,
	);

	if (
		(initialPrayerDoses > 0 && currentPrayerDoses < config.minDoses) ||
		(initialRestoreDoses > 0 && currentRestoreDoses < config.minDoses)
	) {
		return true;
	}

	const currentFoodCount = getTotalFoodCount(config.foodItemIds);
	if (currentFoodCount < config.minFood) {
		return true;
	}

	return false;
};

export type GroundLootSnapshotCache = {
	lastTick: number;
	idsCache: number[];
	hasStackableLoot: boolean;
	hasHighValueLoot: boolean;
};

export type GroundLootSnapshot = {
	groundLootIds: Set<number>;
	hasStackableLoot: boolean;
	hasHighValueLoot: boolean;
};

// Gets the set of high-value item keys for items on the ground that meet a specified value threshold, utilizing caching to optimize performance within the same game tick
export const getGroundLootSnapshot = (paramaters: {
	lootItemIds: number[];
	valueThreshold: number;
	gameTick: number;
	cache: GroundLootSnapshotCache;
}): GroundLootSnapshot => {
	const { lootItemIds, valueThreshold, gameTick, cache } = paramaters;
	if (cache.lastTick === gameTick) {
		return {
			groundLootIds: new Set<number>(cache.idsCache),
			hasStackableLoot: cache.hasStackableLoot,
			hasHighValueLoot: cache.hasHighValueLoot,
		};
	}

	const groundLootIds = new Set<number>();
	if (lootItemIds.length > 0) {
		const groundLootItems = bot.tileItems.getItemsWithIds(
			lootItemIds,
		) as LootTileItem[];
		for (const tileItem of groundLootItems) {
			const itemId = getTileItemId(tileItem);
			if (itemId !== null) {
				groundLootIds.add(itemId);
			}
		}
	}

	let hasStackableLoot = false;
	for (const itemId of groundLootIds) {
		if (bot.inventory.getQuantityOfId(itemId) > 0) {
			hasStackableLoot = true;
			break;
		}
	}

	let hasHighValueLoot = false;
	if (!hasStackableLoot && groundLootIds.size > 0) {
		const highValueGroundItems = bot.tileItems.getItemsOfValue(
			valueThreshold,
		) as LootTileItem[];
		hasHighValueLoot = highValueGroundItems.some(
			(tileItem: LootTileItem) => {
				const itemId = getTileItemId(tileItem);
				return itemId !== null && groundLootIds.has(itemId);
			},
		);
	}

	cache.lastTick = gameTick;
	cache.idsCache = Array.from(groundLootIds);
	cache.hasStackableLoot = hasStackableLoot;
	cache.hasHighValueLoot = hasHighValueLoot;

	return { groundLootIds, hasStackableLoot, hasHighValueLoot };
};

// core function for item inventory timeout
function itemInventoryTimeoutCore(
	state: State,
	itemId: number,
	failResetState?: string,
	waitForPresence: boolean = true,
): boolean {
	const inInventory = bot.inventory.containsId(itemId);
	const shouldPass = waitForPresence ? inInventory : !inInventory;
	if (!shouldPass) {
		logger(
			state,
			'debug',
			'inventoryFunctions.itemInventoryTimeout',
			`Item ID ${itemId} ${waitForPresence ? 'not in' : 'still in'} inventory.`,
		);
		timeoutManager.add({
			state,
			conditionFunction: () =>
				waitForPresence
					? bot.inventory.containsId(itemId)
					: !bot.inventory.containsId(itemId),
			initialTimeout: 1,
			maxWait: 10,
			onFail: () =>
				handleFailure(
					state,
					'inventoryFunctions.itemInventoryTimeout',
					`Item ID ${itemId} ${waitForPresence ? 'not in' : 'still in'} inventory after 10 ticks.`,
					failResetState,
				),
		});
		return false;
	}
	logger(
		state,
		'debug',
		'inventoryFunctions.itemInventoryTimeout',
		`Item ID ${itemId} is ${waitForPresence ? 'in' : 'not in'} inventory.`,
	);
	return true;
}
