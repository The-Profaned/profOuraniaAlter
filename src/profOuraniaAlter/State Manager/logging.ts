import { LOG_COLOR } from '../../imports/logger.js';
import { SCRIPT_NAME } from './constants.js';

const ENABLE_SCRIPT_LOGGING: boolean = true;
const ENABLE_STATE_LOGGING: boolean = true;

let lastLoggedMessage: string = '';

const logMessage = (
	source: string,
	message: string,
	color: typeof LOG_COLOR.BLUE,
): void => {
	const fullMessage: string = `[${source}] ${message}`;
	if (fullMessage === lastLoggedMessage) return;
	lastLoggedMessage = fullMessage;
	log.printRGB(fullMessage, color.r, color.g, color.b);
};

export const logScript = (message: string): void => {
	if (!ENABLE_SCRIPT_LOGGING) return;
	logMessage(SCRIPT_NAME, message, LOG_COLOR.BLUE);
};

export const logState = (message: string): void => {
	if (!ENABLE_STATE_LOGGING) return;
	logMessage('state', message, LOG_COLOR.GOLD);
};
