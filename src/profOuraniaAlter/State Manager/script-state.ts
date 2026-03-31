import type { State } from '../../imports/types.js';
import { SCRIPT_NAME, DEFAULT_STATE } from './constants.js';

export type RuneOption =
	| 'Air'
	| 'Water'
	| 'Earth'
	| 'Fire'
	| 'Mind'
	| 'Dust'
	| 'Cosmic'
	| 'Astral'
	| 'Law'
	| 'Soul';

export type RuneSelectionOption = RuneOption | 'na';

export type RunRestoreOption =
	| 'No Restore'
	| 'Stamina Potions'
	| 'PoH'
	| 'Vile Vigour'
	| 'Desert Amulet';

export type PohAccessOption = 'Tablet' | 'Construction Cape' | 'Max Cape';

export type StandardPouchKey = 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';

export type PouchKey = StandardPouchKey | 'COLOSSAL';

export type AltarPlanMode = 'NONE' | 'COLOSSAL_ONLY' | 'STANDARD';

export type AltarQueuedActionType = 'EMPTY_POUCH' | 'CRAFT_ALTAR';

export type AltarQueuedAction = {
	executeTick: number;
	actionType: AltarQueuedActionType;
	pouchKey: PouchKey | null;
};

export enum MainStates {
	TRAVEL_TO_OURANIA_ALTAR = 'TRAVEL_TO_OURANIA_ALTAR',
	INTERACT_WITH_OURANIA_ALTAR = 'INTERACT_WITH_OURANIA_ALTAR',
	TRAVEL_TO_PRAYER_ALTAR = 'TRAVEL_TO_PRAYER_ALTAR',
	TRAVEL_TO_POH = 'TRAVEL_TO_POH',
	TRAVEL_TO_DESERT = 'TRAVEL_TO_DESERT',
	SWAP_MAGE_BOOK = 'SWAP_MAGE_BOOK',
	USE_PRAYER_ALTAR = 'USE_PRAYER_ALTAR',
	TRAVEL_TO_BANK = 'TRAVEL_TO_BANK',
	INTERACT_WITH_BANK = 'INTERACT_WITH_BANK',
	REPAIR_POUCHES = 'REPAIR_POUCHES',
	IDLE = 'IDLE',
}

export type OuraniaAlterScriptState = State & {
	mainState: MainStates;
	lastLoggedMainState: MainStates | null;
	workflowStep: number;
	debugTab: {
		forcedMainState: MainStates;
		forceStateOnStart: boolean;
	};
	settings: {
		runesForBanking: RuneOption;
		pohAccessOption: PohAccessOption;
		runePouchEnabled: boolean;
		divinePouchEnabled: boolean;
		runeSelection1: RuneSelectionOption;
		runeSelection2: RuneSelectionOption;
		runeSelection3: RuneSelectionOption;
		runeSelection4: RuneSelectionOption;
	};
	behaviour: {
		runRestoreOption: RunRestoreOption;
		useColossalPouch: boolean;
		useSmallPouch: boolean;
		useMediumPouch: boolean;
		useLargePouch: boolean;
		useGiantPouch: boolean;
	};
	pouchState: {
		/** True when at least one enabled, degradable pouch is degraded and needs repair. */
		needsRepair: boolean;
		/** The state to return to after REPAIR_POUCHES completes. */
		returnState: MainStates;
	};
	altarState: {
		configSignature: string;
		mode: AltarPlanMode;
		remainingStandardPouches: StandardPouchKey[];
		currentBatch: StandardPouchKey[];
		currentPouchIndex: number;
		queuedActions: AltarQueuedAction[];
		awaitingCraftVerification: boolean;
		lastRunecraftXp: number;
		lastQueuedCraftTick: number;
		craftVerificationRetries: number;
	};
};

export const state: OuraniaAlterScriptState = {
	debugEnabled: true,
	debugFullState: false,
	failureCounts: {},
	failureOrigin: '',
	lastFailureKey: '',
	mainState: MainStates.TRAVEL_TO_OURANIA_ALTAR,
	scriptInitalized: false,
	scriptName: SCRIPT_NAME,
	uiCompleted: false,
	timeout: 0,
	gameTick: 0,
	subState: DEFAULT_STATE,
	lastLoggedMainState: null,
	workflowStep: 0,
	debugTab: {
		forcedMainState: MainStates.TRAVEL_TO_OURANIA_ALTAR,
		forceStateOnStart: true,
	},
	settings: {
		runesForBanking: 'Air',
		pohAccessOption: 'Tablet',
		runePouchEnabled: false,
		divinePouchEnabled: false,
		runeSelection1: 'na',
		runeSelection2: 'na',
		runeSelection3: 'na',
		runeSelection4: 'na',
	},
	behaviour: {
		runRestoreOption: 'No Restore',
		useColossalPouch: true,
		useSmallPouch: false,
		useMediumPouch: false,
		useLargePouch: false,
		useGiantPouch: false,
	},
	pouchState: {
		needsRepair: false,
		returnState: MainStates.INTERACT_WITH_BANK,
	},
	altarState: {
		configSignature: '',
		mode: 'NONE',
		remainingStandardPouches: [],
		currentBatch: [],
		currentPouchIndex: 0,
		queuedActions: [],
		awaitingCraftVerification: false,
		lastRunecraftXp: 0,
		lastQueuedCraftTick: -1,
		craftVerificationRetries: 0,
	},
};
