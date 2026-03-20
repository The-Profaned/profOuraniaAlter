import { MainStates, state } from '../script-state.js';
import { logError, logTravelToPrayerAltar } from '../logging.js';
import { INTERACTIONS, OBJECT_IDS, OBJECT_NAMES } from '../constants.js';

export const TravelToPrayerAltar = (): void => {
	logTravelToPrayerAltar('Traveling to the prayer altar.');
	const ladder = bot.objects.getTileObjectsWithIds([OBJECT_IDS.ladder])[0];

	if (!ladder) {
		logError(
			`Ladder not found: ${OBJECT_NAMES.ladder} (id=${OBJECT_IDS.ladder}).`,
		);
		return;
	}

	logTravelToPrayerAltar(
		`Ladder target ready: ${OBJECT_NAMES.ladder} (id=${OBJECT_IDS.ladder}) with action ${INTERACTIONS.climb}.`,
	);

	// TODO: Add pathing/navigation logic.
	state.mainState = MainStates.SWAP_MAGE_BOOK;
};
