import { MainStates, state } from '../script-state.js';
import { logError, logSwapMageBook } from '../logging.js';

const ARCEUUS_SPELLBOOK_INDEX = 3;

export const SwapMageBook = (): void => {
	logSwapMageBook('Swapping to mage book.');

	if (state.behaviour.runRestoreOption !== 'Vile Vigour') {
		logSwapMageBook(
			`Blocked SWAP_MAGE_BOOK because run restore mode is ${state.behaviour.runRestoreOption}. Routing to bank.`,
		);
		state.workflowStep = 0;
		state.mainState = MainStates.TRAVEL_TO_BANK;
		return;
	}

	try {
		logSwapMageBook(
			'Casting Spellbook Swap and selecting Arceuus spellbook.',
		);
		bot.magic.cast('SPELLBOOK_SWAP', ARCEUUS_SPELLBOOK_INDEX);
	} catch (error) {
		logError(`Arceuus spellbook swap failed: ${String(error)}`);
		return;
	}

	try {
		logSwapMageBook('Casting Vile Vigour.');
		bot.magic.cast('VILE_VIGOUR', 0);
	} catch (error) {
		logError(`Vile Vigour cast failed: ${String(error)}`);
		return;
	}

	state.workflowStep = 0;
	state.mainState = MainStates.USE_PRAYER_ALTAR;
	return;
};
