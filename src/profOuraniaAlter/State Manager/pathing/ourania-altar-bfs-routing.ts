import { WORLD_POINTS } from '../constants.js';
import { state } from '../script-state.js';
import { logTravelToOuraniaAltar } from '../logging.js';
import {
	createBfsRouteState,
	type Tile,
	toWorldPoint,
	walkRouteWithBfs,
} from './bfs-pathing.js';

const runWalkRouteWithBfs: (options: {
	routeState: ReturnType<typeof createBfsRouteState>;
	goalCenter: Tile;
	isGoalTile: (tile: Tile) => boolean;
	currentTick: number;
	onRouteBuilt?: () => void;
	onRouteFailed?: () => void;
	onDestinationSet?: (destination: Tile) => void;
}) => boolean = walkRouteWithBfs;

const ouraniaAltarRouteState = createBfsRouteState();

const OURANIA_ALTAR_GOAL_CENTER: Tile = {
	x: 3058,
	y: 5579,
	plane: 0,
};

const isInsideOuraniaAltarArea = (tile: Tile): boolean =>
	WORLD_POINTS.ouraniaAltar.contains(toWorldPoint(tile));

export const walkToOuraniaAltarWithBfs = (): boolean => {
	const reachedGoal = runWalkRouteWithBfs({
		routeState: ouraniaAltarRouteState,
		goalCenter: OURANIA_ALTAR_GOAL_CENTER,
		isGoalTile: isInsideOuraniaAltarArea,
		currentTick: state.gameTick,
		onRouteFailed: () => {
			logTravelToOuraniaAltar(
				'BFS pathing failed to find route to Ourania altar area this tick.',
			);
		},
		onDestinationSet: (destination: Tile) => {
			logTravelToOuraniaAltar(
				`Traveling to Ourania altar, path set to (${destination.x}, ${destination.y}).`,
			);
		},
	});

	return reachedGoal;
};
