import { drawRoutePath } from '../../../imports/ui-functions.js';

export type Tile = {
	x: number;
	y: number;
	plane: number;
};

type BfsCache = {
	anchors: Tile[];
	path: Tile[];
	computedAtTick: number;
};

export type BfsRouteState = {
	cachedRoute: BfsCache | null;
	lastIssuedWaypointKey: string;
};

export type WalkRouteWithBfsOptions = {
	routeState: BfsRouteState;
	goalCenter: Tile;
	isGoalTile: (tile: Tile) => boolean;
	currentTick: number;
	onRouteBuilt?: (pathLength: number, anchorLength: number) => void;
	onRouteFailed?: () => void;
	onWaypointIssued?: (waypoint: Tile) => void;
};

const RECOMPUTE_INTERVAL_TICKS = 8;
const WAYPOINT_DISTANCE_STEP = 7;
const WAYPOINT_REACHED_DISTANCE = 2;
const PATH_MAX_EXPANSIONS = 5000;

const toTileKey = (tile: Tile): string => `${tile.x},${tile.y},${tile.plane}`;

export const toWorldPoint = (tile: Tile): net.runelite.api.coords.WorldPoint =>
	new net.runelite.api.coords.WorldPoint(tile.x, tile.y, tile.plane);

export const toWorldPoints = (
	tiles: Tile[],
): net.runelite.api.coords.WorldPoint[] =>
	tiles.map((tile) => toWorldPoint(tile));

export const createBfsRouteState = (): BfsRouteState => ({
	cachedRoute: null,
	lastIssuedWaypointKey: '',
});

const getPlayerTile = (): Tile | null => {
	const player = client.getLocalPlayer();
	if (!player) return null;

	const location = player.getWorldLocation();
	if (!location) return null;

	return {
		x: location.getX(),
		y: location.getY(),
		plane: location.getPlane(),
	};
};

const getRegionBounds = (
	regionId: number,
): {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
} => {
	const regionX = (regionId >> 8) * 64;
	const regionY = (regionId & 255) * 64;
	return {
		minX: regionX,
		maxX: regionX + 63,
		minY: regionY,
		maxY: regionY + 63,
	};
};

const getRegionIdForTile = (tile: Tile): number =>
	((tile.x >> 6) << 8) + (tile.y >> 6);

const isTileWithinRegionBounds = (
	tile: Tile,
	bounds: { minX: number; maxX: number; minY: number; maxY: number },
): boolean =>
	tile.x >= bounds.minX &&
	tile.x <= bounds.maxX &&
	tile.y >= bounds.minY &&
	tile.y <= bounds.maxY;

const isTileWalkable = (tile: Tile): boolean => {
	const topLevelWorldView = client.getTopLevelWorldView();
	if (!topLevelWorldView) return true;

	const worldView = client.getWorldView(topLevelWorldView.getId());
	if (!worldView) return true;

	const collisionMaps = worldView.getCollisionMaps?.();
	if (!collisionMaps) return true;

	if (tile.plane < 0 || tile.plane >= collisionMaps.length) return false;
	const collisionData = collisionMaps[tile.plane];
	if (!collisionData || typeof collisionData.getFlags !== 'function') {
		return true;
	}

	const localPoint = net.runelite.api.coords.LocalPoint.fromWorld(
		worldView,
		toWorldPoint(tile),
	);

	// Outside loaded scene. Keep tile considered walkable so pathing works across draw distances.
	if (!localPoint) return true;

	const sceneX = localPoint.getSceneX?.();
	const sceneY = localPoint.getSceneY?.();
	if (
		typeof sceneX !== 'number' ||
		typeof sceneY !== 'number' ||
		sceneX < 0 ||
		sceneY < 0 ||
		sceneX >= 104 ||
		sceneY >= 104
	) {
		return true;
	}

	const flags = collisionData.getFlags();
	if (!flags) return true;

	const row = flags[sceneX];
	if (!row || typeof row !== 'object') return true;

	const tileFlag = Number(row[sceneY] ?? 0);
	const BLOCK_MOVEMENT_OBJECT = 256;
	const BLOCK_MOVEMENT_FLOOR_DECORATION = 262144;
	const BLOCK_MOVEMENT_FLOOR = 2097152;

	const blockedByObject = (tileFlag & BLOCK_MOVEMENT_OBJECT) !== 0;
	const blockedByDecoration =
		(tileFlag & BLOCK_MOVEMENT_FLOOR_DECORATION) !== 0;
	const blockedByFloor = (tileFlag & BLOCK_MOVEMENT_FLOOR) !== 0;

	return !(blockedByObject || blockedByDecoration || blockedByFloor);
};

const buildDirections = (
	from: Tile,
	goalCenter: Tile,
): Array<[number, number]> => {
	const directions: Array<[number, number]> = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
		[1, 1],
		[1, -1],
		[-1, 1],
		[-1, -1],
	];

	directions.sort((a, b) => {
		const tileA = {
			x: from.x + a[0],
			y: from.y + a[1],
			plane: from.plane,
		};
		const tileB = {
			x: from.x + b[0],
			y: from.y + b[1],
			plane: from.plane,
		};
		const distributionA =
			Math.abs(tileA.x - goalCenter.x) + Math.abs(tileA.y - goalCenter.y);
		const distributionB =
			Math.abs(tileB.x - goalCenter.x) + Math.abs(tileB.y - goalCenter.y);
		return distributionA - distributionB;
	});

	return directions;
};

const reconstructPath = (
	parents: Map<string, string>,
	endTile: Tile,
	tileByKey: Map<string, Tile>,
): Tile[] => {
	const path: Tile[] = [];
	let key: string | null = toTileKey(endTile);

	while (key) {
		const tile = tileByKey.get(key);
		if (!tile) break;
		path.push(tile);
		key = parents.get(key) ?? null;
	}

	path.reverse();
	return path;
};

const compressPathToAnchors = (path: Tile[]): Tile[] => {
	if (path.length <= 2) return [...path];

	const anchors: Tile[] = [path[0]];
	let lastDirection: [number, number] | null = null;
	let lastAnchorIndex = 0;

	for (let index = 1; index < path.length; index++) {
		const previous = path[index - 1];
		const current = path[index];
		const direction: [number, number] = [
			Math.sign(current.x - previous.x),
			Math.sign(current.y - previous.y),
		];

		const directionChanged =
			lastDirection !== null &&
			(direction[0] !== lastDirection[0] ||
				direction[1] !== lastDirection[1]);
		const distanceFromAnchor =
			Math.max(
				Math.abs(current.x - path[lastAnchorIndex].x),
				Math.abs(current.y - path[lastAnchorIndex].y),
			) >= WAYPOINT_DISTANCE_STEP;
		const isLastTile = index === path.length - 1;

		if (directionChanged || distanceFromAnchor || isLastTile) {
			anchors.push(current);
			lastAnchorIndex = index;
		}

		lastDirection = direction;
	}

	return anchors;
};

const findBfsPath = (
	startTile: Tile,
	goalCenter: Tile,
	isGoalTile: (tile: Tile) => boolean,
): Tile[] => {
	const regionId = getRegionIdForTile(startTile);
	const regionBounds = getRegionBounds(regionId);

	const queue: Tile[] = [startTile];
	const visited = new Set<string>([toTileKey(startTile)]);
	const parents = new Map<string, string>();
	const tileByKey = new Map<string, Tile>([
		[toTileKey(startTile), startTile],
	]);

	let endTile: Tile | null = null;
	let expansions = 0;

	while (queue.length > 0 && expansions < PATH_MAX_EXPANSIONS) {
		const current = queue.shift();
		if (!current) break;

		if (isGoalTile(current)) {
			endTile = current;
			break;
		}

		expansions += 1;
		const directions = buildDirections(current, goalCenter);
		for (const [dx, dy] of directions) {
			const nextTile: Tile = {
				x: current.x + dx,
				y: current.y + dy,
				plane: current.plane,
			};

			if (!isTileWithinRegionBounds(nextTile, regionBounds)) continue;
			if (!isTileWalkable(nextTile)) continue;

			const nextKey = toTileKey(nextTile);
			if (visited.has(nextKey)) continue;

			visited.add(nextKey);
			tileByKey.set(nextKey, nextTile);
			parents.set(nextKey, toTileKey(current));
			queue.push(nextTile);
		}
	}

	if (!endTile) return [];
	return reconstructPath(parents, endTile, tileByKey);
};

const getNextAnchor = (anchors: Tile[], playerTile: Tile): Tile | null => {
	for (const anchor of anchors) {
		const distance = Math.max(
			Math.abs(anchor.x - playerTile.x),
			Math.abs(anchor.y - playerTile.y),
		);
		if (distance > WAYPOINT_REACHED_DISTANCE) {
			return anchor;
		}
	}

	return null;
};

const shouldRecomputeRoute = (
	routeState: BfsRouteState,
	playerTile: Tile,
	currentTick: number,
): boolean => {
	if (!routeState.cachedRoute) return true;
	if (
		currentTick - routeState.cachedRoute.computedAtTick >=
		RECOMPUTE_INTERVAL_TICKS
	) {
		return true;
	}

	const nearKnownPath = routeState.cachedRoute.path.some(
		(tile) =>
			Math.max(
				Math.abs(tile.x - playerTile.x),
				Math.abs(tile.y - playerTile.y),
			) <= 8,
	);

	return !nearKnownPath;
};

const resetRouteState = (routeState: BfsRouteState): void => {
	routeState.cachedRoute = null;
	routeState.lastIssuedWaypointKey = '';
};

export const walkRouteWithBfs = (options: WalkRouteWithBfsOptions): boolean => {
	const playerTile = getPlayerTile();
	if (!playerTile) return false;

	if (options.isGoalTile(playerTile)) {
		resetRouteState(options.routeState);
		return true;
	}

	if (
		shouldRecomputeRoute(
			options.routeState,
			playerTile,
			options.currentTick,
		)
	) {
		const path = findBfsPath(
			playerTile,
			options.goalCenter,
			options.isGoalTile,
		);
		if (path.length === 0) {
			options.onRouteFailed?.();
			return false;
		}

		const anchors = compressPathToAnchors(path);
		options.routeState.cachedRoute = {
			anchors,
			path,
			computedAtTick: options.currentTick,
		};
		options.onRouteBuilt?.(path.length, anchors.length);
	}

	if (!options.routeState.cachedRoute) return false;

	const nextAnchor = getNextAnchor(
		options.routeState.cachedRoute.anchors,
		playerTile,
	);
	if (!nextAnchor) return false;

	const waypointKey = toTileKey(nextAnchor);
	if (waypointKey !== options.routeState.lastIssuedWaypointKey) {
		bot.walking.walkToTrueWorldPoint(nextAnchor.x, nextAnchor.y);
		options.routeState.lastIssuedWaypointKey = waypointKey;
		options.onWaypointIssued?.(nextAnchor);
	}

	return false;
};

export const drawBfsRoute = (
	graphics: java.awt.Graphics2D,
	routeState: BfsRouteState,
): void => {
	if (!routeState.cachedRoute || routeState.cachedRoute.path.length < 2)
		return;
	drawRoutePath(graphics, toWorldPoints(routeState.cachedRoute.path));
};
