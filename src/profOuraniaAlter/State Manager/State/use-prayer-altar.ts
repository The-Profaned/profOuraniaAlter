import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';

export const UsePrayerAltar = (): void => {
	logState('Using prayer altar.');

	// TODO: Add prayer altar interaction logic.
	state.mainState = MainStates.TRAVEL_DOWN_LADDER;
};
