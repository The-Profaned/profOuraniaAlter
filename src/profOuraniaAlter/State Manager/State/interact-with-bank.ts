import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';

export const InteractWithBank = (): void => {
	logState('Interacting with bank.');

	// TODO: Add banking and inventory management logic.
	state.mainState = MainStates.IDLE;
};
