import { MainStates, state } from '../script-state.js';
import { walkToOuraniaAltarWithBfs } from '../pathing/ourania-altar-bfs-routing.js';

export const TravelToOuraniaAltar = (): void => {
	const reachedOuraniaAltarArea = walkToOuraniaAltarWithBfs();
	if (!reachedOuraniaAltarArea) return;

	state.mainState = MainStates.INTERACT_WITH_OURANIA_ALTAR;
};
