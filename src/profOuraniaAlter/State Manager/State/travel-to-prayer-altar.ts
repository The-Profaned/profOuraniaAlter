import { MainStates, state } from '../script-state.js';
import { logError, logTravelToPrayerAltar } from '../logging.js';
import { INTERACTIONS, OBJECT_IDS, OBJECT_NAMES } from '../constants.js';

const WORKFLOW_STEP_POST_VILE_VIGOUR = 10;

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

	if (state.behaviour.runRestoreOption === 'Vile Vigour') {
		if (state.workflowStep === WORKFLOW_STEP_POST_VILE_VIGOUR) {
			logTravelToPrayerAltar(
				'Post-Vile Vigour: re-praying at altar to restore prayer before banking.',
			);
			bot.objects.interactSuppliedObject(
				prayerAltar,
				INTERACTIONS.prayAtAltar,
			);
			state.workflowStep = 0;
			state.mainState = MainStates.TRAVEL_TO_BANK;
			return;
		}

		logTravelToPrayerAltar(
			'Initial prayer altar interaction complete. Transitioning to SWAP_MAGE_BOOK for Vile Vigour cast.',
		);
		bot.objects.interactSuppliedObject(
			prayerAltar,
			INTERACTIONS.prayAtAltar,
		);
		state.mainState = MainStates.SWAP_MAGE_BOOK;
		return;
	}

	logTravelToPrayerAltar('Praying at altar, then continuing to bank.');
	bot.objects.interactSuppliedObject(prayerAltar, INTERACTIONS.prayAtAltar);
	state.mainState = MainStates.TRAVEL_TO_BANK;
};
