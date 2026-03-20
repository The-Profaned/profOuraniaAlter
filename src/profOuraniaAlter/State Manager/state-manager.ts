import { logState } from './logging.js';
import { state, MainStates } from './script-state.js';
import { Initializing } from './State/initializing.js';
import { TravelToOuraniaAltar } from './State/travel-to-ourania-altar.js';
import { TravelToPrayerAltar } from './State/travel-to-prayer-altar.js';
import { SwapMageBook } from './State/swap-mage-book.js';
import { UsePrayerAltar } from './State/use-prayer-altar.js';
import { TravelDownLadder } from './State/travel-down-ladder.js';
import { InteractWithBank } from './State/interact-with-bank.js';

export * from './script-state.js';

export const stateManager = (): void => {
	if (state.lastLoggedMainState !== state.mainState) {
		logState(`State changed to: ${state.mainState}`);
		state.lastLoggedMainState = state.mainState;
	}

	switch (state.mainState) {
		case MainStates.INITIALIZING: {
			Initializing();
			break;
		}
		case MainStates.TRAVEL_TO_OURANIA_ALTAR: {
			TravelToOuraniaAltar();
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
		case MainStates.TRAVEL_DOWN_LADDER: {
			TravelDownLadder();
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
