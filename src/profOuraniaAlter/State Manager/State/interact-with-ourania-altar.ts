import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';

export const InteractWithOuraniaAltar = (): void => {
	logState('Interacting with Ourania altar.');

	// TODO: Add primary Ourania altar interaction logic.
	state.mainState = MainStates.TRAVEL_TO_PRAYER_ALTAR;
};
