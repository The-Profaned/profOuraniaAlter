import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';

export const SwapMageBook = (): void => {
	logState('Swapping to mage book.');

	// TODO: add mage book swap leading up to prayer alter interaction logic.
	state.mainState = MainStates.USE_PRAYER_ALTAR;
};
