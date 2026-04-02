import { MainStates, state } from '../script-state.js';
import { logError, logTravelToPoh } from '../logging.js';
import { OURANIA_DUNGEON_REGION_ID } from '../constants.js';

const CONSTRUCTION_CAPE_IDS: number[] = [
	net.runelite.api.ItemID.CONSTRUCT_CAPE,
	net.runelite.api.ItemID.CONSTRUCT_CAPET,
];
const HOUSE_TAB_ID = net.runelite.api.ItemID.TELEPORT_TO_HOUSE;

const CONSTRUCTION_CAPE_POH_OPTION = 'Tele to POH';
const HOUSE_TAB_BREAK_OPTION = 'Break';
const POOL_DRINK_OPTION = 'Drink';
const POOL_INTERACT_RETRY_TICKS = 10;
const POOL_SEARCH_GRACE_TICKS = 7;
const POST_RESTORE_DELAY_TICKS = 1;

const POH_POOL_NAMES: string[] = [
	'Pool of Revitalisation',
	'Pool of Rejuvenation',
	'Fancy pool of Rejuvenation',
	'Ornate pool of Rejuvenation',
];

let hasLoggedTravelStart = false;
let hasLoggedWaitingForTeleport = false;
let hasLoggedWaitingForPool = false;
let hasLoggedWaitingForRunRestore = false;
let lastPoolClickTick = -1;
let startedLookingForPoolTick = -1;
let reachedFullRunTick = -1;

const getRegionIdFromLocation = (
	location: net.runelite.api.coords.WorldPoint,
): number => ((location.getX() >> 6) << 8) + (location.getY() >> 6);

const resetTravelToPohTracking = (): void => {
	hasLoggedTravelStart = false;
	hasLoggedWaitingForTeleport = false;
	hasLoggedWaitingForPool = false;
	hasLoggedWaitingForRunRestore = false;
	lastPoolClickTick = -1;
	startedLookingForPoolTick = -1;
	reachedFullRunTick = -1;
	state.workflowStep = 0;
};

const getRunEnergyPercent = (): number => {
	const rawRunEnergy = Number(client.getEnergy());
	return rawRunEnergy > 100 ? Math.floor(rawRunEnergy / 100) : rawRunEnergy;
};

const hasConstructionCapeInInventoryOrEquipment = (): boolean =>
	CONSTRUCTION_CAPE_IDS.some(
		(itemId) =>
			bot.inventory.containsId(itemId) ||
			bot.equipment.containsId(itemId),
	);

const tryUseConstructionCapePohTeleport = (): boolean => {
	const inventoryCapeId =
		CONSTRUCTION_CAPE_IDS.find((itemId) =>
			bot.inventory.containsId(itemId),
		) ?? null;
	if (inventoryCapeId !== null) {
		logTravelToPoh(
			'Using Construction cape from inventory with Tele to POH option.',
		);
		bot.inventory.interactWithIds(
			[inventoryCapeId],
			[CONSTRUCTION_CAPE_POH_OPTION],
		);
		return true;
	}

	const equippedCapeId =
		CONSTRUCTION_CAPE_IDS.find((itemId) =>
			bot.equipment.containsId(itemId),
		) ?? null;
	if (equippedCapeId === null) {
		return false;
	}

	const equipmentApi = bot.equipment as unknown as {
		interactWithIds?: (itemIds: number[], options: string[]) => number;
	};
	if (!equipmentApi.interactWithIds) {
		logError(
			'Construction cape is equipped, but equipment interact API is unavailable.',
		);
		return false;
	}

	logTravelToPoh(
		'Using Construction cape from equipment with Tele to POH option.',
	);
	equipmentApi.interactWithIds(
		[equippedCapeId],
		[CONSTRUCTION_CAPE_POH_OPTION],
	);
	return true;
};

export const TravelToPoh = (): void => {
	if (!hasLoggedTravelStart) {
		logTravelToPoh('Traveling to PoH.');
		hasLoggedTravelStart = true;
	}

	const player = client.getLocalPlayer();
	if (!player) return;

	const playerLocation = player.getWorldLocation();
	if (!playerLocation) return;

	const regionId = getRegionIdFromLocation(playerLocation);

	switch (state.workflowStep) {
		case 0: {
			switch (state.settings.pohAccessOption) {
				case 'Construction Cape': {
					const constructionLevel = client.getRealSkillLevel(
						net.runelite.api.Skill.CONSTRUCTION,
					);
					if (
						constructionLevel >= 99 &&
						hasConstructionCapeInInventoryOrEquipment()
					) {
						if (!tryUseConstructionCapePohTeleport()) {
							return;
						}
						hasLoggedWaitingForTeleport = false;
						state.workflowStep = 1;
						return;
					}

					logError(
						'Settings selected Construction Cape, but no usable cape path found. Transitioning to travel to bank.',
					);
					resetTravelToPohTracking();
					state.mainState = MainStates.TRAVEL_TO_BANK;
					return;
				}
				case 'Tablet': {
					if (bot.inventory.containsId(HOUSE_TAB_ID)) {
						logTravelToPoh(
							'Using Teleport to House tablet (Break).',
						);
						bot.inventory.interactWithIds(
							[HOUSE_TAB_ID],
							[HOUSE_TAB_BREAK_OPTION],
						);
						hasLoggedWaitingForTeleport = false;
						state.workflowStep = 1;
						return;
					}

					logError(
						'Settings selected Tablet, but no Teleport to House tablet is available. Transitioning to travel to bank.',
					);
					resetTravelToPohTracking();
					state.mainState = MainStates.TRAVEL_TO_BANK;
					return;
				}
			}

			return;
		}
		case 1: {
			if (regionId === OURANIA_DUNGEON_REGION_ID) {
				if (!hasLoggedWaitingForTeleport) {
					logTravelToPoh('Waiting for PoH teleport to complete.');
					hasLoggedWaitingForTeleport = true;
				}
				return;
			}

			hasLoggedWaitingForTeleport = false;
			logTravelToPoh(
				'PoH teleport detected. Looking for an available rejuvenation pool.',
			);
			startedLookingForPoolTick = state.gameTick;
			hasLoggedWaitingForPool = false;
			state.workflowStep = 2;
			return;
		}
		case 2: {
			const pohPool =
				bot.objects.getTileObjectsWithNames(POH_POOL_NAMES)[0];
			if (!pohPool) {
				if (!hasLoggedWaitingForPool) {
					logTravelToPoh(
						'Waiting for PoH pool objects to load after teleport.',
					);
					hasLoggedWaitingForPool = true;
				}

				if (
					startedLookingForPoolTick >= 0 &&
					state.gameTick - startedLookingForPoolTick >=
						POOL_SEARCH_GRACE_TICKS
				) {
					logError(
						`No supported PoH pool found after ${POOL_SEARCH_GRACE_TICKS} ticks. Expected one of: ${POH_POOL_NAMES.join(', ')}.`,
					);
				}
				return;
			}

			hasLoggedWaitingForPool = false;
			logTravelToPoh('Interacting with PoH pool for run restore.');
			bot.objects.interactSuppliedObject(pohPool, POOL_DRINK_OPTION);
			lastPoolClickTick = state.gameTick;
			hasLoggedWaitingForRunRestore = false;
			state.workflowStep = 3;
			return;
		}
		case 3: {
			const runEnergy = getRunEnergyPercent();
			if (runEnergy >= 100) {
				logTravelToPoh(
					'Run energy restored to 100% in PoH. Waiting one tick before transitioning.',
				);
				reachedFullRunTick = state.gameTick;
				state.workflowStep = 4;
				return;
			}

			if (!hasLoggedWaitingForRunRestore) {
				logTravelToPoh(
					`Waiting for PoH pool restore (current run energy ${runEnergy}%).`,
				);
				hasLoggedWaitingForRunRestore = true;
			}

			if (lastPoolClickTick < 0) {
				lastPoolClickTick = state.gameTick;
			}

			if (
				state.gameTick - lastPoolClickTick <
				POOL_INTERACT_RETRY_TICKS
			) {
				return;
			}

			const pohPool =
				bot.objects.getTileObjectsWithNames(POH_POOL_NAMES)[0];
			if (!pohPool) {
				logError(
					`Could not find PoH pool for retry. Expected one of: ${POH_POOL_NAMES.join(', ')}.`,
				);
				return;
			}

			logTravelToPoh(
				`Run energy still below 100% after ${POOL_INTERACT_RETRY_TICKS} ticks. Re-clicking pool.`,
			);
			bot.objects.interactSuppliedObject(pohPool, POOL_DRINK_OPTION);
			lastPoolClickTick = state.gameTick;
			return;
		}
		case 4: {
			if (reachedFullRunTick < 0) {
				reachedFullRunTick = state.gameTick;
			}

			if (
				state.gameTick - reachedFullRunTick <
				POST_RESTORE_DELAY_TICKS
			) {
				return;
			}

			logTravelToPoh(
				'Post-restore delay complete. Transitioning to travel to bank.',
			);
			resetTravelToPohTracking();
			state.mainState = MainStates.TRAVEL_TO_BANK;
			return;
		}
		default: {
			logError(
				`TravelToPoh: unexpected workflowStep ${state.workflowStep}. Resetting.`,
			);
			resetTravelToPohTracking();
			return;
		}
	}
};
