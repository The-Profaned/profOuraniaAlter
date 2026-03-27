import { MainStates, state } from '../script-state.js';
import { logTravelToDesert } from '../logging.js';

export const TravelToDesert = (): void => {
	logTravelToDesert('Traveling to desert restore route.');

	// TODO: Add travel logic for desert amulet restoration.
	state.mainState = MainStates.USE_PRAYER_ALTAR;
};
