import { WORLD_POINTS } from '../constants.js';
import { state } from '../script-state.js';
import { logTravelToOuraniaAltar } from '../logging.js';
import {
	createBfsRouteState,
	drawBfsRoute,
	type Tile,
	toWorldPoint,
	walkRouteWithBfs,
} from './bfs-pathing.js';

const runWalkRouteWithBfs: (options: {
	routeState: ReturnType<typeof createBfsRouteState>;
	goalCenter: Tile;
	isGoalTile: (tile: Tile) => boolean;
	currentTick: number;
	onRouteBuilt?: (pathLength: number, anchorLength: number) => void;
	onRouteFailed?: () => void;
	onWaypointIssued?: (waypoint: Tile) => void;
}) => boolean = walkRouteWithBfs;

const runDrawBfsRoute: (
	graphics: java.awt.Graphics2D,
	routeState: ReturnType<typeof createBfsRouteState>,
) => void = drawBfsRoute;

const ouraniaAltarRouteState = createBfsRouteState();

const OURANIA_ALTAR_GOAL_CENTER: Tile = {
	x: 3060,
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
		onRouteBuilt: (pathLength: number, anchorLength: number) => {
			logTravelToOuraniaAltar(
				`BFS route built with ${pathLength} tiles and ${anchorLength} anchor points.`,
			);
		},
		onWaypointIssued: (waypoint: Tile) => {
			logTravelToOuraniaAltar(
				`Walking to BFS anchor (${waypoint.x}, ${waypoint.y}, ${waypoint.plane}).`,
			);
		},
	});

	return reachedGoal;
};

export const drawOuraniaBfsRoute = (graphics: java.awt.Graphics2D): void => {
	runDrawBfsRoute(graphics, ouraniaAltarRouteState);
};
