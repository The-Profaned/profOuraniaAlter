import { logScript } from './State Manager/logging.js';
import { stateManager } from './State Manager/state-manager.js';
import { state } from './State Manager/script-state.js';

export function onStart(): void {
	state.gameTick = 0;
	logScript(`${state.scriptName} started.`);
}

export function onGameTick(): void {
	state.gameTick += 1;
	stateManager();
}

export function onEnd(): void {
	logScript(`${state.scriptName} ended.`);
}
