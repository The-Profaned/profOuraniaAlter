import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';

export const TravelToBank = (): void => {
	logState('Traveling to bank.');

	// TODO: Add movement logic from altar area to bank area.
	state.mainState = MainStates.INTERACT_WITH_BANK;
};
