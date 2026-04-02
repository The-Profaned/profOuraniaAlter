import {
	MainStates,
	state,
	type PohAccessOption,
	type RunRestoreOption,
	type RuneOption,
	type RuneSelectionOption,
} from '../../State Manager/script-state.js';

const UI_PREFS_KEY_PREFIX = 'profOuraniaAlter.ui';

const RUNE_OPTIONS: RuneOption[] = [
	'Air',
	'Water',
	'Earth',
	'Fire',
	'Mind',
	'Dust',
	'Cosmic',
	'Astral',
	'Law',
	'Soul',
];

const POH_ACCESS_OPTIONS: PohAccessOption[] = ['Tablet', 'Construction Cape'];

const RUN_RESTORE_OPTIONS: RunRestoreOption[] = [
	'No Restore',
	'Stamina Potions',
	'PoH',
	'Vile Vigour',
	'Desert Amulet',
];

const RUNE_SELECTION_OPTIONS: RuneSelectionOption[] = ['na', ...RUNE_OPTIONS];

const MAIN_STATE_OPTIONS: MainStates[] = [
	MainStates.TRAVEL_TO_OURANIA_ALTAR,
	MainStates.INTERACT_WITH_OURANIA_ALTAR,
	MainStates.TRAVEL_TO_PRAYER_ALTAR,
	MainStates.TRAVEL_TO_POH,
	MainStates.TRAVEL_TO_DESERT,
	MainStates.SWAP_MAGE_BOOK,
	MainStates.USE_PRAYER_ALTAR,
	MainStates.TRAVEL_TO_BANK,
	MainStates.INTERACT_WITH_BANK,
	MainStates.REPAIR_POUCHES,
	MainStates.IDLE,
];

const getPrefKey = (suffix: string): string =>
	`${UI_PREFS_KEY_PREFIX}.${suffix}`;

const getCachedString = (suffix: string, fallback: string): string => {
	return bot.bmCache.getString(getPrefKey(suffix), fallback);
};

const getCachedBoolean = (suffix: string, fallback: boolean): boolean => {
	return bot.bmCache.getBoolean(getPrefKey(suffix), fallback);
};

const getCachedEnumValue = <T extends string>(
	suffix: string,
	fallback: T,
	allowedValues: readonly T[],
): T => {
	const cachedValue = getCachedString(suffix, fallback);
	if (allowedValues.includes(cachedValue as T)) {
		return cachedValue as T;
	}
	return fallback;
};

export const loadUiPreferencesIntoState = (): void => {
	state.settings.runesForBanking = getCachedEnumValue(
		'settings.runesForBanking',
		state.settings.runesForBanking,
		RUNE_OPTIONS,
	);

	state.settings.pohAccessOption = getCachedEnumValue(
		'settings.pohAccessOption',
		state.settings.pohAccessOption,
		POH_ACCESS_OPTIONS,
	);

	state.settings.runePouchEnabled = getCachedBoolean(
		'settings.runePouchEnabled',
		state.settings.runePouchEnabled,
	);

	state.settings.divinePouchEnabled = getCachedBoolean(
		'settings.divinePouchEnabled',
		state.settings.divinePouchEnabled,
	);

	state.settings.runeSelection1 = getCachedEnumValue(
		'settings.runeSelection1',
		state.settings.runeSelection1,
		RUNE_SELECTION_OPTIONS,
	);

	state.settings.runeSelection2 = getCachedEnumValue(
		'settings.runeSelection2',
		state.settings.runeSelection2,
		RUNE_SELECTION_OPTIONS,
	);

	state.settings.runeSelection3 = getCachedEnumValue(
		'settings.runeSelection3',
		state.settings.runeSelection3,
		RUNE_SELECTION_OPTIONS,
	);

	state.settings.runeSelection4 = getCachedEnumValue(
		'settings.runeSelection4',
		state.settings.runeSelection4,
		RUNE_SELECTION_OPTIONS,
	);

	state.behaviour.runRestoreOption = getCachedEnumValue(
		'behaviour.runRestoreOption',
		state.behaviour.runRestoreOption,
		RUN_RESTORE_OPTIONS,
	);

	state.behaviour.useColossalPouch = getCachedBoolean(
		'behaviour.useColossalPouch',
		state.behaviour.useColossalPouch,
	);

	state.behaviour.useSmallPouch = getCachedBoolean(
		'behaviour.useSmallPouch',
		state.behaviour.useSmallPouch,
	);

	state.behaviour.useMediumPouch = getCachedBoolean(
		'behaviour.useMediumPouch',
		state.behaviour.useMediumPouch,
	);

	state.behaviour.useLargePouch = getCachedBoolean(
		'behaviour.useLargePouch',
		state.behaviour.useLargePouch,
	);

	state.behaviour.useGiantPouch = getCachedBoolean(
		'behaviour.useGiantPouch',
		state.behaviour.useGiantPouch,
	);

	state.debugTab.forceStateOnStart = getCachedBoolean(
		'debug.forceStateOnStart',
		state.debugTab.forceStateOnStart,
	);

	state.debugTab.forcedMainState = getCachedEnumValue(
		'debug.forcedMainState',
		state.debugTab.forcedMainState,
		MAIN_STATE_OPTIONS,
	);
};

export const persistUiPreferencesFromState = (): void => {
	bot.bmCache.saveString(
		getPrefKey('settings.runesForBanking'),
		state.settings.runesForBanking,
	);

	bot.bmCache.saveString(
		getPrefKey('settings.pohAccessOption'),
		state.settings.pohAccessOption,
	);

	bot.bmCache.saveBoolean(
		getPrefKey('settings.runePouchEnabled'),
		state.settings.runePouchEnabled,
	);

	bot.bmCache.saveBoolean(
		getPrefKey('settings.divinePouchEnabled'),
		state.settings.divinePouchEnabled,
	);

	bot.bmCache.saveString(
		getPrefKey('settings.runeSelection1'),
		state.settings.runeSelection1,
	);

	bot.bmCache.saveString(
		getPrefKey('settings.runeSelection2'),
		state.settings.runeSelection2,
	);

	bot.bmCache.saveString(
		getPrefKey('settings.runeSelection3'),
		state.settings.runeSelection3,
	);

	bot.bmCache.saveString(
		getPrefKey('settings.runeSelection4'),
		state.settings.runeSelection4,
	);

	bot.bmCache.saveString(
		getPrefKey('behaviour.runRestoreOption'),
		state.behaviour.runRestoreOption,
	);

	bot.bmCache.saveBoolean(
		getPrefKey('behaviour.useColossalPouch'),
		state.behaviour.useColossalPouch,
	);

	bot.bmCache.saveBoolean(
		getPrefKey('behaviour.useSmallPouch'),
		state.behaviour.useSmallPouch,
	);

	bot.bmCache.saveBoolean(
		getPrefKey('behaviour.useMediumPouch'),
		state.behaviour.useMediumPouch,
	);

	bot.bmCache.saveBoolean(
		getPrefKey('behaviour.useLargePouch'),
		state.behaviour.useLargePouch,
	);

	bot.bmCache.saveBoolean(
		getPrefKey('behaviour.useGiantPouch'),
		state.behaviour.useGiantPouch,
	);

	bot.bmCache.saveBoolean(
		getPrefKey('debug.forceStateOnStart'),
		state.debugTab.forceStateOnStart,
	);

	bot.bmCache.saveString(
		getPrefKey('debug.forcedMainState'),
		state.debugTab.forcedMainState,
	);
};
