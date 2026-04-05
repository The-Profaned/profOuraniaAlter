import {
	state,
	type RuneOption,
	type RuneSelectionOption,
} from './script-state.js';
import { BANKING_RUNE_MINIMUM_THRESHOLD } from './constants.js';

export type RunePouchSlot = {
	slot: number;
	itemId: number;
	amount: number;
	runeOption: RuneOption | 'na';
};

// Map from item ID to RuneOption for all supported runes
const ITEM_ID_TO_RUNE_OPTION: Record<number, RuneOption> = {
	[net.runelite.api.ItemID.AIR_RUNE]: 'Air',
	[net.runelite.api.ItemID.WATER_RUNE]: 'Water',
	[net.runelite.api.ItemID.EARTH_RUNE]: 'Earth',
	[net.runelite.api.ItemID.FIRE_RUNE]: 'Fire',
	[net.runelite.api.ItemID.MIND_RUNE]: 'Mind',
	[net.runelite.api.ItemID.DUST_RUNE]: 'Dust',
	[net.runelite.api.ItemID.COSMIC_RUNE]: 'Cosmic',
	[net.runelite.api.ItemID.ASTRAL_RUNE]: 'Astral',
	[net.runelite.api.ItemID.LAW_RUNE]: 'Law',
	[net.runelite.api.ItemID.SOUL_RUNE]: 'Soul',
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
	if (slotCount <= 0) {
		return [];
	}

	const runePouchContainerId =
		net.runelite.api.widgets.WidgetInfo.RUNE_POUCH_ITEM_CONTAINER.getPackedId();

	const pouchContainer = client.getItemContainer(runePouchContainerId);

	if (!pouchContainer) {
		return [];
	}

	const items = pouchContainer.getItems();
	if (!items) {
		return [];
	}

	const safeSlotCount = Math.max(0, Math.min(slotCount, items.length));

	const slots: RunePouchSlot[] = [];
	for (let slot = 0; slot < safeSlotCount; slot++) {
		const item = items[slot];
		if (!item) continue;

		const itemId = item.getId();
		const amount = item.getQuantity();
		const runeOption = ITEM_ID_TO_RUNE_OPTION[itemId] ?? 'na';

		slots.push({
			slot: slot + 1,
			itemId,
			amount,
			runeOption,
		});
	}

	return slots;
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

export const refreshRunePouchRuntime = (): void => {
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
};
