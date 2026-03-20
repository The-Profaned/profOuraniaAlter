import { logOuraniaAlter } from './State Manager/logging.js';
import { stateManager } from './State Manager/state-manager.js';
import { state } from './State Manager/script-state.js';
import { onUiEnd, onUiStart } from './ui.js';

export function onStart(): void {
	state.gameTick = 0;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	onUiStart();
	logOuraniaAlter(`${state.scriptName} started.`);
}

export function onGameTick(): void {
	state.gameTick += 1;
	if (!state.uiCompleted) return;
	stateManager();
}

export function onEnd(): void {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	onUiEnd();
	logOuraniaAlter(`${state.scriptName} ended.`);
}
