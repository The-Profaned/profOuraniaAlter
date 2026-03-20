import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';

export const TravelToOuraniaAltar = (): void => {
	logState('Traveling to the Ourania altar.');

	// TODO: Add pathing/navigation logic.
	state.mainState = MainStates.INTERACT_WITH_OURANIA_ALTAR;
};
