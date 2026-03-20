import { MainStates, state } from '../script-state.js';
import { logState } from '../logging.js';
import { RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD } from '../constants.js';

export const InteractWithOuraniaAltar = (): void => {
	logState('Interacting with Ourania altar.');

	// TODO: Add primary Ourania altar interaction logic.
	const rawRunEnergy = Number(client.getEnergy());
	const runEnergyPercent =
		rawRunEnergy > 100 ? Math.floor(rawRunEnergy / 100) : rawRunEnergy;

	if (runEnergyPercent >= RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD) {
		logState(
			`Run energy ${runEnergyPercent}% >= ${RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD}%. Traveling to bank.`,
		);
		state.mainState = MainStates.TRAVEL_TO_BANK;
		return;
	}

	logState(
		`Run energy ${runEnergyPercent}% < ${RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD}%. Traveling to prayer altar.`,
	);
	state.mainState = MainStates.TRAVEL_TO_PRAYER_ALTAR;
};
