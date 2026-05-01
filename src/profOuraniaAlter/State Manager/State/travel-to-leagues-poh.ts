// LEAGUES_POH_START - Temporary feature for Leagues game mode. Remove when leagues ends.
// This file implements the Leagues PoH travel flow: house teleport -> portal to Ourania -> travel to bank.
// Ignores run energy (always 100% in leagues).

import { MainStates, state } from '../script-state.js';
import { logError, logTravelToLeaguesPoh } from '../logging.js';
import {
	OURANIA_DUNGEON_REGION_ID,
	OURANIA_TELEPORT_REGION_ID,
} from '../constants.js';

const CONSTRUCTION_CAPE_IDS: number[] = [
	net.runelite.api.ItemID.CONSTRUCT_CAPE,
	net.runelite.api.ItemID.CONSTRUCT_CAPET,
];
const HOUSE_TAB_ID = net.runelite.api.ItemID.TELEPORT_TO_HOUSE;
const HOUSE_TAB_BREAK_OPTION = 'Break';
const PORTAL_MENU_OPTIONS: string[] = ['Ourania altar', 'Teleport'];
const PORTAL_NEXUS_ITEM_IDS: number[] = [
	net.runelite.api.ItemID.MARBLE_PORTAL_NEXUS,
	net.runelite.api.ItemID.GILDED_PORTAL_NEXUS,
	net.runelite.api.ItemID.CRYSTALLINE_PORTAL_NEXUS,
];
const PORTAL_OBJECT_IDS: number[] = [
	60801, // Teak Portal (Ourania)
	60804, // Mahogany Portal (Ourania)
	60807, // Marble Portal (Ourania)
	60810, // Raging Echoes Portal (Ourania)
];

let hasLoggedTravelStart = false;
let hasLoggedWaitingForHouseTeleport = false;
let hasLoggedWaitingForOuraniaArrival = false;

const getRegionIdFromLocation = (
	location: net.runelite.api.coords.WorldPoint,
): number => ((location.getX() >> 6) << 8) + (location.getY() >> 6);

const resetLeaguesPohTracking = (): void => {
	hasLoggedTravelStart = false;
	hasLoggedWaitingForHouseTeleport = false;
	hasLoggedWaitingForOuraniaArrival = false;
	state.workflowStep = 0;
};

const hasConstructionCapeInInventoryOrEquipment = (): boolean =>
	CONSTRUCTION_CAPE_IDS.some(
		(itemId) =>
			bot.inventory.containsId(itemId) ||
			bot.equipment.containsId(itemId),
	);

const tryUseConstructionCapeHouseTeleport = (): boolean => {
	const inventoryCapeId =
		CONSTRUCTION_CAPE_IDS.find((itemId) =>
			bot.inventory.containsId(itemId),
		) ?? null;
	if (inventoryCapeId !== null) {
		logTravelToLeaguesPoh(
			'Using Construction cape from inventory to teleport to house.',
		);
		bot.inventory.interactWithIds([inventoryCapeId], ['Teleport to POH']);
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

	logTravelToLeaguesPoh(
		'Using Construction cape from equipment to teleport to house.',
	);
	equipmentApi.interactWithIds([equippedCapeId], ['Teleport to POH']);
	return true;
};

const tryUseHouseTeleport = (): boolean => {
	switch (state.settings.pohAccessOption) {
		case 'Construction Cape': {
			if (!hasConstructionCapeInInventoryOrEquipment()) {
				logError(
					'No Construction Cape available for house teleport in Leagues PoH.',
				);
				return false;
			}
			return tryUseConstructionCapeHouseTeleport();
		}
		case 'Tablet': {
			if (bot.inventory.containsId(HOUSE_TAB_ID)) {
				logTravelToLeaguesPoh(
					'Using Teleport to House tablet (Break).',
				);
				bot.inventory.interactWithIds(
					[HOUSE_TAB_ID],
					[HOUSE_TAB_BREAK_OPTION],
				);
				return true;
			}
			logError(
				'No Teleport to House tablet found for Leagues PoH route.',
			);
			return false;
		}
		case 'Spellbook': {
			try {
				logTravelToLeaguesPoh(
					'Using normal spellbook Teleport to House for Leagues PoH.',
				);
				bot.magic.cast('TELEPORT_TO_HOUSE', 0);
				return true;
			} catch (error) {
				logError(
					`Teleport to House cast failed for Leagues PoH: ${String(error)}`,
				);
				return false;
			}
		}
		default: {
			logError('Unsupported PoH access option for Leagues PoH.');
			return false;
		}
	}
};

const tryUseOuraniaPortal = (): boolean => {
	const nexusId = PORTAL_NEXUS_ITEM_IDS.find((itemId) =>
		bot.inventory.containsId(itemId),
	);
	if (nexusId) {
		logTravelToLeaguesPoh(
			'Using portal nexus to teleport to Ourania altar.',
		);
		bot.inventory.interactWithIds([nexusId], PORTAL_MENU_OPTIONS);
		return true;
	}

	const portalObject =
		bot.objects.getTileObjectsWithIds(PORTAL_OBJECT_IDS)[0];
	if (portalObject) {
		logTravelToLeaguesPoh(
			'Using portal object to teleport to Ourania altar.',
		);
		bot.objects.interactSuppliedObject(portalObject, 'Enter');
		return true;
	}

	logError('No portal nexus or portal object found for Leagues PoH route.');
	return false;
};

export const TravelToLeaguesPoh = (): void => {
	if (!hasLoggedTravelStart) {
		logTravelToLeaguesPoh('Traveling to Leagues PoH route.');
		hasLoggedTravelStart = true;
	}

	const player = client.getLocalPlayer();
	if (!player) return;

	const playerLocation = player.getWorldLocation();
	if (!playerLocation) return;

	const regionId = getRegionIdFromLocation(playerLocation);

	switch (state.workflowStep) {
		case 0: {
			if (!tryUseHouseTeleport()) {
				resetLeaguesPohTracking();
				state.mainState = MainStates.TRAVEL_TO_BANK;
				return;
			}

			hasLoggedWaitingForHouseTeleport = false;
			state.workflowStep = 1;
			return;
		}
		case 1: {
			if (regionId === OURANIA_DUNGEON_REGION_ID) {
				if (!hasLoggedWaitingForHouseTeleport) {
					logTravelToLeaguesPoh(
						'Waiting for house teleport to complete.',
					);
					hasLoggedWaitingForHouseTeleport = true;
				}
				return;
			}

			hasLoggedWaitingForHouseTeleport = false;
			state.workflowStep = 2;
			return;
		}
		case 2: {
			if (!tryUseOuraniaPortal()) {
				resetLeaguesPohTracking();
				state.mainState = MainStates.TRAVEL_TO_BANK;
				return;
			}

			state.workflowStep = 3;
			return;
		}
		case 3: {
			if (regionId !== OURANIA_TELEPORT_REGION_ID) {
				if (!hasLoggedWaitingForOuraniaArrival) {
					logTravelToLeaguesPoh(
						'Waiting for arrival at Ourania after portal teleport.',
					);
					hasLoggedWaitingForOuraniaArrival = true;
				}
				return;
			}

			hasLoggedWaitingForOuraniaArrival = false;
			logTravelToLeaguesPoh(
				'Arrived at Ourania dungeon. Transitioning to travel to bank.',
			);
			resetLeaguesPohTracking();
			state.mainState = MainStates.TRAVEL_TO_BANK;
			return;
		}
		default: {
			logError(
				`TravelToLeaguesPoh: unexpected workflowStep ${state.workflowStep}. Resetting.`,
			);
			resetLeaguesPohTracking();
			return;
		}
	}
};

// LEAGUES_POH_END - End of temporary Leagues PoH feature.
