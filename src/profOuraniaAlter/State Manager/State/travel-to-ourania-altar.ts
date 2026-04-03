import { MainStates, state } from '../script-state.js';
import { logTravelToOuraniaAltar } from '../logging.js';
import { walkToOuraniaAltarWithBfs } from '../pathing/ourania-altar-bfs-routing.js';

const STAMINA_POTION_IDS_LOW_TO_HIGH: number[] = [
	net.runelite.api.ItemID.STAMINA_POTION1,
	net.runelite.api.ItemID.STAMINA_POTION2,
	net.runelite.api.ItemID.STAMINA_POTION3,
	net.runelite.api.ItemID.STAMINA_POTION4,
];

const FOOD_OPTION_TO_ITEM_ID = {
	Tuna: net.runelite.api.ItemID.TUNA,
	Lobster: net.runelite.api.ItemID.LOBSTER,
	Bass: net.runelite.api.ItemID.BASS,
	Swordfish: net.runelite.api.ItemID.SWORDFISH,
	Karambwan: net.runelite.api.ItemID.COOKED_KARAMBWAN,
	MantaRay: net.runelite.api.ItemID.MANTA_RAY,
	Shark: net.runelite.api.ItemID.SHARK,
	Monkfish: net.runelite.api.ItemID.MONKFISH,
	SeaTurtle: net.runelite.api.ItemID.SEA_TURTLE,
	Anglerfish: net.runelite.api.ItemID.ANGLERFISH,
} as const;

const getEmergencyFoodLookupKey = (): keyof typeof FOOD_OPTION_TO_ITEM_ID => {
	if (state.settings.emergencyFoodOption === 'Manta Ray') {
		return 'MantaRay';
	}

	if (state.settings.emergencyFoodOption === 'Sea turtle') {
		return 'SeaTurtle';
	}

	return state.settings.emergencyFoodOption;
};

let hasConsumedStaminaDuringTravel = false;
let hasConsumedEmergencyFoodDuringTravel = false;

const isEmergencyFoodHpThresholdMet = (): boolean => {
	const currentHp = client.getBoostedSkillLevel(
		net.runelite.api.Skill.HITPOINTS,
	);
	const maxHp = client.getRealSkillLevel(net.runelite.api.Skill.HITPOINTS);
	if (maxHp <= 0) return false;

	const isAtOrBelowFortyPercent = currentHp * 100 <= maxHp * 40;
	return isAtOrBelowFortyPercent || currentHp < 10;
};

const maybeConsumeEmergencyFoodDuringTravel = (): boolean => {
	if (!state.behaviour.emergencyFoodEnabled) {
		hasConsumedEmergencyFoodDuringTravel = false;
		return false;
	}

	if (hasConsumedEmergencyFoodDuringTravel || bot.bank.isOpen()) {
		return false;
	}

	if (!isEmergencyFoodHpThresholdMet()) {
		hasConsumedEmergencyFoodDuringTravel = true;
		return false;
	}

	const selectedFoodId = FOOD_OPTION_TO_ITEM_ID[getEmergencyFoodLookupKey()];
	if (!bot.inventory.containsId(selectedFoodId)) {
		hasConsumedEmergencyFoodDuringTravel = true;
		return false;
	}

	logTravelToOuraniaAltar(
		`Emergency food found in inventory. Eating one ${state.settings.emergencyFoodOption} while traveling to altar.`,
	);
	bot.inventory.interactWithIds([selectedFoodId], ['Eat']);
	hasConsumedEmergencyFoodDuringTravel = true;
	return true;
};

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

	if (maybeConsumeEmergencyFoodDuringTravel()) {
		return;
	}

	const reachedOuraniaAltarArea = walkToOuraniaAltarWithBfs();
	if (!reachedOuraniaAltarArea) return;

	hasConsumedStaminaDuringTravel = false;
	hasConsumedEmergencyFoodDuringTravel = false;
	state.mainState = MainStates.INTERACT_WITH_OURANIA_ALTAR;
};
