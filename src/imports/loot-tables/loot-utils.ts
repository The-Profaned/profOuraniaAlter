import {
	DEFAULT_LOOT_PRIORITY,
	type LootPriority,
	type PriorityOverrides,
} from './loot-priority.js';
import type { LootTag } from './loot-index.js';

type TileItemInfo = {
	item: net.runelite.api.TileItem;
	getName(): string;
	loot(): void;
};

type TileItem = TileItemInfo & {
	tile: net.runelite.api.Tile;
	getId?: () => number;
	getItemId?: () => number;
};

export type LootTileItem = TileItem;

type InventoryItem = {
	getId(): number;
	getQuantity(): number;
};

export type LootGroup = {
	name: string;
	itemIds: number[];
	sortedItemIds: number[];
	priorityById: Record<number, LootPriority>;
	tag?: LootTag;
	priorityOverrides?: PriorityOverrides;
};

export type LootGroupConfig = {
	name: string;
	itemIds: number[];
	tag?: LootTag;
	priorityOverrides?: PriorityOverrides;
};

export type HighValueKeysCache = {
	lastTick: number;
	keysCache: string[];
};

// Retrieves the item ID from a tile item, checking for both getId and getItemId methods, and returns null if neither method is available or if the item ID cannot be determined
export const getTileItemId = (tileItem: TileItem): number | null => {
	if (typeof tileItem.getId === 'function') {
		return tileItem.getId();
	}
	if (typeof tileItem.getItemId === 'function') {
		return tileItem.getItemId();
	}
	return null;
};

// Generates a unique key for a tile item based on its ID and location, or returns null if the item ID or location cannot be determined
export const getTileItemKey = (tileItem: TileItem): string | null => {
	const itemId = getTileItemId(tileItem);
	if (itemId === null) {
		return null;
	}
	const tile = tileItem.tile;
	if (!tile) {
		return null;
	}
	const loc = tile.getWorldLocation();
	return `${itemId}:${loc.getX()}:${loc.getY()}`;
};

// Builds an index mapping item IDs
export const buildLootGroup = (
	config: LootGroupConfig,
	getLootPriority: (itemId: number, category?: LootTag) => LootPriority,
): LootGroup => {
	const priorityById: Record<number, LootPriority> = {};
	for (const itemId of config.itemIds) {
		if (config.tag) {
			priorityById[itemId] = getLootPriority(itemId, config.tag);
			continue;
		}
		const overridePriority: LootPriority | undefined =
			config.priorityOverrides?.[itemId];
		priorityById[itemId] =
			typeof overridePriority === 'number'
				? overridePriority
				: DEFAULT_LOOT_PRIORITY;
	}

	const sortedItemIds = [...config.itemIds].sort(
		(a: number, b: number) => priorityById[a] - priorityById[b],
	);

	return {
		name: config.name,
		itemIds: config.itemIds,
		sortedItemIds,
		priorityById,
		tag: config.tag,
		priorityOverrides: config.priorityOverrides,
	};
};

// Builds an index mapping item IDs to their associated loot tags
export const buildLootGroupsFromTags = (
	tags: LootTag[],
	lists: Record<LootTag, number[]>,
	getLootPriority: (itemId: number, category?: LootTag) => LootPriority,
	extraGroups: LootGroupConfig[] = [],
): LootGroup[] => {
	const groups: LootGroup[] = tags.map((tag: LootTag) =>
		buildLootGroup(
			{
				name: tag,
				tag,
				itemIds: lists[tag],
			},
			getLootPriority,
		),
	);

	for (const group of extraGroups) {
		groups.push(buildLootGroup(group, getLootPriority));
	}

	return groups;
};

// Builds initial inventory counts based on the provided initial inventory configuration
export const buildInitialInventoryCounts = (
	initialInventory: Record<number, { itemId: number; quantity: number }>,
): Record<number, number> => {
	const counts: Record<number, number> = {};
	for (const entry of Object.values(initialInventory)) {
		counts[entry.itemId] = (counts[entry.itemId] ?? 0) + entry.quantity;
	}
	return counts;
};

// Gets the inventory count by item ID for the current inventory state
export const getInventoryCounts = (): Record<number, number> => {
	const counts: Record<number, number> = {};
	const inventoryContainer = client.getItemContainer(93) as {
		getItems(): InventoryItem[];
	} | null;
	if (!inventoryContainer) {
		return counts;
	}

	const items = inventoryContainer.getItems();
	for (const item of items) {
		const itemId = item.getId();
		if (itemId <= 0) {
			continue;
		}
		counts[itemId] = (counts[itemId] ?? 0) + item.getQuantity();
	}

	return counts;
};

// Selects the best tile item based on group
export const selectBestTileItemFromGroup = (
	group: LootGroup,
	maxDistance: number,
	maxDistanceSquared?: number,
): { itemId: number; tileItem: TileItem } | null => {
	const playerLoc = client.getLocalPlayer().getWorldLocation();
	const tileItems = bot.tileItems.getItemsWithIds(
		group.sortedItemIds,
	) as TileItem[];
	if (tileItems.length === 0) {
		return null;
	}

	const maxDistanceSquaredValue =
		typeof maxDistanceSquared === 'number'
			? maxDistanceSquared
			: maxDistance * maxDistance;

	let bestItem: TileItem | null = null;
	let bestItemId: number | null = null;
	let bestPriority: LootPriority = DEFAULT_LOOT_PRIORITY;
	let bestDistanceSquared = maxDistanceSquaredValue + 1;

	for (const tileItem of tileItems) {
		const itemId = getTileItemId(tileItem);
		if (itemId === null) {
			continue;
		}
		const itemPriority =
			group.priorityById[itemId] ?? DEFAULT_LOOT_PRIORITY;
		const tile = tileItem.tile;
		if (!tile) {
			continue;
		}
		const loc = tile.getWorldLocation();
		const dx = loc.getX() - playerLoc.getX();
		const dy = loc.getY() - playerLoc.getY();
		const distanceSquared = dx * dx + dy * dy;
		if (distanceSquared > maxDistanceSquaredValue) {
			continue;
		}
		if (
			itemPriority < bestPriority ||
			(itemPriority === bestPriority &&
				distanceSquared < bestDistanceSquared)
		) {
			bestPriority = itemPriority;
			bestDistanceSquared = distanceSquared;
			bestItem = tileItem;
			bestItemId = itemId;
		}
	}

	if (!bestItem || bestItemId === null) {
		return null;
	}

	return { itemId: bestItemId, tileItem: bestItem };
};

// Generates a signature string for a set of ground items based on their IDs and locations
export const getGroundItemsSignature = (itemIds: number[]): string => {
	if (itemIds.length === 0) {
		return '';
	}

	const tileItems = bot.tileItems.getItemsWithIds(itemIds) as TileItem[];
	if (tileItems.length === 0) {
		return '';
	}

	const tokens: string[] = [];
	for (const tileItem of tileItems) {
		const key = getTileItemKey(tileItem);
		if (!key) {
			continue;
		}
		tokens.push(key);
	}

	if (tokens.length === 0) {
		return '';
	}

	tokens.sort();
	return tokens.join('|');
};

// Gets the set of high-value item keys for items on the ground that meet a specified value threshold, utilizing caching to optimize performance within the same game tick
export const getHighValueTileItemKeys = (paramaters: {
	valueThreshold: number;
	gameTick: number;
	cache: HighValueKeysCache;
}): Set<string> => {
	const { valueThreshold, gameTick, cache } = paramaters;
	if (valueThreshold <= 0) {
		cache.lastTick = gameTick;
		cache.keysCache = [];
		return new Set<string>();
	}
	if (cache.lastTick === gameTick) {
		return new Set<string>(cache.keysCache);
	}

	const highValueItems = bot.tileItems.getItemsOfValue(
		valueThreshold,
	) as TileItem[];
	const keys = new Set<string>(
		highValueItems
			.map((tileItem: TileItem) => getTileItemKey(tileItem))
			.filter((key: string | null): key is string => key !== null),
	);

	cache.lastTick = gameTick;
	cache.keysCache = Array.from(keys);
	return keys;
};

// Finds a droppable item ID from the group based on current and initial inventory counts
export const findDroppableItemInGroup = (
	group: LootGroup,
	currentCounts: Record<number, number>,
	initialCounts: Record<number, number>,
	shouldDrop?: (itemId: number) => boolean,
): number | null => {
	for (let index = group.sortedItemIds.length - 1; index >= 0; index -= 1) {
		const itemId = group.sortedItemIds[index];
		const currentCount = currentCounts[itemId] ?? 0;
		const initialCount = initialCounts[itemId] ?? 0;
		if (currentCount > initialCount) {
			if (shouldDrop && !shouldDrop(itemId)) {
				continue;
			}
			return itemId;
		}
	}

	return null;
};

// Drops the looted item from groups based on the current inventory state compared to the initial inventory counts, and invokes a callback for each dropped item
export const dropLootedItemFromGroups = (
	groups: LootGroup[],
	initialCounts: Record<number, number>,
	onDrop?: (itemId: number) => void,
	shouldDrop?: (itemId: number) => boolean,
): boolean => {
	const currentCounts = getInventoryCounts();
	for (const group of groups) {
		const targetItemId = findDroppableItemInGroup(
			group,
			currentCounts,
			initialCounts,
			shouldDrop,
		);
		if (targetItemId === null) {
			continue;
		}
		bot.inventory.interactWithIds([targetItemId], ['Drop']);
		onDrop?.(targetItemId);
		return true;
	}

	return false;
};

// Creates a filter function that checks if the minimum value of looted items is below a specified threshold, based on a provided mapping of item IDs to their minimum values
export const createValueDropFilter =
	(
		lootedItemMinValue: Record<number, number>,
		threshold: number,
	): ((itemId: number) => boolean) =>
	(itemId: number): boolean =>
		(lootedItemMinValue[itemId] ?? 0) < threshold;
