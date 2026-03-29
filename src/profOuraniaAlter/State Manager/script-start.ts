import { MainStates, state } from './script-state.js';
import {
	OURANIA_DUNGEON_REGION_ID,
	RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD,
	WORLD_POINTS,
} from './constants.js';

const getRunEnergyPercent = (): number => {
	const rawRunEnergy = Number(client.getEnergy());
	return rawRunEnergy > 100 ? Math.floor(rawRunEnergy / 100) : rawRunEnergy;
};

const hasCraftingInventoryReady = (): boolean =>
	bot.inventory.containsAnyIds([
		net.runelite.api.ItemID.PURE_ESSENCE,
		net.runelite.api.ItemID.DAEYALT_ESSENCE,
	]);

const getRegionIdFromLocation = (
	location: net.runelite.api.coords.WorldPoint,
): number => ((location.getX() >> 6) << 8) + (location.getY() >> 6);

export const determineScriptStartLocationState = (): void => {
	const localPlayer = client.getLocalPlayer();
	if (!localPlayer) return;

	const playerLocation = localPlayer.getWorldLocation();
	if (!playerLocation) return;

	const regionId = getRegionIdFromLocation(playerLocation);
	if (regionId !== OURANIA_DUNGEON_REGION_ID) return;

	const inBankArea = WORLD_POINTS.bankArea.contains(playerLocation);
	if (inBankArea) {
		state.mainState = hasCraftingInventoryReady()
			? MainStates.TRAVEL_TO_OURANIA_ALTAR
			: MainStates.INTERACT_WITH_BANK;
		return;
	}

	const inOuraniaAltarArea =
		WORLD_POINTS.ouraniaAltar.contains(playerLocation);
	if (inOuraniaAltarArea) {
		if (hasCraftingInventoryReady()) {
			state.mainState = MainStates.INTERACT_WITH_OURANIA_ALTAR;
			return;
		}

		state.mainState =
			getRunEnergyPercent() >= RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD
				? MainStates.TRAVEL_TO_BANK
				: MainStates.TRAVEL_TO_PRAYER_ALTAR;
		return;
	}

	// Inside the dungeon but between key zones: either running to altar or handling post-craft exit.
	if (hasCraftingInventoryReady()) {
		state.mainState = MainStates.TRAVEL_TO_OURANIA_ALTAR;
		return;
	}

	if (getRunEnergyPercent() >= RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD) {
		state.mainState = MainStates.TRAVEL_TO_BANK;
		return;
	}

	state.mainState = MainStates.TRAVEL_TO_PRAYER_ALTAR;
};
