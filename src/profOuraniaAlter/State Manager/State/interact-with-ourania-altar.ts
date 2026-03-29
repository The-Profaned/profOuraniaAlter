import { logError, logInteractWithOuraniaAltar } from '../logging.js';
import { INTERACTIONS, OBJECT_IDS, OBJECT_NAMES } from '../constants.js';

export const InteractWithOuraniaAltar = (): void => {
	logInteractWithOuraniaAltar('Interacting with Ourania altar.');
	const ouraniaAltar = bot.objects.getTileObjectsWithIds([
		OBJECT_IDS.ouraniaAltar,
	])[0];

	if (!ouraniaAltar) {
		logError(
			`Ourania altar not found: ${OBJECT_NAMES.ouraniaAltar} (id=${OBJECT_IDS.ouraniaAltar}).`,
		);
		return;
	}

	logInteractWithOuraniaAltar(
		`Ourania altar target ready: ${OBJECT_NAMES.ouraniaAltar} (id=${OBJECT_IDS.ouraniaAltar}) with action ${INTERACTIONS.useAltar}.`,
	);
};
