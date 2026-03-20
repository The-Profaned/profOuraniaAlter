import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';

export const TravelDownLadder = (): void => {
	logState('Traveling down ladder.');

	// TODO: Add ladder interaction and movement logic.
	state.mainState = MainStates.INTERACT_WITH_BANK;
};
