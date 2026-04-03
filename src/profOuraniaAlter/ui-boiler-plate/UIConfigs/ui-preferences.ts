import {
	MainStates,
	state,
	type PohAccessOption,
	type RuneOption,
	type RuneSelectionOption,
	type RunRestoreOption,
} from '../../State Manager/script-state.js';

type BmCache = {
	getString: (key: string, fallback: string) => string;
	getBoolean: (key: string, fallback: boolean) => boolean;
	saveString: (key: string, value: string) => void;
	saveBoolean: (key: string, value: boolean) => void;
};

const PREFERENCE_KEY_PREFIX = 'profOuraniaAlter.ui.';

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

const RUNE_SELECTION_OPTIONS: RuneSelectionOption[] = [...RUNE_OPTIONS, 'na'];

const POH_ACCESS_OPTIONS: PohAccessOption[] = [
	'Tablet',
	'Construction Cape',
	'Spellbook Swap',
];

const RUN_RESTORE_OPTIONS: RunRestoreOption[] = [
	'No Restore',
	'Stamina Potions',
	'PoH',
	'Vile Vigour',
	'Desert Amulet',
];

const MAIN_STATE_OPTIONS: MainStates[] = Object.values(MainStates);

const getCache = (): BmCache => bot.bmCache as BmCache;

const getKey = (suffix: string): string => `${PREFERENCE_KEY_PREFIX}${suffix}`;

const readCachedString = (keySuffix: string, fallback: string): string =>
	String(getCache().getString(getKey(keySuffix), fallback));

const saveCachedString = (keySuffix: string, value: string): void => {
	getCache().saveString(getKey(keySuffix), String(value));
};

const readEnumValue = <T extends string>(
	keySuffix: string,
	defaultValue: T,
	allowedValues: readonly T[],
): T => {
	const cachedValue = readCachedString(keySuffix, defaultValue);
	return allowedValues.includes(cachedValue as T)
		? (cachedValue as T)
		: defaultValue;
};

export const loadUiPreferencesIntoState = (): void => {
	state.behaviour.runRestoreOption = readEnumValue(
		'behaviour.runRestoreOption',
		state.behaviour.runRestoreOption,
		RUN_RESTORE_OPTIONS,
	);

	state.behaviour.useColossalPouch = getCache().getBoolean(
		getKey('behaviour.useColossalPouch'),
		state.behaviour.useColossalPouch,
	);
	state.behaviour.useSmallPouch = getCache().getBoolean(
		getKey('behaviour.useSmallPouch'),
		state.behaviour.useSmallPouch,
	);
	state.behaviour.useMediumPouch = getCache().getBoolean(
		getKey('behaviour.useMediumPouch'),
		state.behaviour.useMediumPouch,
	);
	state.behaviour.useLargePouch = getCache().getBoolean(
		getKey('behaviour.useLargePouch'),
		state.behaviour.useLargePouch,
	);
	state.behaviour.useGiantPouch = getCache().getBoolean(
		getKey('behaviour.useGiantPouch'),
		state.behaviour.useGiantPouch,
	);

	state.settings.runesForBanking = readEnumValue(
		'settings.runesForBanking',
		state.settings.runesForBanking,
		RUNE_OPTIONS,
	);
	state.settings.pohAccessOption = readEnumValue(
		'settings.pohAccessOption',
		state.settings.pohAccessOption,
		POH_ACCESS_OPTIONS,
	);
	state.settings.runePouchEnabled = getCache().getBoolean(
		getKey('settings.runePouchEnabled'),
		state.settings.runePouchEnabled,
	);
	state.settings.divinePouchEnabled = getCache().getBoolean(
		getKey('settings.divinePouchEnabled'),
		state.settings.divinePouchEnabled,
	);
	state.settings.runeSelection1 = readEnumValue(
		'settings.runeSelection1',
		state.settings.runeSelection1,
		RUNE_SELECTION_OPTIONS,
	);
	state.settings.runeSelection2 = readEnumValue(
		'settings.runeSelection2',
		state.settings.runeSelection2,
		RUNE_SELECTION_OPTIONS,
	);
	state.settings.runeSelection3 = readEnumValue(
		'settings.runeSelection3',
		state.settings.runeSelection3,
		RUNE_SELECTION_OPTIONS,
	);
	state.settings.runeSelection4 = readEnumValue(
		'settings.runeSelection4',
		state.settings.runeSelection4,
		RUNE_SELECTION_OPTIONS,
	);

	state.debugTab.forceStateOnStart = getCache().getBoolean(
		getKey('debug.forceStateOnStart'),
		state.debugTab.forceStateOnStart,
	);
	state.debugTab.forcedMainState = readEnumValue(
		'debug.forcedMainState',
		state.debugTab.forcedMainState,
		MAIN_STATE_OPTIONS,
	);
};

export const persistUiPreferencesFromState = (): void => {
	saveCachedString(
		'behaviour.runRestoreOption',
		state.behaviour.runRestoreOption,
	);
	getCache().saveBoolean(
		getKey('behaviour.useColossalPouch'),
		state.behaviour.useColossalPouch,
	);
	getCache().saveBoolean(
		getKey('behaviour.useSmallPouch'),
		state.behaviour.useSmallPouch,
	);
	getCache().saveBoolean(
		getKey('behaviour.useMediumPouch'),
		state.behaviour.useMediumPouch,
	);
	getCache().saveBoolean(
		getKey('behaviour.useLargePouch'),
		state.behaviour.useLargePouch,
	);
	getCache().saveBoolean(
		getKey('behaviour.useGiantPouch'),
		state.behaviour.useGiantPouch,
	);

	saveCachedString(
		'settings.runesForBanking',
		state.settings.runesForBanking,
	);
	saveCachedString(
		'settings.pohAccessOption',
		state.settings.pohAccessOption,
	);
	getCache().saveBoolean(
		getKey('settings.runePouchEnabled'),
		state.settings.runePouchEnabled,
	);
	getCache().saveBoolean(
		getKey('settings.divinePouchEnabled'),
		state.settings.divinePouchEnabled,
	);
	saveCachedString('settings.runeSelection1', state.settings.runeSelection1);
	saveCachedString('settings.runeSelection2', state.settings.runeSelection2);
	saveCachedString('settings.runeSelection3', state.settings.runeSelection3);
	saveCachedString('settings.runeSelection4', state.settings.runeSelection4);

	getCache().saveBoolean(
		getKey('debug.forceStateOnStart'),
		state.debugTab.forceStateOnStart,
	);
	saveCachedString('debug.forcedMainState', state.debugTab.forcedMainState);
};
