// imports
import type { State } from './types.js';

// Logger function to log messages based on type and state settings
export type LogColor = {
	r: number;
	g: number;
	b: number;
};

// Predefined log colors
//./images/color pallate.png
export const LOG_COLOR_GRAY: LogColor = { r: 128, g: 128, b: 128 };
export const LOG_COLOR_PINK: LogColor = { r: 239, g: 71, b: 111 };
export const LOG_COLOR_CORAL: LogColor = { r: 247, g: 140, b: 107 };
export const LOG_COLOR_GOLD: LogColor = { r: 255, g: 209, b: 102 };
export const LOG_COLOR_EMERALD: LogColor = { r: 6, g: 214, b: 160 };
export const LOG_COLOR_BLUE: LogColor = { r: 17, g: 138, b: 178 };
export const LOG_COLOR_TEAL: LogColor = { r: 7, g: 59, b: 76 };

export const LOG_COLOR_DEFAULT: LogColor = LOG_COLOR_GRAY;

export const LOG_COLOR = {
	GRAY: LOG_COLOR_GRAY,
	PINK: LOG_COLOR_PINK,
	CORAL: LOG_COLOR_CORAL,
	GOLD: LOG_COLOR_GOLD,
	EMERALD: LOG_COLOR_EMERALD,
	BLUE: LOG_COLOR_BLUE,
	TEAL: LOG_COLOR_TEAL,
	DEFAULT: LOG_COLOR_DEFAULT,
} as const;

const includesAny = (text: string, keywords: readonly string[]): boolean =>
	keywords.some((keyword) => text.includes(keyword));

const DANGER_KEYWORDS = [
	'danger',
	'dangerous',
	'fatal',
	'error',
	'failed',
	'failure',
	'timeout',
	'dead',
	'death',
	'low hp',
	'critical',
] as const;

const NPC_ACTION_KEYWORDS = [
	'npc',
	'projectile',
	'animation',
	'despawn',
	'spawn',
] as const;

const STATE_KEYWORDS = [
	'state',
	'substate',
	'phase',
	'transition',
	'entering',
	'exiting',
	'resume',
	'resuming',
	'initialize',
	'initialized',
	'start',
	'started',
	'end',
	'ended',
] as const;

const PLAYER_ACTION_KEYWORDS = [
	'attack',
	'attacking',
	'prayer',
	'walk',
	'walking',
	'move',
	'moving',
	'webwalk',
	'eat',
	'eating',
	'drink',
	'drinking',
	'equip',
	'unequip',
	'cast',
	'bank',
	'withdraw',
	'deposit',
	'loot',
] as const;

const SYSTEM_KEYWORDS = [
	'debug',
	'cache',
	'snapshot',
	'poll',
	'tracking',
	'tick',
	'status',
	'queue',
	'path',
	'waypoint',
	'distance',
	'timer',
] as const;

const classifyLogColor = (source: string, message: string): LogColor => {
	const text = `${source} ${message}`.toLowerCase();
	if (includesAny(text, DANGER_KEYWORDS)) return LOG_COLOR_PINK;
	if (includesAny(text, STATE_KEYWORDS)) return LOG_COLOR_GOLD;
	if (includesAny(text, NPC_ACTION_KEYWORDS)) return LOG_COLOR_CORAL;
	if (includesAny(text, PLAYER_ACTION_KEYWORDS)) return LOG_COLOR_EMERALD;
	if (includesAny(text, SYSTEM_KEYWORDS)) return LOG_COLOR_TEAL;
	return LOG_COLOR_BLUE;
};

export const logger = (
	state: State | null | undefined,
	type: 'all' | 'debug',
	source: string,
	message: string, // Logs type + source of the message + the message itself
	color?: LogColor,
): void => {
	const logMessage = `[${source}] ${message}`;
	const printToLog = (): void => {
		const chosenColor = color ?? classifyLogColor(source, message);
		log.printRGB(logMessage, chosenColor.r, chosenColor.g, chosenColor.b);
	};
	if (type === 'all') log.printGameMessage(logMessage); // Always log 'all' messages to game chat
	if (!state) {
		if (type === 'all') {
			printToLog();
		}
		return;
	}
	if (type === 'all' || (type === 'debug' && state.debugEnabled)) {
		printToLog(); // Log 'debug' messages to log only if debug is enabled in state
		if (state && typeof state === 'object') {
			state.lastLoggedSource = source;
		}
	}
};
