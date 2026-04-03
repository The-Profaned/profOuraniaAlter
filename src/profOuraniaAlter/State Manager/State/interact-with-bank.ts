import { MainStates, state } from '../script-state.js';
import { logError, logInteractWithBank } from '../logging.js';
import {
	INTERACTIONS,
	NPC_IDS,
	NPC_NAMES,
	POUCH_ITEM_IDS,
	BANK_SUBSTATE_REFILL_RUNES,
	BANKING_RUNE_MINIMUM_THRESHOLD,
	RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD,
} from '../constants.js';
import { getTotalRuneAmountAvailable } from '../rune-pouch-varbits.js';
import {
	getActiveStandardPouchKeysInInventory,
	getCurrentPouchCapacity,
	getPouchInventoryItemIds,
} from '../pouch-utils.js';
import type { StandardPouchKey } from '../script-state.js';

const PURE_ESSENCE_ID = net.runelite.api.ItemID.PURE_ESSENCE;
const DAEYALT_ESSENCE_ID = net.runelite.api.ItemID.DAEYALT_ESSENCE;
const DEPOSIT_INVENTORY_WIDGET_ID = 786473;
const DEPOSIT_INVENTORY_WIDGET_IDENTIFIER = 1;
const DEPOSIT_INVENTORY_WIDGET_OPCODE = 57;
const DEPOSIT_INVENTORY_WIDGET_PARAM0 = -1;
const BANK_OPEN_INVENTORY_WIDGET_ID = 983043;
const FILL_ACTION_IDENTIFIER = 9;
const STAMINA_POTION_IDS_LOW_TO_HIGH: number[] = [
	net.runelite.api.ItemID.STAMINA_POTION1,
	net.runelite.api.ItemID.STAMINA_POTION2,
	net.runelite.api.ItemID.STAMINA_POTION3,
	net.runelite.api.ItemID.STAMINA_POTION4,
];

let selectedBankingEssenceId: number | null = null;
let hasLoggedBankStateStart = false;
let hasLoggedOpeningBank = false;
let hasDepositedInventoryAtBank = false;
let hasCompletedStaminaPrepAtBank = false;
let colossalPouchTrackedFill = 0;
let pendingStandardPouchesToFill: StandardPouchKey[] = [];
let preFillEssenceCount: number | null = null;
let hasDonePostPouchFillWithdraw = false;

const FOOD_OPTION_TO_ITEM_ID = {
	Tuna: net.runelite.api.ItemID.TUNA,
	Lobster: net.runelite.api.ItemID.LOBSTER,
	Bass: net.runelite.api.ItemID.BASS,
	Swordfish: net.runelite.api.ItemID.SWORDFISH,
	Monkfish: net.runelite.api.ItemID.MONKFISH,
	Karambwan: net.runelite.api.ItemID.COOKED_KARAMBWAN,
	Shark: net.runelite.api.ItemID.SHARK,
	MantaRay: net.runelite.api.ItemID.MANTA_RAY,
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

const resetBankingTracking = (): void => {
	selectedBankingEssenceId = null;
	hasLoggedBankStateStart = false;
	hasLoggedOpeningBank = false;
	hasDepositedInventoryAtBank = false;
	hasCompletedStaminaPrepAtBank = false;
	colossalPouchTrackedFill = 0;
	pendingStandardPouchesToFill = [];
	preFillEssenceCount = null;
	hasDonePostPouchFillWithdraw = false;
	state.workflowStep = 0;
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

const getSelectedEmergencyFoodItemId = (): number =>
	FOOD_OPTION_TO_ITEM_ID[getEmergencyFoodLookupKey()];

const handleEmergencyFoodPrepBeforeEssenceFill = (): boolean => {
	if (!state.behaviour.emergencyFoodEnabled) {
		return false;
	}

	if (!isEmergencyFoodHpThresholdMet()) {
		return false;
	}

	const emergencyFoodId = getSelectedEmergencyFoodItemId();
	if (bot.inventory.containsId(emergencyFoodId)) {
		return false;
	}

	if (bot.bank.getQuantityOfId(emergencyFoodId) <= 0) {
		const missingFoodMessage = `Emergency food is enabled and HP is low, but selected food (${state.settings.emergencyFoodOption}) is not in bank. Change emergency food option or disable Emergency Food in the Behaviour tab, then restart the script.`;
		logError(missingFoodMessage);
		log.printGameMessage(missingFoodMessage);
		state.mainState = MainStates.IDLE;
		bot.terminate();
		return true;
	}

	logInteractWithBank(
		`Emergency food trigger met. Withdrawing one ${state.settings.emergencyFoodOption} for travel-to-altar consumption.`,
	);
	bot.bank.withdrawWithId(emergencyFoodId);
	return true;
};

const getRunEnergyPercent = (): number => {
	const rawRunEnergy = Number(client.getEnergy());
	return rawRunEnergy > 100 ? Math.floor(rawRunEnergy / 100) : rawRunEnergy;
};

const getPreferredStaminaPotionIdInBank = (): number | null => {
	for (const potionId of STAMINA_POTION_IDS_LOW_TO_HIGH) {
		if (bot.bank.getQuantityOfId(potionId) > 0) {
			return potionId;
		}
	}

	return null;
};

const handleStaminaPrepBeforeEssenceFill = (): boolean => {
	if (state.behaviour.runRestoreOption !== 'Stamina Potions') {
		return false;
	}

	if (hasCompletedStaminaPrepAtBank) {
		return false;
	}

	const runEnergyPercent = getRunEnergyPercent();
	if (runEnergyPercent >= RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD) {
		hasCompletedStaminaPrepAtBank = true;
		return false;
	}

	if (bot.inventory.containsAnyIds(STAMINA_POTION_IDS_LOW_TO_HIGH)) {
		logInteractWithBank(
			'Stamina potion already in inventory. Keeping it for travel-to-altar consumption.',
		);
		hasCompletedStaminaPrepAtBank = true;
		return false;
	}

	const staminaPotionId = getPreferredStaminaPotionIdInBank();
	if (staminaPotionId === null) {
		logError(
			`Run energy ${runEnergyPercent}% below threshold ${RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD}%, but no stamina potions found in bank.`,
		);
		hasCompletedStaminaPrepAtBank = true;
		return false;
	}

	logInteractWithBank(
		`Run energy ${runEnergyPercent}% below threshold ${RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD}%. Withdrawing one stamina potion dose item (${staminaPotionId}) to consume during travel.`,
	);
	bot.bank.withdrawWithId(staminaPotionId);
	hasCompletedStaminaPrepAtBank = true;
	return true;
};

const isColossalOnlyConfigured = (): boolean =>
	state.behaviour.useColossalPouch &&
	!state.behaviour.useSmallPouch &&
	!state.behaviour.useMediumPouch &&
	!state.behaviour.useLargePouch &&
	!state.behaviour.useGiantPouch;

const isStandardOnlyConfigured = (): boolean =>
	!state.behaviour.useColossalPouch &&
	(state.behaviour.useSmallPouch ||
		state.behaviour.useMediumPouch ||
		state.behaviour.useLargePouch ||
		state.behaviour.useGiantPouch);

const getInventoryEssenceCount = (): number =>
	bot.inventory.getQuantityOfId(PURE_ESSENCE_ID) +
	bot.inventory.getQuantityOfId(DAEYALT_ESSENCE_ID);

const hasNoInventoryEmptySlots = (): boolean =>
	bot.inventory.getEmptySlots() === 0;

const verifyFinalInventoryFill = (selectedEssenceId: number): boolean => {
	if (hasNoInventoryEmptySlots()) {
		return true;
	}

	const emptySlots = bot.inventory.getEmptySlots();
	logInteractWithBank(
		`Final withdraw verification failed: ${emptySlots} empty slot(s) remain. Retrying withdraw-all Essence.`,
	);
	bot.bank.withdrawAllWithId(selectedEssenceId);
	return false;
};

const initializePendingStandardPouches = (): void => {
	if (pendingStandardPouchesToFill.length > 0) {
		return;
	}

	pendingStandardPouchesToFill = getActiveStandardPouchKeysInInventory().sort(
		(left, right) =>
			getCurrentPouchCapacity(right) - getCurrentPouchCapacity(left),
	);
};

const fillStandardPouchFromInventory = (pouchKey: StandardPouchKey): void => {
	const pouchItemIds = getPouchInventoryItemIds(pouchKey);
	bot.inventory.interactWithIds(pouchItemIds, ['Fill']);
};

const handleStandardPouchBanking = (selectedEssenceId: number): boolean => {
	initializePendingStandardPouches();

	if (pendingStandardPouchesToFill.length === 0) {
		if (!hasDonePostPouchFillWithdraw) {
			logInteractWithBank(
				'Withdrawing-all Essence for final inventory fill.',
			);
			bot.bank.withdrawAllWithId(selectedEssenceId);
			hasDonePostPouchFillWithdraw = true;
			return true;
		}

		if (!verifyFinalInventoryFill(selectedEssenceId)) {
			return true;
		}

		logInteractWithBank(
			'Banking complete. Transitioning to travel to Ourania altar.',
		);
		state.altarState.colossalExpectedFill = 0;
		state.altarState.colossalEmptiedTotal = 0;
		state.altarState.colossalRemainingFill = 0;
		resetBankingTracking();
		state.mainState = MainStates.TRAVEL_TO_OURANIA_ALTAR;
		return true;
	}

	const inventoryEssence = getInventoryEssenceCount();
	const fillablePouch = pendingStandardPouchesToFill.find(
		(pouchKey) => inventoryEssence >= getCurrentPouchCapacity(pouchKey),
	);

	if (fillablePouch) {
		const pouchCapacity = getCurrentPouchCapacity(fillablePouch);
		logInteractWithBank(
			`Filling ${fillablePouch} pouch (${pouchCapacity} capacity) with ${inventoryEssence} essence in inventory.`,
		);
		fillStandardPouchFromInventory(fillablePouch);
		pendingStandardPouchesToFill = pendingStandardPouchesToFill.filter(
			(pouchKey) => pouchKey !== fillablePouch,
		);
		return true;
	}

	logInteractWithBank(
		`Withdrawing-all Essence to continue standard pouch fill plan. Pending pouches: ${pendingStandardPouchesToFill.join(', ')}.`,
	);
	bot.bank.withdrawAllWithId(selectedEssenceId);
	return true;
};

const getColossalPouchItemIdInInventory = (): number | null => {
	if (bot.inventory.containsId(POUCH_ITEM_IDS.COLOSSAL.normal)) {
		return POUCH_ITEM_IDS.COLOSSAL.normal;
	}

	if (
		POUCH_ITEM_IDS.COLOSSAL.degraded !== undefined &&
		bot.inventory.containsId(POUCH_ITEM_IDS.COLOSSAL.degraded)
	) {
		return POUCH_ITEM_IDS.COLOSSAL.degraded;
	}

	return null;
};

const getColossalPouchMaxCapacity = (pouchItemId: number): number => {
	const rcLevel = client.getRealSkillLevel(net.runelite.api.Skill.RUNECRAFT);
	const isDegraded = pouchItemId === POUCH_ITEM_IDS.COLOSSAL.degraded;
	if (rcLevel >= 85) return isDegraded ? 35 : 40;
	if (rcLevel >= 75) return isDegraded ? 23 : 27;
	if (rcLevel >= 50) return isDegraded ? 13 : 16;
	return isDegraded ? 6 : 8; // minimum to use the pouch is lvl 25
};

const isColossalPouchFull = (pouchItemId: number): boolean =>
	colossalPouchTrackedFill >= getColossalPouchMaxCapacity(pouchItemId);

const fillColossalPouchFromInventory = (pouchItemId: number): void => {
	bot.menuAction(
		0,
		BANK_OPEN_INVENTORY_WIDGET_ID,
		net.runelite.api.MenuAction.CC_OP,
		FILL_ACTION_IDENTIFIER,
		pouchItemId,
		0,
		'Fill',
		'<col=ff9040>Colossal pouch</col>',
	);
};

const resolveSelectedEssenceId = (): number => {
	if (selectedBankingEssenceId !== null) {
		return selectedBankingEssenceId;
	}

	selectedBankingEssenceId =
		bot.bank.getQuantityOfId(DAEYALT_ESSENCE_ID) > 0
			? DAEYALT_ESSENCE_ID
			: PURE_ESSENCE_ID;

	if (selectedBankingEssenceId === DAEYALT_ESSENCE_ID) {
		logInteractWithBank(
			'Daeyalt essence found in bank. Locking banking essence to Daeyalt.',
		);
	} else {
		logInteractWithBank(
			'Daeyalt essence not found. Locking banking essence to Pure essence.',
		);
	}

	return selectedBankingEssenceId;
};

export const InteractWithBank = (): void => {
	if (!hasLoggedBankStateStart) {
		logInteractWithBank('Interacting with bank.');
		hasLoggedBankStateStart = true;
	}

	if (!isColossalOnlyConfigured() && !isStandardOnlyConfigured()) {
		logError(
			'Current bank flow supports either colossal-only or standard-only pouch selection. Mixed/empty pouch configuration is unsupported.',
		);
		resetBankingTracking();
		state.mainState = MainStates.IDLE;
		return;
	}

	const banker = bot.npcs.getWithIds([NPC_IDS.banker])[0];

	if (!banker) {
		logError(
			`Bank NPC not found: ${NPC_NAMES.banker} (id=${NPC_IDS.banker}).`,
		);
		return;
	}

	const bankingRuneSelection = state.settings.runesForBanking;
	const bankingRuneAmountAvailable =
		getTotalRuneAmountAvailable(bankingRuneSelection);
	if (bankingRuneAmountAvailable <= 0) {
		const missingRuneMessage = `No ${bankingRuneSelection} runes were found in inventory or rune pouch. Please fix your inventory/rune pouch setup, then restart the script.`;
		logError(missingRuneMessage);
		log.printGameMessage(missingRuneMessage);
		bot.terminate();
		return;
	}

	if (bankingRuneAmountAvailable <= BANKING_RUNE_MINIMUM_THRESHOLD) {
		state.subState = BANK_SUBSTATE_REFILL_RUNES;
		logInteractWithBank(
			`Banking rune low for ${bankingRuneSelection}: total available ${bankingRuneAmountAvailable}. Transitioned substate to ${BANK_SUBSTATE_REFILL_RUNES}.`,
		);

		const shouldContinueForEmergencyFood =
			state.behaviour.emergencyFoodEnabled &&
			isEmergencyFoodHpThresholdMet();

		if (!shouldContinueForEmergencyFood) {
			return;
		}

		logInteractWithBank(
			'Emergency food is enabled and HP is low. Continuing bank interaction to allow emergency food withdrawal before leaving bank state.',
		);
	}

	if (!bot.bank.isOpen()) {
		if (!hasLoggedOpeningBank) {
			logInteractWithBank('Opening bank.');
			hasLoggedOpeningBank = true;
		}
		bot.npcs.interact(NPC_NAMES.banker, INTERACTIONS.bank);
		return;
	}

	hasLoggedOpeningBank = false;

	if (bot.bank.isBanking()) {
		return;
	}

	if (!hasDepositedInventoryAtBank) {
		logInteractWithBank('Depositing inventory.');

		bot.widgets.interactSpecifiedWidget(
			DEPOSIT_INVENTORY_WIDGET_ID,
			DEPOSIT_INVENTORY_WIDGET_IDENTIFIER,
			DEPOSIT_INVENTORY_WIDGET_OPCODE,
			DEPOSIT_INVENTORY_WIDGET_PARAM0,
		);
		hasDepositedInventoryAtBank = true;
		return;
	}

	if (handleEmergencyFoodPrepBeforeEssenceFill()) {
		return;
	}

	if (handleStaminaPrepBeforeEssenceFill()) {
		return;
	}

	const selectedEssenceId = resolveSelectedEssenceId();

	if (isStandardOnlyConfigured()) {
		handleStandardPouchBanking(selectedEssenceId);
		return;
	}

	const pouchItemId = getColossalPouchItemIdInInventory();
	if (pouchItemId === null) {
		logError('Colossal pouch not found in inventory while banking.');
		return;
	}

	if (preFillEssenceCount !== null) {
		const currentEssence = getInventoryEssenceCount();
		const consumed = preFillEssenceCount - currentEssence;
		if (consumed > 0) {
			colossalPouchTrackedFill += consumed;
			logInteractWithBank(
				`Fill consumed ${consumed} essence. Pouch: ${colossalPouchTrackedFill}/${getColossalPouchMaxCapacity(pouchItemId)}.`,
			);
		}
		preFillEssenceCount = null;
	}

	if (isColossalPouchFull(pouchItemId)) {
		if (!hasDonePostPouchFillWithdraw) {
			logInteractWithBank(
				'Withdrawing-all Essence for final inventory fill.',
			);
			bot.bank.withdrawAllWithId(selectedEssenceId);
			hasDonePostPouchFillWithdraw = true;
			return;
		}

		if (!verifyFinalInventoryFill(selectedEssenceId)) {
			return;
		}

		logInteractWithBank(
			'Banking complete. Transitioning to travel to Ourania altar.',
		);
		state.altarState.colossalExpectedFill = colossalPouchTrackedFill;
		state.altarState.colossalEmptiedTotal = 0;
		state.altarState.colossalRemainingFill = colossalPouchTrackedFill;
		resetBankingTracking();
		state.mainState = MainStates.TRAVEL_TO_OURANIA_ALTAR;
		return;
	}

	if (!bot.inventory.containsId(selectedEssenceId)) {
		logInteractWithBank('Withdrawing-all Essence.');
		bot.bank.withdrawAllWithId(selectedEssenceId);
		return;
	}

	preFillEssenceCount = getInventoryEssenceCount();
	logInteractWithBank('Filling Colossal pouch.');
	fillColossalPouchFromInventory(pouchItemId);
	return;
};
