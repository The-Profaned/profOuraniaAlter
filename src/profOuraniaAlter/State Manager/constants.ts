export const SCRIPT_NAME: string = 'profOuraniaAlter';
export const DEFAULT_STATE: string = 'TRAVEL_TO_OURANIA_ALTAR';

export const WORLD_POINTS = {
	ouraniaAltar: new net.runelite.api.coords.WorldArea(0, 0, 1, 1, 0),
	prayerAltar: {
		x: 0,
		y: 0,
		plane: 0,
	},
	ladderTop: {
		x: 0,
		y: 0,
		plane: 0,
	},
	ladderBottom: {
		x: 0,
		y: 0,
		plane: 0,
	},
	bankArea: new net.runelite.api.coords.WorldArea(0, 0, 1, 1, 0),
} as const;

export const OBJECT_IDS = {
	ouraniaAltar: 0,
	prayerAltar: 0,
	ladder: 0,
	bankBooth: 0,
	bankChest: 0,
} as const;

export const NPC_IDS = {
	banker: 0,
} as const;

export const INTERACTIONS = {
	useAltar: 'Craft-rune',
	prayAtAltar: 'Pray-at',
	climbDown: 'Climb-down',
	bank: 'Bank',
} as const;

// If current run energy is at or above this %, route directly to bank.
// If below this %, route to prayer altar first.
export const RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD: number = 50;
