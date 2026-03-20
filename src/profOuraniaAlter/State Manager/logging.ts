import { LOG_COLOR as SHARED_LOG_COLOR } from '../../imports/logger.js';

type RGB = {
	r: number;
	g: number;
	b: number;
};

const LOG_COLOR = {
	SCRIPT: SHARED_LOG_COLOR.BLUE as RGB,
	STATE: SHARED_LOG_COLOR.GOLD as RGB,
	TRAVEL_OURANIA: SHARED_LOG_COLOR.CORAL as RGB,
	INTERACT_OURANIA: SHARED_LOG_COLOR.TEAL as RGB,
	TRAVEL_PRAYER: SHARED_LOG_COLOR.GRAY as RGB,
	SWAP_MAGE_BOOK: SHARED_LOG_COLOR.BLUE as RGB,
	USE_PRAYER_ALTAR: SHARED_LOG_COLOR.EMERALD as RGB,
	TRAVEL_BANK: SHARED_LOG_COLOR.CORAL as RGB,
	INTERACT_BANK: SHARED_LOG_COLOR.EMERALD as RGB,
	ERROR: SHARED_LOG_COLOR.PINK as RGB,
	SUCCESS: SHARED_LOG_COLOR.EMERALD as RGB,
};

let lastLoggedMessage: string = '';

const logMessage = (source: string, message: string, color: RGB): void => {
	const fullMessage = `[${source}] ${message}`;
	if (fullMessage === lastLoggedMessage) return;
	lastLoggedMessage = fullMessage;
	log.printRGB(fullMessage, color.r, color.g, color.b);
};

export const logOuraniaAlter = (message: string): void => {
	logMessage('ourania-alter', message, LOG_COLOR.SCRIPT);
};

export const logScript = (message: string): void => {
	logOuraniaAlter(message);
};

export const logState = (message: string): void => {
	logMessage('state', message, LOG_COLOR.STATE);
};

export const logTravelToOuraniaAltar = (message: string): void => {
	logMessage('travel-ourania-altar', message, LOG_COLOR.TRAVEL_OURANIA);
};

export const logInteractWithOuraniaAltar = (message: string): void => {
	logMessage('interact-ourania-altar', message, LOG_COLOR.INTERACT_OURANIA);
};

export const logTravelToPrayerAltar = (message: string): void => {
	logMessage('travel-prayer-altar', message, LOG_COLOR.TRAVEL_PRAYER);
};

export const logSwapMageBook = (message: string): void => {
	logMessage('swap-mage-book', message, LOG_COLOR.SWAP_MAGE_BOOK);
};

export const logUsePrayerAltar = (message: string): void => {
	logMessage('use-prayer-altar', message, LOG_COLOR.USE_PRAYER_ALTAR);
};

export const logTravelToBank = (message: string): void => {
	logMessage('travel-bank', message, LOG_COLOR.TRAVEL_BANK);
};

export const logInteractWithBank = (message: string): void => {
	logMessage('interact-bank', message, LOG_COLOR.INTERACT_BANK);
};

export const logError = (message: string): void => {
	logMessage('error', message, LOG_COLOR.ERROR);
};

export const logSuccess = (message: string): void => {
	logMessage('success', message, LOG_COLOR.SUCCESS);
};
