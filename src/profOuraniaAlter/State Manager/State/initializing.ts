import { logState } from '../logging.js';
import { MainStates, state } from '../script-state.js';

export const Initializing = (): void => {
	if (!state.isSetupComplete) {
		state.isSetupComplete = true;
		logState('Setup complete. Beginning Ourania workflow.');
	}

	state.mainState = MainStates.TRAVEL_TO_OURANIA_ALTAR;
};
