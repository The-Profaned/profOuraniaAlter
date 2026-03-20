import { MainStates, state } from '../script-state.js';
import {
	logError,
	logInteractWithOuraniaAltar,
	logTravelToBank,
	logTravelToPrayerAltar,
} from '../logging.js';
import {
	INTERACTIONS,
	OBJECT_IDS,
	OBJECT_NAMES,
	RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD,
} from '../constants.js';

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

	// TODO: Add primary Ourania altar interaction logic.
	const rawRunEnergy = Number(client.getEnergy());
	const runEnergyPercent =
		rawRunEnergy > 100 ? Math.floor(rawRunEnergy / 100) : rawRunEnergy;

	if (runEnergyPercent >= RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD) {
		logTravelToBank(
			`Run energy ${runEnergyPercent}% >= ${RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD}%. Traveling to bank.`,
		);
		state.mainState = MainStates.TRAVEL_TO_BANK;
		return;
	}

	logTravelToPrayerAltar(
		`Run energy ${runEnergyPercent}% < ${RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD}%. Traveling to prayer altar.`,
	);
	state.mainState = MainStates.TRAVEL_TO_PRAYER_ALTAR;
};
