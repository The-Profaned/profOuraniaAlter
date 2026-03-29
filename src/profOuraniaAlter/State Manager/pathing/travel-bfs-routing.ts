import { WORLD_POINTS } from '../constants.js';
import { state } from '../script-state.js';
import {
	createBfsRouteState,
	type Tile,
	toWorldPoint,
	walkRouteWithBfs,
} from './bfs-pathing.js';

const bankRouteState = createBfsRouteState();
const prayerAltarRouteState = createBfsRouteState();
const desertRouteState = createBfsRouteState();

const BANK_GOAL_CENTER: Tile = {
	x: 3015,
	y: 5625,
	plane: 0,
};

const isInsideBankArea = (tile: Tile): boolean =>
	WORLD_POINTS.bankArea.contains(toWorldPoint(tile));

export const walkToBankWithBfs = (): boolean =>
	walkRouteWithBfs({
		routeState: bankRouteState,
		goalCenter: BANK_GOAL_CENTER,
		isGoalTile: isInsideBankArea,
		currentTick: state.gameTick,
	});

// Per-state route placeholders for future location tuning.
export const walkToPrayerAltarWithBfs = (
	goalCenter: Tile,
	isGoalTile: (tile: Tile) => boolean,
): boolean =>
	walkRouteWithBfs({
		routeState: prayerAltarRouteState,
		goalCenter,
		isGoalTile,
		currentTick: state.gameTick,
	});

export const walkToDesertWithBfs = (
	goalCenter: Tile,
	isGoalTile: (tile: Tile) => boolean,
): boolean =>
	walkRouteWithBfs({
		routeState: desertRouteState,
		goalCenter,
		isGoalTile,
		currentTick: state.gameTick,
	});
