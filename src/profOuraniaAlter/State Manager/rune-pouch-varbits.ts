import {
	state,
	type RuneOption,
	type RuneSelectionOption,
} from './script-state.js';
import { logState } from './logging.js';
import { BANKING_RUNE_MINIMUM_THRESHOLD } from './constants.js';

export type RunePouchSlot = {
	slot: number;
	runeVarbit: number;
	amountVarbit: number;
	runeId: number;
	amount: number;
	runeOption: RuneOption | 'na';
};

const RUNE_POUCH_SLOT_VARBITS = [
	{ slot: 1, runeVarbit: 29, amountVarbit: 1624 },
	{ slot: 2, runeVarbit: 1622, amountVarbit: 1625 },
	{ slot: 3, runeVarbit: 1623, amountVarbit: 1626 },
	{ slot: 4, runeVarbit: 14285, amountVarbit: 14286 },
	{ slot: 5, runeVarbit: 15373, amountVarbit: 15375 },
	{ slot: 6, runeVarbit: 15374, amountVarbit: 15376 },
] as const;

// Rune pouch varbit IDs for the Rune_Selection_OPTIONS currently used by the UI.
const RUNE_ID_TO_OPTION: Record<number, RuneOption> = {
	1: 'Air',
	2: 'Water',
	3: 'Earth',
	4: 'Fire',
	5: 'Mind',
	9: 'Cosmic',
	11: 'Law',
	13: 'Soul',
	14: 'Astral',
	17: 'Dust',
};

const RUNE_OPTION_TO_ITEM_ID: Record<RuneOption, number> = {
	Air: net.runelite.api.ItemID.AIR_RUNE,
	Water: net.runelite.api.ItemID.WATER_RUNE,
	Earth: net.runelite.api.ItemID.EARTH_RUNE,
	Fire: net.runelite.api.ItemID.FIRE_RUNE,
	Mind: net.runelite.api.ItemID.MIND_RUNE,
	Dust: net.runelite.api.ItemID.DUST_RUNE,
	Cosmic: net.runelite.api.ItemID.COSMIC_RUNE,
	Astral: net.runelite.api.ItemID.ASTRAL_RUNE,
	Law: net.runelite.api.ItemID.LAW_RUNE,
	Soul: net.runelite.api.ItemID.SOUL_RUNE,
};

export const readRunePouchSlots = (slotCount: number): RunePouchSlot[] => {
	const safeSlotCount = Math.max(
		0,
		Math.min(slotCount, RUNE_POUCH_SLOT_VARBITS.length),
	);

	return RUNE_POUCH_SLOT_VARBITS.slice(0, safeSlotCount).map((slotData) => {
		const runeId = Number(client.getVarbitValue(slotData.runeVarbit) ?? 0);
		const amount = Number(
			client.getVarbitValue(slotData.amountVarbit) ?? 0,
		);
		const runeOption = RUNE_ID_TO_OPTION[runeId] ?? 'na';

		return {
			slot: slotData.slot,
			runeVarbit: slotData.runeVarbit,
			amountVarbit: slotData.amountVarbit,
			runeId,
			amount,
			runeOption,
		};
	});
};

const getConfiguredPouchSlotCount = (): number => {
	if (state.settings.divinePouchEnabled) return 6;
	if (state.settings.runePouchEnabled) return 4;
	return 0;
};

export const getRuneAmountInPouch = (rune: RuneOption): number => {
	const slotCount = getConfiguredPouchSlotCount();
	if (slotCount <= 0) return 0;

	const liveSlots = readRunePouchSlots(slotCount);
	const matchingSlot = liveSlots.find(
		(slotData) => slotData.runeOption === rune,
	);
	return matchingSlot?.amount ?? 0;
};

export const getRuneAmountInInventory = (rune: RuneOption): number => {
	const runeItemId = RUNE_OPTION_TO_ITEM_ID[rune];
	return Number(bot.inventory.getQuantityOfId(runeItemId) ?? 0);
};

export const getTotalRuneAmountAvailable = (rune: RuneOption): number => {
	return getRuneAmountInPouch(rune) + getRuneAmountInInventory(rune);
};

const getConfiguredRuneSelections = (): RuneSelectionOption[] => [
	state.settings.runeSelection1,
	state.settings.runeSelection2,
	state.settings.runeSelection3,
	state.settings.runeSelection4,
];

export const refreshRunePouchRuntime = (reason: string): void => {
	const configuredSelections = getConfiguredRuneSelections();
	const slotCount = getConfiguredPouchSlotCount();
	const shouldTrackPouch = slotCount > 0;
	const liveSlots = readRunePouchSlots(slotCount);

	const evaluatedSlots = liveSlots.map((slotData, index) => {
		const expectedRune = configuredSelections[index] ?? 'na';
		const runeMatchesSelection =
			expectedRune === 'na' || expectedRune === slotData.runeOption;
		const hasQuantity = expectedRune === 'na' || slotData.amount > 0;

		return {
			slot: slotData.slot,
			expectedRune,
			actualRune: slotData.runeOption,
			amount: slotData.amount,
			runeMatchesSelection,
			hasQuantity,
		};
	});

	const allRunesMatchSelection = evaluatedSlots.every(
		(slot) => slot.runeMatchesSelection,
	);
	const allSlotsHaveQuantity = evaluatedSlots.every(
		(slot) => slot.hasQuantity,
	);
	const readyForConfiguredRunes =
		!shouldTrackPouch || (allRunesMatchSelection && allSlotsHaveQuantity);
	const bankingRune = state.settings.runesForBanking;
	const bankingRunePouchAmount = getRuneAmountInPouch(bankingRune);
	const bankingRuneInventoryAmount = getRuneAmountInInventory(bankingRune);
	const bankingRuneTotalAmount =
		bankingRunePouchAmount + bankingRuneInventoryAmount;
	const bankingRuneMeetsMinimum =
		bankingRuneTotalAmount > BANKING_RUNE_MINIMUM_THRESHOLD;

	state.pouchState.runePouchRuntime = {
		slotCount,
		lastUpdatedTick: state.gameTick,
		allRunesMatchSelection,
		allSlotsHaveQuantity,
		readyForConfiguredRunes,
		bankingRune: {
			rune: bankingRune,
			pouchAmount: bankingRunePouchAmount,
			inventoryAmount: bankingRuneInventoryAmount,
			totalAmount: bankingRuneTotalAmount,
			meetsMinimum: bankingRuneMeetsMinimum,
		},
		slots: evaluatedSlots,
	};

	logState(
		`Rune runtime refreshed (${reason}): ready=${String(readyForConfiguredRunes)}, slots=${slotCount}, bankingRune=${bankingRune} total=${bankingRuneTotalAmount}.`,
	);
};
