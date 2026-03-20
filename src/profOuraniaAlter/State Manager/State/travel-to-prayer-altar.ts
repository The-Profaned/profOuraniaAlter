import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';

export const TravelToPrayerAltar = (): void => {
	logState('Traveling to the prayer altar.');

	// TODO: Add pathing/navigation logic.
	state.mainState = MainStates.SWAP_MAGE_BOOK;
};
