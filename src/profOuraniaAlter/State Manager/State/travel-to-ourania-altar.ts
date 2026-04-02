import { MainStates, state } from '../script-state.js';
import { logTravelToOuraniaAltar } from '../logging.js';
import { walkToOuraniaAltarWithBfs } from '../pathing/ourania-altar-bfs-routing.js';

const STAMINA_POTION_IDS_LOW_TO_HIGH: number[] = [
	net.runelite.api.ItemID.STAMINA_POTION1,
	net.runelite.api.ItemID.STAMINA_POTION2,
	net.runelite.api.ItemID.STAMINA_POTION3,
	net.runelite.api.ItemID.STAMINA_POTION4,
];

let hasConsumedStaminaDuringTravel = false;

export const TravelToOuraniaAltar = (): void => {
	if (state.behaviour.runRestoreOption !== 'Stamina Potions') {
		hasConsumedStaminaDuringTravel = false;
	} else if (
		!hasConsumedStaminaDuringTravel &&
		!bot.bank.isOpen() &&
		bot.inventory.containsAnyIds(STAMINA_POTION_IDS_LOW_TO_HIGH)
	) {
		logTravelToOuraniaAltar(
			'Stamina potion found in inventory. Drinking one dose during travel.',
		);
		bot.inventory.interactWithIds(STAMINA_POTION_IDS_LOW_TO_HIGH, [
			'Drink',
		]);
		hasConsumedStaminaDuringTravel = true;
		return;
	}

	const reachedOuraniaAltarArea = walkToOuraniaAltarWithBfs();
	if (!reachedOuraniaAltarArea) return;

	hasConsumedStaminaDuringTravel = false;
	state.mainState = MainStates.INTERACT_WITH_OURANIA_ALTAR;
};
