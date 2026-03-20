import type { State } from '../../imports/types.js';
import { SCRIPT_NAME, DEFAULT_STATE } from './constants.js';

export enum MainStates {
	INITIALIZING = 'INITIALIZING',
	TRAVEL_TO_OURANIA_ALTAR = 'TRAVEL_TO_OURANIA_ALTAR',
	TRAVEL_TO_PRAYER_ALTAR = 'TRAVEL_TO_PRAYER_ALTAR',
	SWAP_MAGE_BOOK = 'SWAP_MAGE_BOOK',
	USE_PRAYER_ALTAR = 'USE_PRAYER_ALTAR',
	TRAVEL_DOWN_LADDER = 'TRAVEL_DOWN_LADDER',
	INTERACT_WITH_BANK = 'INTERACT_WITH_BANK',
	IDLE = 'IDLE',
}

export type OuraniaAlterScriptState = State & {
	mainState: MainStates;
	lastLoggedMainState: MainStates | null;
	workflowStep: number;
	isSetupComplete: boolean;
};

export const state: OuraniaAlterScriptState = {
	debugEnabled: true,
	debugFullState: false,
	failureCounts: {},
	failureOrigin: '',
	lastFailureKey: '',
	mainState: MainStates.INITIALIZING,
	scriptInitalized: false,
	scriptName: SCRIPT_NAME,
	uiCompleted: true,
	timeout: 0,
	gameTick: 0,
	subState: DEFAULT_STATE,
	lastLoggedMainState: null,
	workflowStep: 0,
	isSetupComplete: false,
};
