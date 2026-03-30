import { MainStates, state } from '../script-state.js';
import { logError, logInteractWithBank } from '../logging.js';
import {
	INTERACTIONS,
	NPC_IDS,
	NPC_NAMES,
	BANK_SUBSTATE_REFILL_RUNES,
	BANKING_RUNE_MINIMUM_THRESHOLD,
} from '../constants.js';
import { getTotalRuneAmountAvailable } from '../rune-pouch-varbits.js';

export const InteractWithBank = (): void => {
	logInteractWithBank('Interacting with bank.');
	const banker = bot.npcs.getWithIds([NPC_IDS.banker])[0];

	if (!banker) {
		logError(
			`Bank NPC not found: ${NPC_NAMES.banker} (id=${NPC_IDS.banker}).`,
		);
		return;
	}

	logInteractWithBank(
		`Bank target ready: ${NPC_NAMES.banker} (id=${NPC_IDS.banker}) with action ${INTERACTIONS.bank}.`,
	);

	const bankingRuneSelection = state.settings.runesForBanking;
	const bankingRuneAmountAvailable =
		getTotalRuneAmountAvailable(bankingRuneSelection);
	if (bankingRuneAmountAvailable <= BANKING_RUNE_MINIMUM_THRESHOLD) {
		state.subState = BANK_SUBSTATE_REFILL_RUNES;
		logInteractWithBank(
			`Banking rune low for ${bankingRuneSelection}: total available ${bankingRuneAmountAvailable}. Transitioned substate to ${BANK_SUBSTATE_REFILL_RUNES}.`,
		);
		return;
	}

	// TODO: Add banking and inventory management logic.
	state.mainState = MainStates.IDLE;
};
