import { MainStates, state } from '../script-state.js';
import { logError, logInteractWithBank } from '../logging.js';
import { INTERACTIONS, NPC_IDS, NPC_NAMES } from '../constants.js';

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

	// TODO: Add banking and inventory management logic.
	state.mainState = MainStates.IDLE;
};
