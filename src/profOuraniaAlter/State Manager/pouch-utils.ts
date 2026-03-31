import { POUCH_ITEM_IDS } from './constants.js';
import { state } from './script-state.js';
import type { PouchKey, StandardPouchKey } from './script-state.js';

type DegradablePouchKey = 'MEDIUM' | 'LARGE' | 'GIANT' | 'COLOSSAL';

const STANDARD_POUCH_KEYS: StandardPouchKey[] = [
	'GIANT',
	'LARGE',
	'MEDIUM',
	'SMALL',
];

const ALL_POUCH_KEYS: PouchKey[] = ['COLOSSAL', ...STANDARD_POUCH_KEYS];

const POUCH_CAPACITY: Record<PouchKey, number> = {
	SMALL: 3,
	MEDIUM: 6,
	LARGE: 9,
	GIANT: 12,
	COLOSSAL: 40,
};

type PouchBehaviourKey =
	| 'useSmallPouch'
	| 'useMediumPouch'
	| 'useLargePouch'
	| 'useGiantPouch'
	| 'useColossalPouch';

const DEGRADABLE_POUCH_KEYS: DegradablePouchKey[] = [
	'MEDIUM',
	'LARGE',
	'GIANT',
	'COLOSSAL',
];

const behaviourKeyForPouch: Record<PouchKey, PouchBehaviourKey> = {
	SMALL: 'useSmallPouch',
	MEDIUM: 'useMediumPouch',
	LARGE: 'useLargePouch',
	GIANT: 'useGiantPouch',
	COLOSSAL: 'useColossalPouch',
};

export const getPouchCapacity = (pouchKey: PouchKey): number =>
	POUCH_CAPACITY[pouchKey];

export const getPouchInventoryItemIds = (pouchKey: PouchKey): number[] => {
	const pouchIds: number[] = [POUCH_ITEM_IDS[pouchKey].normal];
	const degradedId = POUCH_ITEM_IDS[pouchKey].degraded;
	if (degradedId !== undefined) {
		pouchIds.push(degradedId);
	}
	return pouchIds;
};

export const hasPouchInInventory = (pouchKey: PouchKey): boolean =>
	getPouchInventoryItemIds(pouchKey).some((itemId) =>
		bot.inventory.containsId(itemId),
	);

const isConfiguredPouchEnabled = (pouchKey: PouchKey): boolean =>
	state.behaviour[behaviourKeyForPouch[pouchKey]];

export const getActivePouchKeysInInventory = (): PouchKey[] =>
	ALL_POUCH_KEYS.filter(
		(pouchKey) =>
			isConfiguredPouchEnabled(pouchKey) && hasPouchInInventory(pouchKey),
	);

export const getActiveStandardPouchKeysInInventory = (): StandardPouchKey[] =>
	STANDARD_POUCH_KEYS.filter(
		(pouchKey) =>
			isConfiguredPouchEnabled(pouchKey) && hasPouchInInventory(pouchKey),
	);

const compareCapacityListsDescending = (
	left: number[],
	right: number[],
): number => {
	const longestLength = Math.max(left.length, right.length);
	for (let index = 0; index < longestLength; index += 1) {
		const leftValue = left[index] ?? -1;
		const rightValue = right[index] ?? -1;
		if (leftValue !== rightValue) {
			return leftValue - rightValue;
		}
	}
	return 0;
};

export const chooseBestStandardPouchBatch = (
	remainingPouches: StandardPouchKey[],
	maxInventorySpace: number,
): StandardPouchKey[] => {
	if (remainingPouches.length === 0 || maxInventorySpace <= 0) {
		return [];
	}

	let bestBatch: StandardPouchKey[] = [];
	let bestTotalCapacity = 0;
	let bestCapacityOrdering: number[] = [];

	const subsetCount = 1 << remainingPouches.length;
	for (let mask = 1; mask < subsetCount; mask += 1) {
		const selectedPouches: StandardPouchKey[] = [];
		let totalCapacity = 0;

		for (const [index, pouchKey] of remainingPouches.entries()) {
			if ((mask & (1 << index)) === 0) continue;
			selectedPouches.push(pouchKey);
			totalCapacity += getPouchCapacity(pouchKey);
		}

		if (totalCapacity > maxInventorySpace) {
			continue;
		}

		const capacityOrdering = selectedPouches
			.map((pouchKey) => getPouchCapacity(pouchKey))
			.sort((left, right) => right - left);

		if (
			totalCapacity > bestTotalCapacity ||
			(totalCapacity === bestTotalCapacity &&
				compareCapacityListsDescending(
					capacityOrdering,
					bestCapacityOrdering,
				) > 0)
		) {
			bestBatch = selectedPouches;
			bestTotalCapacity = totalCapacity;
			bestCapacityOrdering = capacityOrdering;
		}
	}

	return bestBatch.sort(
		(left, right) => getPouchCapacity(right) - getPouchCapacity(left),
	);
};

export const getActiveDegradedPouchIds = (): number[] => {
	const degradedIds: number[] = [];
	for (const key of DEGRADABLE_POUCH_KEYS) {
		if (!state.behaviour[behaviourKeyForPouch[key]]) continue;
		const pouchData = POUCH_ITEM_IDS[key];
		if (
			pouchData.degraded !== undefined &&
			bot.inventory.containsId(pouchData.degraded)
		) {
			degradedIds.push(pouchData.degraded);
		}
	}
	return degradedIds;
};

export const anyPouchDegraded = (): boolean =>
	getActiveDegradedPouchIds().length > 0;

const NPC_CONTACT_SPELL_WIDGET_ID = 14286959;

const normalizeActionText = (value: string): string =>
	value
		.replaceAll(/<[^>]*>/g, '')
		.replaceAll('\u00A0', ' ')
		.replaceAll(/[^\d\sA-Za-z]/g, ' ')
		.replaceAll(/\s+/g, ' ')
		.trim()
		.toLowerCase();

export const getNpcContactSecondActionText = (): string | null => {
	try {
		const widget = client.getWidget(NPC_CONTACT_SPELL_WIDGET_ID);
		if (!widget) return null;

		const actions = widget.getActions?.();
		if (!actions || actions.length <= 1) return null;

		const secondAction = actions[1];
		if (!secondAction) return null;

		return secondAction;
	} catch {
		return null;
	}
};

export const getDarkMageNpcContactMenuIndex = (): number => {
	const secondActionOption = getNpcContactSecondActionText();
	if (!secondActionOption) return -1;

	const normalizedOption = normalizeActionText(secondActionOption);
	const isDarkMageSecondAction = normalizedOption.includes('dark mage');

	if (!isDarkMageSecondAction) return -1;

	return 1;
};
