import { MainStates, state } from '../script-state.js';
import { logTravelToOuraniaAltar } from '../logging.js';

export const TravelToOuraniaAltar = (): void => {
	logTravelToOuraniaAltar('Traveling to the Ourania altar.');

	// TODO: Add pathing/navigation logic.
	state.mainState = MainStates.INTERACT_WITH_OURANIA_ALTAR;
};
