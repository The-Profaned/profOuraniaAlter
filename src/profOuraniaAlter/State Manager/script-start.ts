import { MainStates, state } from './script-state.js';
import { WORLD_POINTS } from './constants.js';
import { logError } from './logging.js';

const SPELLBOOK_VARBIT_ID = 4070;
const LUNAR_SPELLBOOK_VALUE = 2;
const STARTUP_VERIFY_AT_BANK_WORKFLOW_STEP = 98;
const STARTUP_WEBWALK_TO_BANK_WORKFLOW_STEP = 99;

const isOnLunarSpellbook = (): boolean =>
	client.getVarbitValue(SPELLBOOK_VARBIT_ID) === LUNAR_SPELLBOOK_VALUE;

export const determineScriptStartLocationState = (): void => {
	const localPlayer = client.getLocalPlayer();
	if (!localPlayer) return;

	const playerLocation = localPlayer.getWorldLocation();
	if (!playerLocation) return;

	if (!isOnLunarSpellbook()) {
		const lunarRequirementMessage =
			'Script start blocked: Lunar spellbook is required. Switch to Lunar spellbook, then restart the script.';
		logError(lunarRequirementMessage);
		log.printGameMessage(lunarRequirementMessage);
		state.mainState = MainStates.IDLE;
		bot.terminate();
		return;
	}

	const inBankArea = WORLD_POINTS.bankArea.contains(playerLocation);
	if (inBankArea) {
		state.workflowStep = STARTUP_VERIFY_AT_BANK_WORKFLOW_STEP;
		state.mainState = MainStates.INTERACT_WITH_BANK;
		return;
	}

	state.workflowStep = STARTUP_WEBWALK_TO_BANK_WORKFLOW_STEP;
	state.mainState = MainStates.TRAVEL_TO_BANK;
};
