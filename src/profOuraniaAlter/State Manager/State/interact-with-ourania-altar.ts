import {
	logError,
	logInteractWithOuraniaAltar,
	logSuccess,
} from '../logging.js';
import {
	INTERACTIONS,
	OBJECT_IDS,
	OBJECT_NAMES,
	RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD,
} from '../constants.js';
import {
	MainStates,
	state,
	type AltarQueuedActionType,
	type PouchKey,
	type StandardPouchKey,
} from '../script-state.js';
import {
	chooseBestStandardPouchBatch,
	getActivePouchKeysInInventory,
	getActiveStandardPouchKeysInInventory,
	getPouchCapacity,
	getPouchInventoryItemIds,
} from '../pouch-utils.js';

const ESSENCE_ITEM_IDS: number[] = [
	net.runelite.api.ItemID.PURE_ESSENCE,
	net.runelite.api.ItemID.DAEYALT_ESSENCE,
];

const MAX_CRAFT_VERIFICATION_RETRIES = 3;

type QueuedActionDefinition = {
	actionType: AltarQueuedActionType;
	pouchKey: PouchKey | null;
};

const getInventoryEssenceCount = (): number =>
	bot.inventory.getQuantityOfAllIds(ESSENCE_ITEM_IDS);

const getCurrentRunecraftingXp = (): number =>
	client.getSkillExperience(net.runelite.api.Skill.RUNECRAFT);

const getRunEnergyPercent = (): number => {
	const rawRunEnergy = Number(client.getEnergy());
	return rawRunEnergy > 100 ? Math.floor(rawRunEnergy / 100) : rawRunEnergy;
};

const formatPouchList = (pouches: readonly PouchKey[]): string =>
	pouches.length > 0 ? pouches.join(' -> ') : 'none';

const clearQueuedActions = (): void => {
	state.altarState.queuedActions = [];
	state.altarState.awaitingCraftVerification = false;
	state.altarState.lastQueuedCraftTick = -1;
	state.altarState.craftVerificationRetries = 0;
};

const resetAltarSequence = (): void => {
	state.altarState.configSignature = '';
	state.altarState.mode = 'NONE';
	state.altarState.remainingStandardPouches = [];
	state.altarState.currentBatch = [];
	state.altarState.currentPouchIndex = 0;
	clearQueuedActions();
	state.altarState.lastRunecraftXp = getCurrentRunecraftingXp();
};

const routeAfterCrafting = (): void => {
	resetAltarSequence();
	state.mainState =
		getRunEnergyPercent() >= RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD
			? MainStates.TRAVEL_TO_BANK
			: MainStates.TRAVEL_TO_PRAYER_ALTAR;
};

const getAltarConfigSignature = (activePouches: readonly PouchKey[]): string =>
	activePouches.join('|');

const initializeAltarSequence = (): void => {
	const activePouches = getActivePouchKeysInInventory();
	const configSignature = getAltarConfigSignature(activePouches);

	if (state.altarState.configSignature === configSignature) {
		return;
	}

	resetAltarSequence();
	state.altarState.configSignature = configSignature;
	state.altarState.lastRunecraftXp = getCurrentRunecraftingXp();

	if (activePouches.length === 0) {
		logInteractWithOuraniaAltar(
			'No active pouches detected for altar handling.',
		);
		return;
	}

	if (activePouches.length === 1 && activePouches[0] === 'COLOSSAL') {
		state.altarState.mode = 'COLOSSAL_ONLY';
		logInteractWithOuraniaAltar(
			'Configured colossal-only altar cadence: pouch -> altar -> pouch -> altar until empty.',
		);
		return;
	}

	state.altarState.mode = 'STANDARD';
	state.altarState.remainingStandardPouches =
		getActiveStandardPouchKeysInInventory();
	logInteractWithOuraniaAltar(
		`Configured standard pouch cycle with remaining order pool: ${formatPouchList(state.altarState.remainingStandardPouches)}.`,
	);
	if (activePouches.includes('COLOSSAL')) {
		logError(
			'Colossal pouch is enabled alongside standard pouches. The altar planner expects colossal to be used by itself.',
		);
	}
};

const finalizeCurrentBatch = (): void => {
	for (const pouchKey of state.altarState.currentBatch) {
		state.altarState.remainingStandardPouches =
			state.altarState.remainingStandardPouches.filter(
				(remainingPouch) => remainingPouch !== pouchKey,
			);
	}
	state.altarState.currentBatch = [];
	state.altarState.currentPouchIndex = 0;
};

const queueActionsForCurrentTick = (
	actions: QueuedActionDefinition[],
): void => {
	state.altarState.queuedActions = actions.map((action) => ({
		executeTick: state.gameTick,
		actionType: action.actionType,
		pouchKey: action.pouchKey,
	}));
	logInteractWithOuraniaAltar(
		`Queued altar actions for tick ${state.gameTick}: ${actions
			.map((action) =>
				action.actionType === 'CRAFT_ALTAR'
					? 'CRAFT_ALTAR'
					: `EMPTY_${action.pouchKey ?? 'UNKNOWN'}`,
			)
			.join(' -> ')}.`,
	);
};

const executeQueuedActions = (
	ouraniaAltar: net.runelite.api.TileObject,
): boolean => {
	const dueActions = state.altarState.queuedActions.filter(
		(action) => action.executeTick <= state.gameTick,
	);
	if (dueActions.length === 0) {
		return false;
	}

	state.altarState.queuedActions = state.altarState.queuedActions.filter(
		(action) => action.executeTick > state.gameTick,
	);

	for (const action of dueActions) {
		if (action.actionType === 'EMPTY_POUCH' && action.pouchKey) {
			logInteractWithOuraniaAltar(
				`Tick ${state.gameTick}: emptying ${action.pouchKey} pouch (${getPouchCapacity(action.pouchKey)} essence capacity).`,
			);
			bot.inventory.interactWithIds(
				getPouchInventoryItemIds(action.pouchKey),
				['Empty'],
			);
			continue;
		}

		logInteractWithOuraniaAltar(
			`Tick ${state.gameTick}: crafting on ${OBJECT_NAMES.ouraniaAltar}.`,
		);
		bot.objects.interactSuppliedObject(ouraniaAltar, INTERACTIONS.useAltar);
		state.altarState.awaitingCraftVerification = true;
		state.altarState.lastQueuedCraftTick = state.gameTick;
		state.altarState.craftVerificationRetries = 0;
	}

	return true;
};

const resolveCraftVerification = (
	ouraniaAltar: net.runelite.api.TileObject,
): boolean => {
	if (!state.altarState.awaitingCraftVerification) {
		return false;
	}

	const currentRunecraftingXp = getCurrentRunecraftingXp();
	if (currentRunecraftingXp > state.altarState.lastRunecraftXp) {
		logInteractWithOuraniaAltar(
			`Runecrafting XP drop detected at tick ${state.gameTick}. Craft verified.`,
		);
		state.altarState.awaitingCraftVerification = false;
		state.altarState.lastRunecraftXp = currentRunecraftingXp;
		state.altarState.lastQueuedCraftTick = -1;
		state.altarState.craftVerificationRetries = 0;
		if (state.altarState.mode === 'STANDARD') {
			finalizeCurrentBatch();
		}
		return false;
	}

	if (state.gameTick <= state.altarState.lastQueuedCraftTick) {
		return true;
	}

	state.altarState.craftVerificationRetries += 1;
	if (
		state.altarState.craftVerificationRetries <
		MAX_CRAFT_VERIFICATION_RETRIES
	) {
		logInteractWithOuraniaAltar(
			`Waiting for Runecrafting XP drop confirmation (${state.altarState.craftVerificationRetries}/${MAX_CRAFT_VERIFICATION_RETRIES}).`,
		);
		return true;
	}

	state.altarState.awaitingCraftVerification = false;
	state.altarState.lastQueuedCraftTick = -1;
	state.altarState.craftVerificationRetries = 0;

	const currentEssenceCount = getInventoryEssenceCount();
	if (currentEssenceCount > 0) {
		logError(
			'No Runecrafting XP drop detected, but essence is still in inventory. Re-crafting at altar.',
		);
		logInteractWithOuraniaAltar(
			`Tick ${state.gameTick}: crafting on ${OBJECT_NAMES.ouraniaAltar}.`,
		);
		bot.objects.interactSuppliedObject(ouraniaAltar, INTERACTIONS.useAltar);
		state.altarState.awaitingCraftVerification = true;
		state.altarState.lastQueuedCraftTick = state.gameTick;
		state.altarState.craftVerificationRetries = 0;
		return true;
	}

	if (
		state.altarState.mode === 'STANDARD' &&
		state.altarState.currentBatch.length > 0
	) {
		logInteractWithOuraniaAltar(
			`No Runecrafting XP drop after batch ${formatPouchList(state.altarState.currentBatch)}. Treating that batch as empty and continuing.`,
		);
		finalizeCurrentBatch();
		return false;
	}

	if (state.altarState.mode === 'COLOSSAL_ONLY') {
		logSuccess(
			'No Runecrafting XP drop after queued colossal cycle and no essence remains in inventory. Colossal pouch appears empty.',
		);
		routeAfterCrafting();
		return true;
	}

	return false;
};

const getOrCreateCurrentBatch = (
	currentEmptySlots: number,
): StandardPouchKey[] => {
	if (state.altarState.currentBatch.length > 0) {
		return state.altarState.currentBatch;
	}

	state.altarState.currentBatch = chooseBestStandardPouchBatch(
		state.altarState.remainingStandardPouches,
		currentEmptySlots,
	);
	state.altarState.currentPouchIndex = 0;
	if (state.altarState.currentBatch.length > 0) {
		logInteractWithOuraniaAltar(
			`Selected pouch batch before next craft: ${formatPouchList(state.altarState.currentBatch)}.`,
		);
	}
	return state.altarState.currentBatch;
};

const scheduleNextAltarCycle = (): boolean => {
	const currentEssenceCount = getInventoryEssenceCount();
	const currentEmptySlots = bot.inventory.getEmptySlots();

	if (state.altarState.mode === 'COLOSSAL_ONLY') {
		if (currentEmptySlots > 0) {
			queueActionsForCurrentTick([
				{ actionType: 'EMPTY_POUCH', pouchKey: 'COLOSSAL' },
				{ actionType: 'CRAFT_ALTAR', pouchKey: null },
			]);
			return true;
		}

		if (currentEssenceCount > 0) {
			queueActionsForCurrentTick([
				{ actionType: 'CRAFT_ALTAR', pouchKey: null },
			]);
			return true;
		}

		logSuccess('Ourania altar sequence complete. Leaving altar area.');
		routeAfterCrafting();
		return true;
	}

	if (state.altarState.mode === 'STANDARD') {
		if (currentEmptySlots > 0) {
			const currentBatch = getOrCreateCurrentBatch(currentEmptySlots);
			if (currentBatch.length > 0) {
				queueActionsForCurrentTick([
					...currentBatch.map((pouchKey) => ({
						actionType: 'EMPTY_POUCH' as const,
						pouchKey,
					})),
					{ actionType: 'CRAFT_ALTAR', pouchKey: null },
				]);
				return true;
			}
		}

		if (currentEssenceCount > 0) {
			queueActionsForCurrentTick([
				{ actionType: 'CRAFT_ALTAR', pouchKey: null },
			]);
			return true;
		}

		if (
			state.altarState.remainingStandardPouches.length === 0 &&
			state.altarState.currentBatch.length === 0
		) {
			logSuccess('Ourania altar sequence complete. Leaving altar area.');
			routeAfterCrafting();
			return true;
		}

		logError(
			`No pouch batch could be selected with ${currentEmptySlots} free inventory slots.`,
		);
		return true;
	}

	if (currentEssenceCount > 0) {
		queueActionsForCurrentTick([
			{ actionType: 'CRAFT_ALTAR', pouchKey: null },
		]);
		return true;
	}

	logSuccess('No altar actions remain. Leaving altar area.');
	routeAfterCrafting();
	return true;
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

	logInteractWithOuraniaAltar(
		`Ourania altar target ready: ${OBJECT_NAMES.ouraniaAltar} (id=${OBJECT_IDS.ouraniaAltar}) with action ${INTERACTIONS.useAltar}.`,
	);

	initializeAltarSequence();

	if (resolveCraftVerification(ouraniaAltar)) {
		return;
	}

	scheduleNextAltarCycle();
	executeQueuedActions(ouraniaAltar);
};
