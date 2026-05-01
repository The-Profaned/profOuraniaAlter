import type { State } from '../../imports/types.js';
import { SCRIPT_NAME, DEFAULT_STATE } from './constants.js';

export type RuneOption =
	| 'Air'
	| 'Water'
	| 'Earth'
	| 'Fire'
	| 'Mind'
	| 'Dust'
	| 'Cosmic'
	| 'Astral'
	| 'Law'
	| 'Soul';

export type RuneSelectionOption = RuneOption | 'na';

export type RunRestoreOption =
	| 'No Restore'
	| 'Stamina Potions'
	| 'PoH'
	// LEAGUES_POH_START
	| 'Leagues PoH'
	// LEAGUES_POH_END
	| 'Vile Vigour'
	| 'Desert Amulet';

export type PohAccessOption = 'Tablet' | 'Construction Cape' | 'Spellbook';

export type EmergencyFoodOption =
	| 'Tuna'
	| 'Lobster'
	| 'Bass'
	| 'Swordfish'
	| 'Karambwan'
	| 'Manta Ray'
	| 'Shark'
	| 'Monkfish'
	| 'Sea turtle'
	| 'Anglerfish';

export type StandardPouchKey = 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';

export type PouchKey = StandardPouchKey | 'COLOSSAL';

export type AltarPlanMode = 'NONE' | 'COLOSSAL_ONLY' | 'STANDARD';

export type AltarQueuedActionType = 'EMPTY_POUCH' | 'CRAFT_ALTAR';

export type AltarQueuedAction = {
	executeTick: number;
	actionType: AltarQueuedActionType;
	pouchKey: PouchKey | null;
};

export enum MainStates {
	TRAVEL_TO_OURANIA_ALTAR = 'TRAVEL_TO_OURANIA_ALTAR',
	INTERACT_WITH_OURANIA_ALTAR = 'INTERACT_WITH_OURANIA_ALTAR',
	TRAVEL_TO_PRAYER_ALTAR = 'TRAVEL_TO_PRAYER_ALTAR',
	TRAVEL_TO_POH = 'TRAVEL_TO_POH',
	// LEAGUES_POH_START
	TRAVEL_TO_LEAGUES_POH = 'TRAVEL_TO_LEAGUES_POH',
	// LEAGUES_POH_END
	TRAVEL_TO_DESERT = 'TRAVEL_TO_DESERT',
	SWAP_MAGE_BOOK = 'SWAP_MAGE_BOOK',
	USE_PRAYER_ALTAR = 'USE_PRAYER_ALTAR',
	TRAVEL_TO_BANK = 'TRAVEL_TO_BANK',
	INTERACT_WITH_BANK = 'INTERACT_WITH_BANK',
	REPAIR_POUCHES = 'REPAIR_POUCHES',
	IDLE = 'IDLE',
}

export type OuraniaAlterScriptState = State & {
	mainState: MainStates;
	lastLoggedMainState: MainStates | null;
	workflowStep: number;
	debugTab: {
		forcedMainState: MainStates;
		forceStateOnStart: boolean;
	};
	settings: {
		runesForBanking: RuneOption;
		emergencyFoodOption: EmergencyFoodOption;
		pohAccessOption: PohAccessOption;
		runePouchEnabled: boolean;
		divinePouchEnabled: boolean;
		runeSelection1: RuneSelectionOption;
		runeSelection2: RuneSelectionOption;
		runeSelection3: RuneSelectionOption;
		runeSelection4: RuneSelectionOption;
	};
	behaviour: {
		runRestoreOption: RunRestoreOption;
		emergencyFoodEnabled: boolean;
		useColossalPouch: boolean;
		useSmallPouch: boolean;
		useMediumPouch: boolean;
		useLargePouch: boolean;
		useGiantPouch: boolean;
	};
	pouchState: {
		/** True when at least one enabled, degradable pouch is degraded and needs repair. */
		needsRepair: boolean;
		/** The state to return to after REPAIR_POUCHES completes. */
		returnState: MainStates;
		runePouchRuntime: {
			slotCount: number;
			lastUpdatedTick: number;
			allRunesMatchSelection: boolean;
			allSlotsHaveQuantity: boolean;
			readyForConfiguredRunes: boolean;
			bankingRune: {
				rune: RuneOption;
				pouchAmount: number;
				inventoryAmount: number;
				totalAmount: number;
				meetsMinimum: boolean;
			};
			slots: {
				slot: number;
				expectedRune: RuneSelectionOption;
				actualRune: RuneSelectionOption;
				amount: number;
				runeMatchesSelection: boolean;
				hasQuantity: boolean;
			}[];
		};
	};
	altarState: {
		configSignature: string;
		mode: AltarPlanMode;
		colossalExpectedFill: number;
		colossalEmptiedTotal: number;
		colossalRemainingFill: number;
		remainingStandardPouches: StandardPouchKey[];
		currentBatch: StandardPouchKey[];
		currentPouchIndex: number;
		queuedActions: AltarQueuedAction[];
		awaitingCraftVerification: boolean;
		lastRunecraftXp: number;
		lastQueuedCraftTick: number;
		craftVerificationRetries: number;
		colossalNoXpCycles: number;
	};
};

const getRunEnergyPercent = (): number => {
	const rawRunEnergy = Number(client.getEnergy());
	return rawRunEnergy > 100 ? Math.floor(rawRunEnergy / 100) : rawRunEnergy;
};

/**
 * Returns the post-crafting route based on the selected run restore option and
 * current resource levels.
 */
export const getRunRestoreTargetState = (): MainStates => {
	const runEnergyPercent = getRunEnergyPercent();
	const missingRunEnergy = 100 - runEnergyPercent;
	const currentPrayerPoints = client.getBoostedSkillLevel(
		net.runelite.api.Skill.PRAYER,
	);

	switch (state.behaviour.runRestoreOption) {
		case 'No Restore':
		case 'Stamina Potions': {
			return MainStates.TRAVEL_TO_BANK;
		}
		case 'PoH': {
			return runEnergyPercent <= 25
				? MainStates.TRAVEL_TO_POH
				: MainStates.TRAVEL_TO_BANK;
		}
		// LEAGUES_POH_START
		case 'Leagues PoH': {
			return MainStates.TRAVEL_TO_LEAGUES_POH;
		}
		// LEAGUES_POH_END
		case 'Vile Vigour': {
			return runEnergyPercent < 25 ||
				missingRunEnergy >= currentPrayerPoints
				? MainStates.TRAVEL_TO_PRAYER_ALTAR
				: MainStates.TRAVEL_TO_BANK;
		}
		case 'Desert Amulet': {
			return runEnergyPercent <= 25
				? MainStates.TRAVEL_TO_DESERT
				: MainStates.TRAVEL_TO_BANK;
		}
		default: {
			return MainStates.TRAVEL_TO_BANK;
		}
	}
};

export const state: OuraniaAlterScriptState = {
	debugEnabled: true,
	debugFullState: false,
	failureCounts: {},
	failureOrigin: '',
	lastFailureKey: '',
	mainState: MainStates.TRAVEL_TO_OURANIA_ALTAR,
	scriptInitalized: false,
	scriptName: SCRIPT_NAME,
	uiCompleted: false,
	timeout: 0,
	gameTick: 0,
	subState: DEFAULT_STATE,
	lastLoggedMainState: null,
	workflowStep: 0,
	debugTab: {
		forcedMainState: MainStates.TRAVEL_TO_OURANIA_ALTAR,
		forceStateOnStart: true,
	},
	settings: {
		runesForBanking: 'Air',
		emergencyFoodOption: 'Lobster',
		pohAccessOption: 'Tablet',
		runePouchEnabled: false,
		divinePouchEnabled: false,
		runeSelection1: 'na',
		runeSelection2: 'na',
		runeSelection3: 'na',
		runeSelection4: 'na',
	},
	behaviour: {
		runRestoreOption: 'No Restore',
		emergencyFoodEnabled: false,
		useColossalPouch: true,
		useSmallPouch: false,
		useMediumPouch: false,
		useLargePouch: false,
		useGiantPouch: false,
	},
	pouchState: {
		needsRepair: false,
		returnState: MainStates.INTERACT_WITH_BANK,
		runePouchRuntime: {
			slotCount: 0,
			lastUpdatedTick: 0,
			allRunesMatchSelection: false,
			allSlotsHaveQuantity: false,
			readyForConfiguredRunes: false,
			bankingRune: {
				rune: 'Air',
				pouchAmount: 0,
				inventoryAmount: 0,
				totalAmount: 0,
				meetsMinimum: false,
			},
			slots: [],
		},
	},
	altarState: {
		configSignature: '',
		mode: 'NONE',
		colossalExpectedFill: 0,
		colossalEmptiedTotal: 0,
		colossalRemainingFill: 0,
		remainingStandardPouches: [],
		currentBatch: [],
		currentPouchIndex: 0,
		queuedActions: [],
		awaitingCraftVerification: false,
		lastRunecraftXp: 0,
		lastQueuedCraftTick: -1,
		craftVerificationRetries: 0,
		colossalNoXpCycles: 0,
	},
};
