import { MainStates, state } from '../script-state.js';
import { logError, logTravelToPrayerAltar } from '../logging.js';
import { INTERACTIONS, OBJECT_IDS, OBJECT_NAMES } from '../constants.js';

export const TravelToPrayerAltar = (): void => {
	logTravelToPrayerAltar('Traveling to the prayer altar.');
	const prayerAltar = bot.objects.getTileObjectsWithIds([
		OBJECT_IDS.prayerAltar,
	])[0];

	if (!prayerAltar) {
		logError(
			`Prayer altar not found: ${OBJECT_NAMES.prayerAltar} (id=${OBJECT_IDS.prayerAltar}).`,
		);
		return;
	}

	logTravelToPrayerAltar('Clicking prayer altar.');
	bot.objects.interactSuppliedObject(prayerAltar, INTERACTIONS.prayAtAltar);

	if (state.behaviour.runRestoreOption === 'Vile Vigour') {
		logTravelToPrayerAltar(
			'Transitioning to SWAP_MAGE_BOOK while moving to altar for Vile Vigour.',
		);
		state.mainState = MainStates.SWAP_MAGE_BOOK;
		return;
	}

	logTravelToPrayerAltar(
		'Prayer altar clicked. Transitioning to USE_PRAYER_ALTAR.',
	);
	state.mainState = MainStates.USE_PRAYER_ALTAR;
};
