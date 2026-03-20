import { logger } from './logger.js';
import type { State } from './types.js';

type SailWorldPointFloats = {
	x: number;
	y: number;
	plane: number;
};

//#region Sailing function wrappers with logging
export function convertToMainWorld(
	state: State,
	boatWorldPoint: net.runelite.api.coords.WorldPoint,
): net.runelite.api.coords.WorldPoint | null {
	const mainWorldPoint = bot.sailing.convertToMainWorld(
		boatWorldPoint,
	) as net.runelite.api.coords.WorldPoint | null;
	logger(state, 'debug', 'sailing.convertToMainWorld', 'Converted point.');
	return mainWorldPoint;
}

export function getBoatAngle(state: State): number {
	const angle = bot.sailing.getBoatAngle();
	logger(state, 'debug', 'sailing.getBoatAngle', `Angle: ${angle}`);
	return angle;
}

export function getBoatHeading(state: State): number {
	const heading = bot.sailing.getBoatHeading();
	logger(state, 'debug', 'sailing.getBoatHeading', `Heading: ${heading}`);
	return heading;
}

export function getBoatMainWorldLocation(
	state: State,
): net.runelite.api.coords.WorldPoint | null {
	const location =
		bot.sailing.getBoatMainWorldLocation() as net.runelite.api.coords.WorldPoint | null;
	logger(
		state,
		'debug',
		'sailing.getBoatMainWorldLocation',
		`Location: ${location ? `${location.getX()},${location.getY()}` : 'null'}`,
	);
	return location;
}

export function getBoatMainWorldLocationFloats(
	state: State,
): SailWorldPointFloats | null {
	const rawLocation = bot.sailing.getBoatMainWorldLocationFloats();
	const location: SailWorldPointFloats | null =
		rawLocation && Array.isArray(rawLocation)
			? { x: rawLocation[0], y: rawLocation[1], plane: rawLocation[2] }
			: null;
	const message = location
		? `Location: ${location.x},${location.y},${location.plane}`
		: 'Location: null';
	logger(state, 'debug', 'sailing.getBoatMainWorldLocationFloats', message);
	return location;
}

export function getMovementSpeed(state: State): number {
	const speed = bot.sailing.getMovementSpeed();
	logger(state, 'debug', 'sailing.getMovementSpeed', `Speed: ${speed}`);
	return speed;
}

export function getPlayerMainWorldLocation(
	state: State,
): net.runelite.api.coords.WorldPoint | null {
	const location =
		bot.sailing.getPlayerMainWorldLocation() as net.runelite.api.coords.WorldPoint | null;
	logger(
		state,
		'debug',
		'sailing.getPlayerMainWorldLocation',
		`Location: ${location ? `${location.getX()},${location.getY()}` : 'null'}`,
	);
	return location;
}

export function isBoatMoving(state: State): boolean {
	const result = bot.sailing.isBoatMoving();
	logger(state, 'debug', 'sailing.isBoatMoving', `Moving: ${result}`);
	return result;
}

export function isOnBoat(state: State): boolean {
	const result = bot.sailing.isOnBoat();
	logger(state, 'debug', 'sailing.isOnBoat', `On boat: ${result}`);
	return result;
}

export function isReversing(state: State): boolean {
	const result = bot.sailing.isReversing();
	logger(state, 'debug', 'sailing.isReversing', `Reversing: ${result}`);
	return result;
}

export function isSailingControlsAvailable(state: State): boolean {
	const result = bot.sailing.isSailingControlsAvailable();
	logger(
		state,
		'debug',
		'sailing.isSailingControlsAvailable',
		`Controls available: ${result}`,
	);
	return result;
}

export function isSailsSet(state: State): boolean {
	const result = bot.sailing.isSailsSet();
	logger(state, 'debug', 'sailing.isSailsSet', `Sails set: ${result}`);
	return result;
}

export function lowerSpeed(state: State): void {
	bot.sailing.lowerSpeed();
	logger(state, 'debug', 'sailing.lowerSpeed', 'Lowered speed.');
}

export function raiseSpeed(state: State): void {
	bot.sailing.raiseSpeed();
	logger(state, 'debug', 'sailing.raiseSpeed', 'Raised speed.');
}

export function reverseBoat(state: State): void {
	bot.sailing.reverse();
	logger(state, 'debug', 'sailing.reverse', 'Reversing.');
}

export function setHeading(state: State, direction: number): void {
	bot.sailing.setHeading(direction);
	logger(state, 'debug', 'sailing.setHeading', `Heading: ${direction}`);
}

export function setSails(state: State): void {
	bot.sailing.setSails();
	logger(state, 'debug', 'sailing.setSails', 'Sails set.');
}

export function setSailsObject(state: State): void {
	bot.sailing.setSailsObject();
	logger(state, 'debug', 'sailing.setSailsObject', 'Sails object set.');
}

export function stopBoat(state: State): void {
	bot.sailing.stopBoat();
	logger(state, 'debug', 'sailing.stopBoat', 'Stopped boat.');
}

export function unsetSails(state: State): void {
	bot.sailing.unsetSails();
	logger(state, 'debug', 'sailing.unsetSails', 'Sails unset.');
}

export function fullSpeed(state: State): void {
	setSails(state);
}
//#endregion
