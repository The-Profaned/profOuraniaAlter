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

type PendingTravelConsumeAction =
	| {
			kind: 'stamina';
			beforeDoseSnapshot: StaminaDoseSnapshot;
			issuedTick: number;
	  }
	| {
			kind: 'food';
			foodId: number;
			beforeValue: number;
			issuedTick: number;
	  };

let pendingTravelConsumeAction: PendingTravelConsumeAction | null = null;

type StaminaDoseSnapshot = {
	oneDoseCount: number;
	twoDoseCount: number;
	threeDoseCount: number;
	fourDoseCount: number;
	totalDoseUnits: number;
};

const STAMINA_CONFIRMATION_WAIT_TICKS = 2;

const getStaminaDoseSnapshot = (): StaminaDoseSnapshot => {
	const oneDoseCount = bot.inventory.getQuantityOfId(
		net.runelite.api.ItemID.STAMINA_POTION1,
	);
	const twoDoseCount = bot.inventory.getQuantityOfId(
		net.runelite.api.ItemID.STAMINA_POTION2,
	);
	const threeDoseCount = bot.inventory.getQuantityOfId(
		net.runelite.api.ItemID.STAMINA_POTION3,
	);
	const fourDoseCount = bot.inventory.getQuantityOfId(
		net.runelite.api.ItemID.STAMINA_POTION4,
	);

	return {
		oneDoseCount,
		twoDoseCount,
		threeDoseCount,
		fourDoseCount,
		totalDoseUnits:
			oneDoseCount +
			twoDoseCount * 2 +
			threeDoseCount * 3 +
			fourDoseCount * 4,
	};
};

const hasStaminaDoseProgressed = (
	before: StaminaDoseSnapshot,
	after: StaminaDoseSnapshot,
): boolean => {
	if (after.totalDoseUnits < before.totalDoseUnits) {
		return true;
	}

	if (after.fourDoseCount < before.fourDoseCount) {
		return true;
	}

	if (after.threeDoseCount < before.threeDoseCount) {
		return true;
	}

	if (after.twoDoseCount < before.twoDoseCount) {
		return true;
	}

	if (after.oneDoseCount < before.oneDoseCount) {
		return true;
	}

	return false;
};

const clearPendingTravelConsumeAction = (): void => {
	pendingTravelConsumeAction = null;
};

const queueStaminaConsumeAction = (): void => {
	logTravelToOuraniaAltar(
		'Stamina potion found in inventory. Drinking one dose during travel.',
	);
	const beforeDoseSnapshot = getStaminaDoseSnapshot();
	bot.inventory.interactWithIds(STAMINA_POTION_IDS_LOW_TO_HIGH, ['Drink']);
	pendingTravelConsumeAction = {
		kind: 'stamina',
		beforeDoseSnapshot,
		issuedTick: state.gameTick,
	};
};

const queueEmergencyFoodConsumeAction = (foodId: number): void => {
	logTravelToOuraniaAltar(
		`Emergency food found in inventory. Eating one ${state.settings.emergencyFoodOption} while traveling to altar.`,
	);
	const beforeQuantity = bot.inventory.getQuantityOfId(foodId);
	bot.inventory.interactWithIds([foodId], ['Eat']);
	pendingTravelConsumeAction = {
		kind: 'food',
		foodId,
		beforeValue: beforeQuantity,
		issuedTick: state.gameTick,
	};
};

const verifyOrRetryPendingTravelConsumeAction = (): boolean => {
	if (!pendingTravelConsumeAction) {
		return false;
	}

	if (
		pendingTravelConsumeAction.kind === 'stamina' &&
		state.gameTick - pendingTravelConsumeAction.issuedTick <
			STAMINA_CONFIRMATION_WAIT_TICKS
	) {
		return true;
	}

	if (
		pendingTravelConsumeAction.kind === 'food' &&
		state.gameTick - pendingTravelConsumeAction.issuedTick < 1
	) {
		return true;
	}

	if (pendingTravelConsumeAction.kind === 'stamina') {
		const currentSnapshot = getStaminaDoseSnapshot();
		if (
			hasStaminaDoseProgressed(
				pendingTravelConsumeAction.beforeDoseSnapshot,
				currentSnapshot,
			)
		) {
			hasConsumedStaminaDuringTravel = true;
			clearPendingTravelConsumeAction();
			return false;
		}

		logTravelToOuraniaAltar(
			'Stamina drink not yet confirmed. Retrying one drink action.',
		);
		const beforeDoseSnapshot = getStaminaDoseSnapshot();
		bot.inventory.interactWithIds(STAMINA_POTION_IDS_LOW_TO_HIGH, [
			'Drink',
		]);
		pendingTravelConsumeAction = {
			kind: 'stamina',
			beforeDoseSnapshot,
			issuedTick: state.gameTick,
		};
		return true;
	}

	const currentFoodQty = bot.inventory.getQuantityOfId(
		pendingTravelConsumeAction.foodId,
	);
	if (currentFoodQty < pendingTravelConsumeAction.beforeValue) {
		hasConsumedEmergencyFoodDuringTravel = true;
		clearPendingTravelConsumeAction();
		return false;
	}

	logTravelToOuraniaAltar(
		`Emergency food eat not yet confirmed. Retrying one ${state.settings.emergencyFoodOption}.`,
	);
	const beforeQuantity = bot.inventory.getQuantityOfId(
		pendingTravelConsumeAction.foodId,
	);
	bot.inventory.interactWithIds([pendingTravelConsumeAction.foodId], ['Eat']);
	pendingTravelConsumeAction = {
		kind: 'food',
		foodId: pendingTravelConsumeAction.foodId,
		beforeValue: beforeQuantity,
		issuedTick: state.gameTick,
	};
	return true;
};

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

	queueEmergencyFoodConsumeAction(selectedFoodId);
	return true;
};

export const TravelToOuraniaAltar = (): void => {
	if (state.behaviour.runRestoreOption !== 'Stamina Potions') {
		hasConsumedStaminaDuringTravel = false;
	}

	if (verifyOrRetryPendingTravelConsumeAction()) {
		return;
	}

	if (
		state.behaviour.runRestoreOption === 'Stamina Potions' &&
		!hasConsumedStaminaDuringTravel &&
		!bot.bank.isOpen() &&
		bot.inventory.containsAnyIds(STAMINA_POTION_IDS_LOW_TO_HIGH)
	) {
		queueStaminaConsumeAction();
		return;
	}

	if (maybeConsumeEmergencyFoodDuringTravel()) {
		return;
	}

	const reachedOuraniaAltarArea = walkToOuraniaAltarWithBfs();
	if (!reachedOuraniaAltarArea) return;

	hasConsumedStaminaDuringTravel = false;
	hasConsumedEmergencyFoodDuringTravel = false;
	clearPendingTravelConsumeAction();
	state.mainState = MainStates.INTERACT_WITH_OURANIA_ALTAR;
};
