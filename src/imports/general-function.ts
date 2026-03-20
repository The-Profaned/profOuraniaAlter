// imports
import { stateDebugger } from './debug-functions.js';
import { logger } from './logger.js';
import { timeoutManager } from './timeout-manager.js';
import { State } from './types.js';

// General utility functions

// Handle game tick events
export const gameTick = (state: State): boolean => {
	try {
		// Only log every tick if debugFullState is enabled (causes lag if on)
		if (state.debugEnabled && state.debugFullState) {
			logger(
				state,
				'debug',
				'onGameTick',
				`Script game tick ${state.gameTick} ----------------`,
			);
			stateDebugger(state);
		}
		state.gameTick++;
		if (state.timeout > 0) {
			state.timeout--;
			return false;
		}
		timeoutManager.tick();
		if (timeoutManager.isWaiting()) return false;
	} catch (error) {
		const fatalMessage = (error as Error).toString();
		logger(state, 'all', 'Script', fatalMessage);
		handleFailure(state, 'gameTick', fatalMessage);
		return false;
	}
	return true;
};

// Handle failures and manage failure counts
export const onFailures = (
	state: State,
	failureLocation: string,
	failureMessage: string,
	failureResetState?: string,
): void => {
	const failureKey = `${failureLocation} - ${failureMessage}`;
	logger(state, 'debug', 'onFailures', failureMessage);
	if (!state.failureCounts) {
		state.failureCounts = {};
	}
	state.failureCounts[failureKey] =
		state.lastFailureKey === failureKey
			? (state.failureCounts[failureKey] || 1) + 1
			: 1;
	state.lastFailureKey = failureKey;
	state.failureOrigin = failureKey;

	if (state.failureCounts[failureKey] >= 3) {
		logger(
			state,
			'all',
			'Script',
			`Fatal error: "${failureKey}" occured 3x in a row.`,
		);
		bot.terminate();
		return;
	}
	if (failureResetState) state.mainState = failureResetState;
};

// Handle a failure occurrence
export const handleFailure = (
	state: State,
	failureLocation: string,
	failureMessage: string,
	failureResetState?: string,
): void => {
	onFailures(state, failureLocation, failureMessage, failureResetState);
};

// End the script gracefully
export const endScript = (state?: State | null): void => {
	bot.breakHandler.setBreakHandlerStatus(false);
	if (state?.scriptName) {
		log.printGameMessage(`Termination of ${state.scriptName}.`);
	} else {
		log.printGameMessage('Termination of script.');
	}
	bot.walking.webWalkCancel();
	bot.events.unregisterAll();
};
