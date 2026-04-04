import { MainStates, state } from '../script-state.js';
import { logError, logTravelToBank } from '../logging.js';
import {
	INTERACTIONS,
	OBJECT_IDS,
	OBJECT_NAMES,
	WORLD_POINTS,
} from '../constants.js';
import { anyPouchDegraded } from '../pouch-utils.js';

const OURANIA_TELEPORT_REGION_ID = 9778;
const LADDER_RETRY_TICKS = 24;
const SPELLBOOK_VARBIT_ID = 4070;
const LUNAR_SPELLBOOK_VALUE = 2;

let lastLadderClickTick = -1;
let hasLoggedTravelStart = false;
let hasLoggedWaitForTeleportRegion = false;
let hasLoggedWaitForLadderClimbConfirmation = false;
let hasLoggedSpellbookMismatch = false;

const resetTravelToBankLogState = (): void => {
	hasLoggedTravelStart = false;
	hasLoggedWaitForTeleportRegion = false;
	hasLoggedWaitForLadderClimbConfirmation = false;
	hasLoggedSpellbookMismatch = false;
};

const getRegionIdFromLocation = (
	location: net.runelite.api.coords.WorldPoint,
): number => ((location.getX() >> 6) << 8) + (location.getY() >> 6);

const isOnLunarSpellbook = (): boolean =>
	client.getVarbitValue(SPELLBOOK_VARBIT_ID) === LUNAR_SPELLBOOK_VALUE;

const transitionAfterBankArrival = (): void => {
	state.workflowStep = 0;
	lastLadderClickTick = -1;
	resetTravelToBankLogState();

	if (anyPouchDegraded()) {
		logTravelToBank(
			'Bank arrival complete. Degraded pouch detected; transitioning to repair pouches.',
		);
		state.pouchState.needsRepair = true;
		state.pouchState.returnState = MainStates.INTERACT_WITH_BANK;
		state.mainState = MainStates.REPAIR_POUCHES;
		return;
	}

	logTravelToBank(
		'Bank arrival complete. Transitioning to bank interaction.',
	);
	bot.breakHandler.setBreakHandlerStatus(true);
	state.mainState = MainStates.INTERACT_WITH_BANK;
};

export const TravelToBank = (): void => {
	if (!hasLoggedTravelStart) {
		logTravelToBank('Traveling to bank.');
		hasLoggedTravelStart = true;
	}

	const localPlayer = client.getLocalPlayer();
	if (!localPlayer) return;

	const playerLocation = localPlayer.getWorldLocation();
	if (!playerLocation) return;

	if (WORLD_POINTS.bankArea.contains(playerLocation)) {
		transitionAfterBankArrival();
		return;
	}

	const regionId = getRegionIdFromLocation(playerLocation);

	switch (state.workflowStep) {
		case 0: {
			if (regionId === OURANIA_TELEPORT_REGION_ID) {
				hasLoggedWaitForTeleportRegion = false;
				state.workflowStep = 1;
				return;
			}

			if (!isOnLunarSpellbook()) {
				if (!hasLoggedSpellbookMismatch) {
					logError(
						`Blocked Ourania Teleport cast because current spellbook is not Lunar (varbit ${client.getVarbitValue(SPELLBOOK_VARBIT_ID)}). Waiting until Lunar is active.`,
					);
					hasLoggedSpellbookMismatch = true;
				}
				return;
			}

			hasLoggedSpellbookMismatch = false;
			logTravelToBank(
				`Ourania Teleport pre-check passed (spellbook varbit ${client.getVarbitValue(SPELLBOOK_VARBIT_ID)}).`,
			);

			logTravelToBank('Casting Ourania Teleport spell.');
			try {
				bot.magic.cast('OURANIA_TELEPORT');
				hasLoggedWaitForTeleportRegion = false;
				state.workflowStep = 1;
			} catch (error) {
				logError(`Ourania Teleport cast failed: ${String(error)}`);
			}
			return;
		}
		case 1: {
			if (regionId !== OURANIA_TELEPORT_REGION_ID) {
				if (!hasLoggedWaitForTeleportRegion) {
					logTravelToBank('Waiting to arrive in teleport region.');
					hasLoggedWaitForTeleportRegion = true;
				}
				return;
			}

			hasLoggedWaitForTeleportRegion = false;

			const ladder = bot.objects.getTileObjectsWithIds([
				OBJECT_IDS.ladder,
			])[0];
			if (!ladder) {
				logError(
					`Ladder not found: ${OBJECT_NAMES.ladder} (id=${OBJECT_IDS.ladder}).`,
				);
				return;
			}

			logTravelToBank(
				`Climbing ladder: ${OBJECT_NAMES.ladder} (id=${OBJECT_IDS.ladder}) with action ${INTERACTIONS.climb}.`,
			);
			bot.objects.interactSuppliedObject(ladder, INTERACTIONS.climb);
			lastLadderClickTick = state.gameTick;
			hasLoggedWaitForLadderClimbConfirmation = false;
			state.workflowStep = 2;
			return;
		}
		case 2: {
			if (regionId === OURANIA_TELEPORT_REGION_ID) {
				if (lastLadderClickTick < 0) {
					lastLadderClickTick = state.gameTick;
				}

				if (state.gameTick - lastLadderClickTick > LADDER_RETRY_TICKS) {
					const ladder = bot.objects.getTileObjectsWithIds([
						OBJECT_IDS.ladder,
					])[0];
					if (!ladder) {
						logError(
							`Ladder not found for retry: ${OBJECT_NAMES.ladder} (id=${OBJECT_IDS.ladder}).`,
						);
						return;
					}

					logTravelToBank(
						`Still in region ${OURANIA_TELEPORT_REGION_ID} after ${LADDER_RETRY_TICKS} ticks. Re-clicking ladder.`,
					);
					bot.objects.interactSuppliedObject(
						ladder,
						INTERACTIONS.climb,
					);
					lastLadderClickTick = state.gameTick;
					hasLoggedWaitForLadderClimbConfirmation = false;
					return;
				}

				if (!hasLoggedWaitForLadderClimbConfirmation) {
					logTravelToBank(
						'Ladder clicked. Waiting to leave region to confirm climb.',
					);
					hasLoggedWaitForLadderClimbConfirmation = true;
				}
				return;
			}

			hasLoggedWaitForLadderClimbConfirmation = false;

			logTravelToBank(
				`Left region ${OURANIA_TELEPORT_REGION_ID}. Ladder climb verified; transitioning to bank interaction.`,
			);
			transitionAfterBankArrival();
			return;
		}
		default: {
			logError(
				`TravelToBank: unexpected workflowStep ${state.workflowStep}. Resetting.`,
			);
			state.workflowStep = 0;
			lastLadderClickTick = -1;
			resetTravelToBankLogState();
		}
	}
};
