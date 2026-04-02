import { MainStates, state } from '../script-state.js';
import { logError, logSwapMageBook } from '../logging.js';

const WORKFLOW_STEP_PENDING_POH_MAGIC_SWAP = 90;

const NORMAL_SPELLBOOK_INDEX = 1;
const ARCEUUS_SPELLBOOK_INDEX = 3;

export const SwapMageBook = (): void => {
	logSwapMageBook('Swapping to mage book.');

	if (state.behaviour.runRestoreOption === 'Vile Vigour') {
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
	}

	if (
		state.behaviour.runRestoreOption === 'PoH' &&
		state.workflowStep === WORKFLOW_STEP_PENDING_POH_MAGIC_SWAP
	) {
		try {
			logSwapMageBook(
				'Casting Spellbook Swap and selecting normal spellbook.',
			);
			bot.magic.cast('SPELLBOOK_SWAP', NORMAL_SPELLBOOK_INDEX);
		} catch (error) {
			logError(`Normal spellbook swap failed: ${String(error)}`);
			return;
		}

		try {
			logSwapMageBook('Casting Teleport to House.');
			bot.magic.cast('TELEPORT_TO_HOUSE', 0);
		} catch (error) {
			logError(`Teleport to House cast failed: ${String(error)}`);
			return;
		}

		state.workflowStep = 1;
		state.mainState = MainStates.TRAVEL_TO_POH;
		return;
	}
};
