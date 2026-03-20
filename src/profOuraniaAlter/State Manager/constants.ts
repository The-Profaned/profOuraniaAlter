export const SCRIPT_NAME: string = 'profOuraniaAlter';
export const DEFAULT_STATE: string = 'TRAVEL_TO_OURANIA_ALTAR';

const TARGETS = {
	banker: {
		name: 'Eniola',
		npcId: 8132,
		action: 'Bank',
	},
	ouraniaAltar: {
		name: 'Alter',
		objectId: 29631,
		action: 'Craft-rune',
	},
	prayerAltar: {
		name: 'Chaos alter',
		objectId: 411,
		action: 'Pray-at',
	},
	ladder: {
		name: 'Ladder',
		objectId: 29635,
		action: 'Climb',
	},
} as const;

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
	ouraniaAltar: TARGETS.ouraniaAltar.objectId,
	prayerAltar: TARGETS.prayerAltar.objectId,
	ladder: TARGETS.ladder.objectId,
} as const;

export const NPC_IDS = {
	banker: TARGETS.banker.npcId,
} as const;

export const OBJECT_NAMES = {
	ouraniaAltar: TARGETS.ouraniaAltar.name,
	prayerAltar: TARGETS.prayerAltar.name,
	ladder: TARGETS.ladder.name,
} as const;

export const NPC_NAMES = {
	banker: TARGETS.banker.name,
} as const;

export const INTERACTIONS = {
	useAltar: TARGETS.ouraniaAltar.action,
	prayAtAltar: TARGETS.prayerAltar.action,
	climb: TARGETS.ladder.action,
	bank: TARGETS.banker.action,
} as const;

// If current run energy is at or above this %, route directly to bank.
// If below this %, route to prayer altar first.
export const RUN_ENERGY_ROUTE_TO_BANK_THRESHOLD: number = 50;
