import { MainStates, state } from '../script-state.js';
import { logError, logUsePrayerAltar } from '../logging.js';
import { INTERACTIONS, OBJECT_IDS, OBJECT_NAMES } from '../constants.js';

const MIN_RECLICK_TICKS = 3;
const MAX_RECLICK_TICKS = 4;

let nextPrayerAltarClickTick = 0;

export const UsePrayerAltar = (): void => {
	logUsePrayerAltar('Using prayer altar.');

	const currentPrayer: number = client.getBoostedSkillLevel(
		net.runelite.api.Skill.PRAYER,
	);
	const maxPrayer: number = client.getRealSkillLevel(
		net.runelite.api.Skill.PRAYER,
	);

	if (currentPrayer >= maxPrayer) {
		logUsePrayerAltar(
			`Prayer is full (${currentPrayer}/${maxPrayer}). Transitioning to travel to bank.`,
		);
		nextPrayerAltarClickTick = 0;
		state.mainState = MainStates.TRAVEL_TO_BANK;
		return;
	}

	if (state.gameTick < nextPrayerAltarClickTick) {
		return;
	}

	const prayerAltar = bot.objects.getTileObjectsWithIds([
		OBJECT_IDS.prayerAltar,
	])[0];

	if (!prayerAltar) {
		logError(
			`Prayer altar not found: ${OBJECT_NAMES.prayerAltar} (id=${OBJECT_IDS.prayerAltar}).`,
		);
		return;
	}

	logUsePrayerAltar(
		`Prayer not full (${currentPrayer}/${maxPrayer}). Clicking ${OBJECT_NAMES.prayerAltar}.`,
	);

	bot.objects.interactSuppliedObject(prayerAltar, INTERACTIONS.prayAtAltar);

	const reclickDelay: number =
		MIN_RECLICK_TICKS +
		Math.floor(Math.random() * (MAX_RECLICK_TICKS - MIN_RECLICK_TICKS + 1));
	nextPrayerAltarClickTick = state.gameTick + reclickDelay;
};
