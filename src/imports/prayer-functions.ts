// imports
import { logger } from './logger.js';
import { State } from './types.js';

// Prayer shorthands
export const prayers = {
	protMelee: net.runelite.api.Prayer.PROTECT_FROM_MELEE,
	protMage: net.runelite.api.Prayer.PROTECT_FROM_MAGIC,
	protRange: net.runelite.api.Prayer.PROTECT_FROM_MISSILES,
	piety: net.runelite.api.Prayer.PIETY,
	eagleEye: net.runelite.api.Prayer.EAGLE_EYE,
	rigour: net.runelite.api.Prayer.RIGOUR,
	mysticMight: net.runelite.api.Prayer.MYSTIC_MIGHT,
	augury: net.runelite.api.Prayer.AUGURY,
	redemption: net.runelite.api.Prayer.REDEMPTION,
	smite: net.runelite.api.Prayer.SMITE,
};

const pendingPrayerTicks = new Map<keyof typeof prayers, number>();

// Check if specified prayer is currently active
export const checkPrayer = (
	state: State,
	prayerKey: keyof typeof prayers,
): boolean => {
	void state;
	const prayer = prayers[prayerKey];
	if (!prayer) {
		return false;
	}
	return client.isPrayerActive(prayer);
};

// Activate specified prayer
export const togglePrayer = (
	state: State,
	prayerKey: keyof typeof prayers,
): boolean => {
	const prayer = prayers[prayerKey];
	if (!prayer) {
		logger(
			state,
			'debug',
			'togglePrayer',
			`Unknown prayer key: ${prayerKey}`,
		);
		return false;
	}

	// If prayer is already active, no need to toggle
	if (client.isPrayerActive(prayer)) {
		pendingPrayerTicks.delete(prayerKey);
		return true;
	}

	const currentTick = state.gameTick;
	const lastRequestedTick = pendingPrayerTicks.get(prayerKey);

	// Only apply cooldown if prayer is NOT active and was recently requested
	// This prevents spam while allowing retries if prayer failed to activate
	if (
		typeof lastRequestedTick === 'number' &&
		currentTick - lastRequestedTick <= 1
	) {
		// Check if prayer actually activated since last request
		if (client.isPrayerActive(prayer)) {
			pendingPrayerTicks.delete(prayerKey);
			return true;
		}
		// Prayer still not active but within cooldown - allow one more retry
		logger(
			state,
			'debug',
			'togglePrayer',
			`${prayerKey} not active after ${currentTick - lastRequestedTick} tick(s), retrying`,
		);
	}

	pendingPrayerTicks.set(prayerKey, currentTick);
	bot.prayer.togglePrayer(prayer, false);
	const nowActive = client.isPrayerActive(prayer);
	if (nowActive) {
		pendingPrayerTicks.delete(prayerKey);
		logger(state, 'debug', 'togglePrayer', `${prayerKey} activated`);
	} else {
		logger(
			state,
			'debug',
			'togglePrayer',
			`${prayerKey} activation requested (state pending)`,
		);
	}
	return nowActive;
};

// Get the currently active protection prayer
export const getActivePrayer = (state: State): keyof typeof prayers | null => {
	const protectionPrayers: Array<keyof typeof prayers> = [
		'protMage',
		'protRange',
		'protMelee',
	];

	for (const prayer of protectionPrayers) {
		if (checkPrayer(state, prayer)) {
			logger(
				state,
				'debug',
				'getActivePrayer',
				`Active prayer: ${prayer}`,
			);
			return prayer;
		}
	}

	logger(state, 'debug', 'getActivePrayer', 'No active protection prayer');
	return null;
};
