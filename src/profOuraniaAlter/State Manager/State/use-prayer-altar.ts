import { MainStates, state } from '../script-state.js';
import { logError, logUsePrayerAltar } from '../logging.js';
import { INTERACTIONS, OBJECT_IDS, OBJECT_NAMES } from '../constants.js';

export const UsePrayerAltar = (): void => {
	logUsePrayerAltar('Using prayer altar.');
	const prayerAltar = bot.objects.getTileObjectsWithIds([
		OBJECT_IDS.prayerAltar,
	])[0];

	if (!prayerAltar) {
		logError(
			`Prayer altar not found: ${OBJECT_NAMES.prayerAltar} (id=${OBJECT_IDS.prayerAltar}).`,
		);
		return;
	}

	logUsePrayerAltar(
		`Prayer altar target ready: ${OBJECT_NAMES.prayerAltar} (id=${OBJECT_IDS.prayerAltar}) with action ${INTERACTIONS.prayAtAltar}.`,
	);

	// TODO: Add prayer altar interaction logic.
	state.mainState = MainStates.TRAVEL_TO_BANK;
};
