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
