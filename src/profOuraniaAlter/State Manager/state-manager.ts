import { logState } from './logging.js';
import { state, MainStates } from './script-state.js';
import { TravelToOuraniaAltar } from './State/travel-to-ourania-altar.js';
import { InteractWithOuraniaAltar } from './State/interact-with-ourania-altar.js';
import { TravelToPrayerAltar } from './State/travel-to-prayer-altar.js';
import { SwapMageBook } from './State/swap-mage-book.js';
import { UsePrayerAltar } from './State/use-prayer-altar.js';
import { TravelToBank } from './State/travel-to-bank.js';
import { InteractWithBank } from './State/interact-with-bank.js';

export * from './script-state.js';

export const stateManager = (): void => {
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
		case MainStates.IDLE: {
			return;
		}
	}
};
