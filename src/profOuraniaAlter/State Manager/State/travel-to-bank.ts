import { MainStates, state } from '../script-state.js';
import { logTravelToBank } from '../logging.js';

export const TravelToBank = (): void => {
	logTravelToBank('Traveling to bank.');

	// TODO: Add movement logic from altar area to bank area.
	state.mainState = MainStates.INTERACT_WITH_BANK;
};
