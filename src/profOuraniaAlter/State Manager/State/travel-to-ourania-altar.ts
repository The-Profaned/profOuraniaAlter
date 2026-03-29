import { MainStates, state } from '../script-state.js';
import { logTravelToOuraniaAltar } from '../logging.js';
import { walkToOuraniaAltarWithBfs } from '../pathing/ourania-altar-bfs-routing.js';

export const TravelToOuraniaAltar = (): void => {
	logTravelToOuraniaAltar('Traveling to the Ourania altar.');

	const reachedOuraniaAltarArea = walkToOuraniaAltarWithBfs();
	if (!reachedOuraniaAltarArea) return;

	state.mainState = MainStates.INTERACT_WITH_OURANIA_ALTAR;
};
