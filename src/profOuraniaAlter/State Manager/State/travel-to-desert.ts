import { MainStates, state } from '../script-state.js';
import { logError, logTravelToDesert } from '../logging.js';

const DESERT_AMULET_4_ID = net.runelite.api.ItemID.DESERT_AMULET_4;
const DESERT_AMULET_NARDAH_OPTION = 'Nardah';
const NARDAH_REGION_ID = 13613;
const ELIDINIS_STATUETTE_NAME = 'Elidinis Statuette';
const ELIDINIS_PRAY_AT_OPTION = 'Pray-at';
const PRAY_RETRY_TICKS = 10;

let hasLoggedTravelStart = false;
let hasLoggedWaitingForNardahArrival = false;
let hasLoggedWaitingForRunRestore = false;
let lastPrayClickTick = -1;

const getRegionIdFromLocation = (
	location: net.runelite.api.coords.WorldPoint,
): number => ((location.getX() >> 6) << 8) + (location.getY() >> 6);

const getRunEnergyPercent = (): number => {
	const rawRunEnergy = Number(client.getEnergy());
	return rawRunEnergy > 100 ? Math.floor(rawRunEnergy / 100) : rawRunEnergy;
};

const resetDesertTravelTracking = (): void => {
	hasLoggedTravelStart = false;
	hasLoggedWaitingForNardahArrival = false;
	hasLoggedWaitingForRunRestore = false;
	lastPrayClickTick = -1;
	state.workflowStep = 0;
};

const useDesertAmuletNardahTeleport = (): boolean => {
	if (bot.inventory.containsId(DESERT_AMULET_4_ID)) {
		logTravelToDesert(
			`Using Desert amulet 4 from inventory with action ${DESERT_AMULET_NARDAH_OPTION}.`,
		);
		bot.inventory.interactWithIds(
			[DESERT_AMULET_4_ID],
			[DESERT_AMULET_NARDAH_OPTION],
		);
		return true;
	}

	if (!bot.equipment.containsId(DESERT_AMULET_4_ID)) {
		logError(
			`Desert amulet 4 not found in inventory or equipment (id=${DESERT_AMULET_4_ID}).`,
		);
		return false;
	}

	const equipmentApi = bot.equipment as unknown as {
		interactWithIds?: (itemIds: number[], options: string[]) => number;
	};

	if (!equipmentApi.interactWithIds) {
		logError(
			'Desert amulet 4 is equipped, but equipment interact API is unavailable.',
		);
		return false;
	}

	logTravelToDesert(
		`Using Desert amulet 4 from equipment with action ${DESERT_AMULET_NARDAH_OPTION}.`,
	);
	equipmentApi.interactWithIds(
		[DESERT_AMULET_4_ID],
		[DESERT_AMULET_NARDAH_OPTION],
	);
	return true;
};

export const TravelToDesert = (): void => {
	if (!hasLoggedTravelStart) {
		logTravelToDesert('Traveling to desert restore route.');
		hasLoggedTravelStart = true;
	}

	const player = client.getLocalPlayer();
	if (!player) return;

	const playerLocation = player.getWorldLocation();
	if (!playerLocation) return;

	const regionId = getRegionIdFromLocation(playerLocation);

	switch (state.workflowStep) {
		case 0: {
			if (regionId === NARDAH_REGION_ID) {
				hasLoggedWaitingForNardahArrival = false;
				state.workflowStep = 1;
				return;
			}

			if (!useDesertAmuletNardahTeleport()) {
				return;
			}
			hasLoggedWaitingForNardahArrival = false;
			state.workflowStep = 1;
			return;
		}
		case 1: {
			if (regionId !== NARDAH_REGION_ID) {
				if (!hasLoggedWaitingForNardahArrival) {
					logTravelToDesert(
						`Waiting for desert teleport arrival (region ${NARDAH_REGION_ID}).`,
					);
					hasLoggedWaitingForNardahArrival = true;
				}
				return;
			}

			hasLoggedWaitingForNardahArrival = false;

			const statuette = bot.objects.getTileObjectsWithNames([
				ELIDINIS_STATUETTE_NAME,
			])[0];
			if (!statuette) {
				logError(
					`Could not find ${ELIDINIS_STATUETTE_NAME} in region ${NARDAH_REGION_ID}.`,
				);
				return;
			}

			logTravelToDesert(
				`Interacting with ${ELIDINIS_STATUETTE_NAME} using ${ELIDINIS_PRAY_AT_OPTION}.`,
			);
			bot.objects.interactSuppliedObject(
				statuette,
				ELIDINIS_PRAY_AT_OPTION,
			);
			lastPrayClickTick = state.gameTick;
			hasLoggedWaitingForRunRestore = false;
			state.workflowStep = 2;
			return;
		}
		case 2: {
			const runEnergy = getRunEnergyPercent();
			if (runEnergy >= 100) {
				logTravelToDesert(
					'Run energy restored to 100%. Transitioning to travel to bank.',
				);
				resetDesertTravelTracking();
				state.mainState = MainStates.TRAVEL_TO_BANK;
				return;
			}

			if (!hasLoggedWaitingForRunRestore) {
				logTravelToDesert(
					`Waiting for run restore at statuette (current ${runEnergy}%).`,
				);
				hasLoggedWaitingForRunRestore = true;
			}

			if (lastPrayClickTick < 0) {
				lastPrayClickTick = state.gameTick;
			}

			if (state.gameTick - lastPrayClickTick < PRAY_RETRY_TICKS) {
				return;
			}

			const statuette = bot.objects.getTileObjectsWithNames([
				ELIDINIS_STATUETTE_NAME,
			])[0];
			if (!statuette) {
				logError(
					`Could not find ${ELIDINIS_STATUETTE_NAME} for retry interaction.`,
				);
				return;
			}

			logTravelToDesert(
				`Run not full after ${PRAY_RETRY_TICKS} ticks. Re-clicking ${ELIDINIS_STATUETTE_NAME}.`,
			);
			bot.objects.interactSuppliedObject(
				statuette,
				ELIDINIS_PRAY_AT_OPTION,
			);
			lastPrayClickTick = state.gameTick;
			return;
		}
		default: {
			logError(
				`TravelToDesert: unexpected workflowStep ${state.workflowStep}. Resetting.`,
			);
			resetDesertTravelTracking();
			return;
		}
	}
};
