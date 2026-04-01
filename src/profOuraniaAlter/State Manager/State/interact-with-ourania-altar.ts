import {
	logError,
	logInteractWithOuraniaAltar,
	logSuccess,
} from '../logging.js';
import { INTERACTIONS, OBJECT_IDS, OBJECT_NAMES } from '../constants.js';
import {
	state,
	type PouchKey,
	getRunRestoreTargetState,
} from '../script-state.js';
import {
	getActivePouchKeysInInventory,
	getPouchInventoryItemIds,
} from '../pouch-utils.js';

const ESSENCE_ITEM_IDS: number[] = [
	net.runelite.api.ItemID.PURE_ESSENCE,
	net.runelite.api.ItemID.DAEYALT_ESSENCE,
];

const getInventoryEssenceCount = (): number =>
	bot.inventory.getQuantityOfAllIds(ESSENCE_ITEM_IDS);

const getCurrentRunecraftingXp = (): number =>
	client.getSkillExperience(net.runelite.api.Skill.RUNECRAFT);

const getActivePouchForNow = (): PouchKey | null => {
	const activePouches = getActivePouchKeysInInventory();
	if (activePouches.length === 0) return null;

	// Current implementation focus: colossal pouch flow only.
	if (activePouches.includes('COLOSSAL')) {
		return 'COLOSSAL';
	}

	return activePouches[0] ?? null;
};

const resetAltarTracking = (): void => {
	state.altarState.configSignature = '';
	state.altarState.mode = 'NONE';
	state.altarState.remainingStandardPouches = [];
	state.altarState.currentBatch = [];
	state.altarState.currentPouchIndex = 0;
	state.altarState.queuedActions = [];
	state.altarState.awaitingCraftVerification = false;
	state.altarState.lastQueuedCraftTick = -1;
	state.altarState.craftVerificationRetries = 0;
	state.altarState.colossalNoXpCycles = 0;
	state.altarState.lastRunecraftXp = getCurrentRunecraftingXp();
};

const routeAfterCrafting = (): void => {
	resetAltarTracking();
	state.mainState = getRunRestoreTargetState();
};

const tryEmptySelectedPouch = (pouchKey: PouchKey | null): void => {
	if (!pouchKey) {
		return;
	}

	if (pouchKey !== 'COLOSSAL') {
		logInteractWithOuraniaAltar(
			`Pouch ${pouchKey} selected, but non-colossal empty strategy is intentionally left blank for now.`,
		);
		return;
	}

	const pouchItemIds = getPouchInventoryItemIds(pouchKey);

	// Guard: ensure pouch items are actually in inventory before attempting interaction.
	if (pouchItemIds.length === 0) {
		logError(
			`Tick ${state.gameTick}: Could not find ${pouchKey} pouch item IDs in inventory. Skipping empty.`,
		);
		return;
	}

	const pouchItemId =
		pouchItemIds.find((itemId) => bot.inventory.containsId(itemId)) ??
		pouchItemIds[0];

	bot.menuAction(
		0,
		9764864,
		net.runelite.api.MenuAction.CC_OP,
		2,
		pouchItemId,
		0,
		'Empty',
		'<col=ff9040>Colossal pouch</col>',
	);

	logInteractWithOuraniaAltar(
		`Tick ${state.gameTick}: XP confirmed, invoked exact Empty CC_OP on ${pouchKey} pouch (itemId=${pouchItemId}).`,
	);
};

export const InteractWithOuraniaAltar = (): void => {
	logInteractWithOuraniaAltar('Interacting with Ourania altar.');

	const ouraniaAltar = bot.objects.getTileObjectsWithIds([
		OBJECT_IDS.ouraniaAltar,
	])[0];

	if (!ouraniaAltar) {
		logError(
			`Ourania altar not found: ${OBJECT_NAMES.ouraniaAltar} (id=${OBJECT_IDS.ouraniaAltar}).`,
		);
		return;
	}

	const activePouches = getActivePouchKeysInInventory();
	const configSignature = activePouches.join('|');
	if (state.altarState.configSignature !== configSignature) {
		resetAltarTracking();
		state.altarState.configSignature = configSignature;
		logInteractWithOuraniaAltar(
			'Entered altar interaction state. First action will be Craft-rune.',
		);
	}

	const selectedPouch = getActivePouchForNow();
	const inventoryEssence = getInventoryEssenceCount();
	logInteractWithOuraniaAltar(
		`[DEBUG] Tick ${state.gameTick}: essence count = ${inventoryEssence}, awaiting verification = ${state.altarState.awaitingCraftVerification}, selected pouch = ${selectedPouch || 'NULL'}`,
	);

	// 1) First actionable step in this state: craft to pull player into altar interaction rhythm.
	if (!state.altarState.awaitingCraftVerification && inventoryEssence > 0) {
		bot.objects.interactSuppliedObject(ouraniaAltar, INTERACTIONS.useAltar);
		state.altarState.awaitingCraftVerification = true;
		state.altarState.lastQueuedCraftTick = state.gameTick;
		logInteractWithOuraniaAltar(
			`Tick ${state.gameTick}: crafting on ${OBJECT_NAMES.ouraniaAltar} (${inventoryEssence} essence in inventory).`,
		);
		return;
	}

	// 2) On the exact tick XP is detected, empty selected pouch (colossal focus).
	if (state.altarState.awaitingCraftVerification) {
		const currentXp = getCurrentRunecraftingXp();
		logInteractWithOuraniaAltar(
			`[DEBUG XP CHECK] Tick ${state.gameTick}: currentXp=${currentXp}, lastRunecraftXp=${state.altarState.lastRunecraftXp}, will trigger=${currentXp > state.altarState.lastRunecraftXp}`,
		);
		if (currentXp > state.altarState.lastRunecraftXp) {
			state.altarState.lastRunecraftXp = currentXp;
			state.altarState.awaitingCraftVerification = false;
			tryEmptySelectedPouch(selectedPouch);
			return;
		}

		return;
	}

	// 3) If no inventory essence remains and we are not waiting for craft verification, leave altar.
	if (inventoryEssence <= 0) {
		logSuccess('No inventory essence remains at altar. Routing onward.');
		routeAfterCrafting();
	}
};
