// imports
import { handleFailure } from './general-function.js';
import { LOG_COLOR_PINK, logger } from './logger.js';
import { timeoutManager } from './timeout-manager.js';
import { State } from './types.js';

// Location-related utility functions

// Convert array of coordinates to WorldPoint
export const coordsToWP = ([x, y, z]: [
	number,
	number,
	number,
]): net.runelite.api.coords.WorldPoint =>
	new net.runelite.api.coords.WorldPoint(x, y, z);

// Get distance from local player to WorldPoint
export const localPlayerDistributionFromWP = (
	worldPoint: net.runelite.api.coords.WorldPoint,
): number => client.getLocalPlayer().getWorldLocation().distanceTo(worldPoint);

// Check if player is near WorldPoint within tile threshold
export const isPlayerNearWP = (
	worldPoint: net.runelite.api.coords.WorldPoint,
	tileThreshold: number = 5,
): boolean => localPlayerDistributionFromWP(worldPoint) <= tileThreshold;

// Check if player is within specified area bounds
export const isPlayerInArea = (
	state: State,
	minX: number,
	maxX: number,
	minY: number,
	maxY: number,
	plane?: number,
): boolean => {
	const player = client.getLocalPlayer();
	if (!player) {
		logger(state, 'debug', 'isPlayerInArea', 'Player not found');
		return false;
	}

	const location = player.getWorldLocation();
	const x = location.getX();
	const y = location.getY();
	const currentPlane = location.getPlane();

	const inBounds = x >= minX && x <= maxX && y >= minY && y <= maxY;
	const onPlane = plane === undefined || currentPlane === plane;

	return inBounds && onPlane;
};

// Web walk to WorldPoint with timeout
export const wWalkTimeout = (
	state: State,
	worldPoint: net.runelite.api.coords.WorldPoint,
	targetDescription: string,
	maxWait: number,
	targetDistance: number = 5,
): boolean => {
	// Web walk to WorldPoint with timeout
	const isPlayerAtLocation = () => isPlayerNearWP(worldPoint, targetDistance);
	if (!isPlayerAtLocation() && !bot.walking.isWebWalking()) {
		logger(
			state,
			'all',
			'wWalkTimeout',
			`Web walking to ${targetDescription}`,
		);
		bot.walking.webWalkStart(worldPoint);
		timeoutManager.add({
			state,
			conditionFunction: () => isPlayerAtLocation(),
			maxWait,
			onFail: () =>
				// Handle failure if player does not reach location in time
				handleFailure(
					state,
					'wWalkTimeout',
					`Unable to locate player at ${targetDescription} after ${maxWait} ticks.`,
				),
		});
		return false;
	}
	logger(
		state,
		'debug',
		'wWalkTimeout',
		`Player is at ${targetDescription}.`,
	);
	return true;
};

// Convert instance coordinates to true world coordinates
export function getWorldPoint(
	worldpoint: net.runelite.api.coords.WorldPoint,
): net.runelite.api.coords.WorldPoint | null {
	// Null safety checks for client views (may not be ready during startup)
	const topLevelView = client.getTopLevelWorldView();
	if (!topLevelView) {
		return worldpoint;
	}

	const worldView = client.getWorldView(topLevelView.getId());
	if (!worldView) {
		return worldpoint;
	}

	const inInstance = worldView.isInstance();
	if (inInstance) {
		const localPoint = net.runelite.api.coords.LocalPoint.fromWorld(
			worldView,
			worldpoint,
		);
		if (localPoint) {
			return net.runelite.api.coords.WorldPoint.fromLocalInstance(
				client,
				localPoint,
			);
		}
		return null;
	}
	return worldpoint;
}

// Toggle collision debugging logs on/off - set to true to enable getInstancePoint logging
const ENABLE_COLLISION_LOGGING = false;

// Convert true world coordinates to instance coordinates using proper API
export function getInstancePoint(
	trueWorldPoint: net.runelite.api.coords.WorldPoint,
): net.runelite.api.coords.WorldPoint | null {
	// Null safety checks for client views
	const topLevelView = client.getTopLevelWorldView();
	if (!topLevelView) {
		return null;
	}

	const worldView = client.getWorldView(topLevelView.getId());
	if (!worldView) {
		return null;
	}

	const inInstance = worldView.isInstance();
	if (!inInstance) {
		// Not in instance, use tile as-is
		return trueWorldPoint;
	}

	// In instance - use WorldPoint.toLocalInstance() to get where the true world tile appears
	// This returns Collection<WorldPoint> of tile occurrences in the instance
	const instanceOccurrences =
		net.runelite.api.coords.WorldPoint.toLocalInstance(
			worldView,
			trueWorldPoint,
		);

	if (!instanceOccurrences || instanceOccurrences.size() === 0) {
		// Tile does not appear in this instance
		if (typeof log !== 'undefined' && ENABLE_COLLISION_LOGGING) {
			logger(
				undefined,
				'debug',
				'getInstancePoint',
				`[getInstancePoint] True world (${trueWorldPoint.getX()}, ${trueWorldPoint.getY()}) -> no instance occurrence`,
				LOG_COLOR_PINK,
			);
		}
		return null;
	}

	// Get the first occurrence (typically only one per instance)
	const iterator = instanceOccurrences.iterator();
	const instanceTile = iterator.next();

	if (typeof log !== 'undefined' && ENABLE_COLLISION_LOGGING) {
		logger(
			undefined,
			'debug',
			'getInstancePoint',
			`[getInstancePoint] True world (${trueWorldPoint.getX()}, ${trueWorldPoint.getY()}) -> instance occurrence (${instanceTile.getX()}, ${instanceTile.getY()})`,
		);
	}

	return instanceTile;
}
