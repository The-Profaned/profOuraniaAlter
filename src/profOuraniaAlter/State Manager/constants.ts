export const SCRIPT_NAME: string = 'profOuraniaAlter';
export const DEFAULT_STATE: string = 'TRAVEL_TO_OURANIA_ALTAR';
export const BANK_SUBSTATE_REFILL_RUNES: string = 'REFILL_BANK_RUNES';
export const BANKING_RUNE_MINIMUM_THRESHOLD: number = 40;

// Set to false to completely hide the Debug tab and re-enable normal start sync.
export const LOAD_DEBUG_UI_TAB: boolean = true;

export const OURANIA_DUNGEON_REGION_ID: number = 12119;

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
	ouraniaAltar: new net.runelite.api.coords.WorldArea(3054, 5573, 13, 12, 0),
	bankArea: new net.runelite.api.coords.WorldArea(3010, 5621, 11, 10, 0),
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

// VarBit for Kingdom Divided quest completion (required for Vile Vigour)
export const KINGDOM_DIVIDED_VARBIT: number = 0; // THIS NUMBER IS A PLACEHOLDER

// VarBit for Desert Amulet unlock/availability (required for Desert Amulet option)
export const DESERT_AMULET_VARBIT: number = 0; // THIS NUMBER IS A PLACEHOLDER

// Runecrafting pouch level requirements
export const RUNECRAFTING_POUCH_LEVELS = {
	SMALL: 1,
	MEDIUM: 25,
	LARGE: 50,
	GIANT: 75,
	COLOSSAL: 25,
} as const;

// Runecrafting pouch item IDs (normal + degraded).
// Small pouch does not degrade.
export const POUCH_ITEM_IDS = {
	SMALL: { normal: 5509, degraded: undefined },
	MEDIUM: { normal: 5510, degraded: 5511 },
	LARGE: { normal: 5512, degraded: 5513 },
	GIANT: { normal: 5514, degraded: 5515 },
	COLOSSAL: { normal: 26784, degraded: 26786 },
} as const;

// NPC Contact dialog options for pouch repair via Dark Mage
export const NPC_CONTACT_DIALOG = {
	repairPouchesOption: 'Can you repair my pouches?',
} as const;

// ============ TEST MODE (EASY TO DELETE) ============
export const TEST_MODE_ENABLED: boolean = true;
// ====================================================
