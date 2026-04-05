import { logOuraniaAlter } from './State Manager/logging.js';
import { stateManager } from './State Manager/state-manager.js';
import { state } from './State Manager/script-state.js';
import {
	onTemplateEnd,
	onTemplateStart,
} from './ui-boiler-plate/ourania-ui.js';
import {
	onOverlayEnd,
	onOverlayStart,
	onOverlayTick,
} from './ui-boiler-plate/ourania-overlay.js';
export function onStart(): void {
	state.gameTick = 0;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	onTemplateStart();
	onOverlayStart();
	logOuraniaAlter(`${state.scriptName} started.`);
}

export function onGameTick(): void {
	state.gameTick += 1;
	onOverlayTick();
	if (!state.uiCompleted) return;
	stateManager();
}

export function onEnd(): void {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	onTemplateEnd();
	onOverlayEnd();
	logOuraniaAlter(`${state.scriptName} ended.`);
}
