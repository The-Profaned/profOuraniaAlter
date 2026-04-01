import { MainStates, state } from '../script-state.js';
import { logError, logInteractWithBank } from '../logging.js';
import {
	INTERACTIONS,
	NPC_IDS,
	NPC_NAMES,
	POUCH_ITEM_IDS,
	BANK_SUBSTATE_REFILL_RUNES,
	BANKING_RUNE_MINIMUM_THRESHOLD,
} from '../constants.js';
import { getTotalRuneAmountAvailable } from '../rune-pouch-varbits.js';

const PURE_ESSENCE_ID = net.runelite.api.ItemID.PURE_ESSENCE;
const DAEYALT_ESSENCE_ID = net.runelite.api.ItemID.DAEYALT_ESSENCE;
const DEPOSIT_INVENTORY_WIDGET_ID = 786473;
const DEPOSIT_INVENTORY_WIDGET_IDENTIFIER = 1;
const DEPOSIT_INVENTORY_WIDGET_OPCODE = 57;
const DEPOSIT_INVENTORY_WIDGET_PARAM0 = -1;
const BANK_OPEN_INVENTORY_WIDGET_ID = 983043;
const FILL_ACTION_IDENTIFIER = 9;

let selectedBankingEssenceId: number | null = null;
let hasLoggedBankStateStart = false;
let hasLoggedOpeningBank = false;
let hasDepositedInventoryAtBank = false;
let colossalPouchTrackedFill = 0;
let preFillEssenceCount: number | null = null;

let hasDonePostPouchFillWithdraw = false;

const resetBankingTracking = (): void => {
	selectedBankingEssenceId = null;
	hasLoggedBankStateStart = false;
	hasLoggedOpeningBank = false;
	hasDepositedInventoryAtBank = false;
	colossalPouchTrackedFill = 0;
	preFillEssenceCount = null;
	hasDonePostPouchFillWithdraw = false;
	state.workflowStep = 0;
};

const isColossalOnlyConfigured = (): boolean =>
	state.behaviour.useColossalPouch &&
	!state.behaviour.useSmallPouch &&
	!state.behaviour.useMediumPouch &&
	!state.behaviour.useLargePouch &&
	!state.behaviour.useGiantPouch;

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

const getColossalPouchMaxCapacity = (): number => {
	const rcLevel = client.getRealSkillLevel(net.runelite.api.Skill.RUNECRAFT);
	if (rcLevel >= 85) return 40;
	if (rcLevel >= 75) return 27;
	if (rcLevel >= 50) return 16;
	return 8;
};

const isColossalPouchFull = (): boolean =>
	colossalPouchTrackedFill >= getColossalPouchMaxCapacity();

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

	// NOTE: current banking logic intentionally supports colossal-only flow.
	// Future work: add separate flow for other pouch combinations.
	if (!isColossalOnlyConfigured()) {
		logError(
			'Current bank flow only supports colossal-only pouch selection. Stopping in IDLE.',
		);
		resetBankingTracking();
		state.mainState = MainStates.IDLE;
		return;
	}

	// Future hook: stamina potion handling should be inserted here without
	// disrupting the withdraw/fill bank loop.

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
	if (bankingRuneAmountAvailable <= BANKING_RUNE_MINIMUM_THRESHOLD) {
		state.subState = BANK_SUBSTATE_REFILL_RUNES;
		logInteractWithBank(
			`Banking rune low for ${bankingRuneSelection}: total available ${bankingRuneAmountAvailable}. Transitioned substate to ${BANK_SUBSTATE_REFILL_RUNES}.`,
		);
		return;
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

	const pouchItemId = getColossalPouchItemIdInInventory();
	if (pouchItemId === null) {
		logError('Colossal pouch not found in inventory while banking.');
		return;
	}

	const selectedEssenceId = resolveSelectedEssenceId();

	if (preFillEssenceCount !== null) {
		const currentEssence =
			bot.inventory.getQuantityOfId(PURE_ESSENCE_ID) +
			bot.inventory.getQuantityOfId(DAEYALT_ESSENCE_ID);
		const consumed = preFillEssenceCount - currentEssence;
		if (consumed > 0) {
			colossalPouchTrackedFill += consumed;
			logInteractWithBank(
				`Fill consumed ${consumed} essence. Pouch: ${colossalPouchTrackedFill}/${getColossalPouchMaxCapacity()}.`,
			);
		}
		preFillEssenceCount = null;
	}

	if (isColossalPouchFull()) {
		if (!hasDonePostPouchFillWithdraw) {
			logInteractWithBank(
				'Withdrawing-all Essence for final inventory fill.',
			);
			bot.bank.withdrawAllWithId(selectedEssenceId);
			hasDonePostPouchFillWithdraw = true;
			return;
		}

		logInteractWithBank(
			'Banking complete. Transitioning to travel to Ourania altar.',
		);
		resetBankingTracking();
		state.mainState = MainStates.TRAVEL_TO_OURANIA_ALTAR;
		return;
	}

	if (!bot.inventory.containsId(selectedEssenceId)) {
		logInteractWithBank('Withdrawing-all Essence.');
		bot.bank.withdrawAllWithId(selectedEssenceId);
		return;
	}

	preFillEssenceCount =
		bot.inventory.getQuantityOfId(PURE_ESSENCE_ID) +
		bot.inventory.getQuantityOfId(DAEYALT_ESSENCE_ID);
	logInteractWithBank('Filling Colossal pouch.');
	fillColossalPouchFromInventory(pouchItemId);
	return;
};
