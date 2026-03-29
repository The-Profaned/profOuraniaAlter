import { logState } from './logging.js';
import { state, MainStates } from './script-state.js';
import { determineScriptStartLocationState } from './script-start.js';
import { LOAD_DEBUG_UI_TAB } from './constants.js';
import { TravelToOuraniaAltar } from './State/travel-to-ourania-altar.js';
import { InteractWithOuraniaAltar } from './State/interact-with-ourania-altar.js';
import { TravelToPrayerAltar } from './State/travel-to-prayer-altar.js';
import { TravelToPoh } from './State/travel-to-poh.js';
import { TravelToDesert } from './State/travel-to-desert.js';
import { SwapMageBook } from './State/swap-mage-book.js';
import { UsePrayerAltar } from './State/use-prayer-altar.js';
import { TravelToBank } from './State/travel-to-bank.js';
import { InteractWithBank } from './State/interact-with-bank.js';
import { RepairPouches } from './State/repair-pouches.js';

const runScriptStartSync: () => void = determineScriptStartLocationState;

export const stateManager = (): void => {
	if (!LOAD_DEBUG_UI_TAB) {
		runScriptStartSync();
	}

	if (state.lastLoggedMainState !== state.mainState) {
		logState(`State changed to: ${state.mainState}`);
		state.lastLoggedMainState = state.mainState;
	}

	switch (state.mainState) {
		case MainStates.TRAVEL_TO_OURANIA_ALTAR: {
			TravelToOuraniaAltar();
			break;
		}
		case MainStates.INTERACT_WITH_OURANIA_ALTAR: {
			InteractWithOuraniaAltar();
			break;
		}
		case MainStates.TRAVEL_TO_PRAYER_ALTAR: {
			TravelToPrayerAltar();
			break;
		}
		case MainStates.TRAVEL_TO_POH: {
			TravelToPoh();
			break;
		}
		case MainStates.TRAVEL_TO_DESERT: {
			TravelToDesert();
			break;
		}
		case MainStates.SWAP_MAGE_BOOK: {
			SwapMageBook();
			break;
		}
		case MainStates.USE_PRAYER_ALTAR: {
			UsePrayerAltar();
			break;
		}
		case MainStates.TRAVEL_TO_BANK: {
			TravelToBank();
			break;
		}
		case MainStates.INTERACT_WITH_BANK: {
			InteractWithBank();
			break;
		}
		case MainStates.REPAIR_POUCHES: {
			RepairPouches();
			break;
		}
		case MainStates.IDLE: {
			return;
		}
	}
};
