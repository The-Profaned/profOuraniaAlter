import { MainStates, state } from '../script-state.js';
import { logTravelToPoh } from '../logging.js';

export const TravelToPoh = (): void => {
	logTravelToPoh('Traveling to PoH.');

	// TODO: Add travel logic for house-based run restoration.
	state.mainState = MainStates.USE_PRAYER_ALTAR;
};
