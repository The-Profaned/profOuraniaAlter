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

const DEGRADED_STANDARD_POUCH_CAPACITY: Record<StandardPouchKey, number> = {
	SMALL: 3,
	MEDIUM: 5,
	LARGE: 7,
	GIANT: 9,
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

export const getCurrentPouchCapacity = (pouchKey: PouchKey): number => {
	if (pouchKey === 'SMALL') {
		return POUCH_CAPACITY.SMALL;
	}

	if (pouchKey === 'COLOSSAL') {
		return POUCH_CAPACITY.COLOSSAL;
	}

	const degradedId = POUCH_ITEM_IDS[pouchKey].degraded;
	if (degradedId !== undefined && bot.inventory.containsId(degradedId)) {
		return DEGRADED_STANDARD_POUCH_CAPACITY[pouchKey];
	}

	return POUCH_CAPACITY[pouchKey];
};

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
			totalCapacity += getCurrentPouchCapacity(pouchKey);
		}

		if (totalCapacity > maxInventorySpace) {
			continue;
		}

		const capacityOrdering = selectedPouches
			.map((pouchKey) => getCurrentPouchCapacity(pouchKey))
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
		(left, right) =>
			getCurrentPouchCapacity(right) - getCurrentPouchCapacity(left),
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

const NPC_CONTACT_SPELL_WIDGET_IDS = [14286962, 14286959];
const NPC_CONTACT_WIDGET_GROUP_ID = NPC_CONTACT_SPELL_WIDGET_IDS[0] >> 16;

/* eslint-disable unicorn/prefer-string-replace-all */
const normalizeActionText = (value: string): string =>
	String(value)
		.replace(/<[^>]*>/g, '')
		.replace(/\u00A0/g, ' ')
		.replace(/[^\d\sA-Za-z]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
/* eslint-enable unicorn/prefer-string-replace-all */

const getNormalizedWidgetActions = (
	packedWidgetId: number,
): string[] | null => {
	const widget = client.getWidget(packedWidgetId);
	if (!widget) return null;

	const actions = widget.getActions?.();
	if (!actions || actions.length === 0) return null;

	const normalizedActions: string[] = [];
	for (const action of actions) {
		if (action == null) continue;
		normalizedActions.push(String(action));
	}

	if (normalizedActions.length === 0) return null;
	return normalizedActions;
};

const getNpcContactSpellActions = (): string[] | null => {
	for (const packedWidgetId of NPC_CONTACT_SPELL_WIDGET_IDS) {
		const directActions = getNormalizedWidgetActions(packedWidgetId);
		if (directActions) return directActions;
	}

	for (let childId = 0; childId <= 250; childId += 1) {
		const packedWidgetId = (NPC_CONTACT_WIDGET_GROUP_ID << 16) | childId;
		const actions = getNormalizedWidgetActions(packedWidgetId);
		if (!actions || actions.length <= 1) continue;

		const hasDarkMageAction = actions.some((action) => {
			const normalized = normalizeActionText(action);
			return (
				normalized.includes('dark mage') ||
				normalized.includes('darkmage')
			);
		});

		if (hasDarkMageAction) {
			return actions;
		}
	}

	return null;
};

export const getNpcContactSecondActionText = (): string | null => {
	try {
		const actions = getNpcContactSpellActions();
		if (!actions || actions.length <= 1) return null;

		const secondAction = actions[1];
		if (!secondAction) return null;

		return secondAction;
	} catch {
		return null;
	}
};

export const getDarkMageNpcContactMenuIndex = (): number => {
	const actions = getNpcContactSpellActions();
	if (!actions) return -1;

	for (const [index, action] of actions.entries()) {
		if (index <= 0) continue;

		const normalizedOption = normalizeActionText(action);
		if (
			normalizedOption.includes('dark mage') ||
			normalizedOption.includes('darkmage')
		) {
			return index;
		}
	}

	return -1;
};
