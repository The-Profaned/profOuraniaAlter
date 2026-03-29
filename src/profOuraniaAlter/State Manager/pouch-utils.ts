import { POUCH_ITEM_IDS } from './constants.js';
import { state } from './script-state.js';

type DegradablePouchKey = 'MEDIUM' | 'LARGE' | 'GIANT' | 'COLOSSAL';

const DEGRADABLE_POUCH_KEYS: DegradablePouchKey[] = [
	'MEDIUM',
	'LARGE',
	'GIANT',
	'COLOSSAL',
];

const behaviourKeyForPouch: Record<
	DegradablePouchKey,
	keyof typeof state.behaviour
> = {
	MEDIUM: 'useMediumPouch',
	LARGE: 'useLargePouch',
	GIANT: 'useGiantPouch',
	COLOSSAL: 'useColossalPouch',
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

export const getDarkMageNpcContactMenuIndex = (): number => {
	try {
		const menuEntries = client.getMenuEntries();
		if (!menuEntries || menuEntries.length <= 1) return -1;

		const secondActionOption = menuEntries[1]?.getOption?.();
		if (!secondActionOption) return -1;

		const normalizedOption = secondActionOption.trim().toLowerCase();
		const isDarkMageSecondAction =
			normalizedOption === 'dark mage npc contact' ||
			normalizedOption === 'dark mage contact';

		return isDarkMageSecondAction ? 1 : -1;
	} catch {
		return -1;
	}
};
