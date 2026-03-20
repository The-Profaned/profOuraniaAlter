/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { LOG_COLOR_TEAL, logger } from './logger.js';
import { getWorldPoint, getInstancePoint } from './location-functions.js';
import { tileSets } from './tile-sets.js';
import { State } from './types.js';

// Toggle collision debugging logs on/off - set to true to enable all tile collision logging
const ENABLE_COLLISION_LOGGING = false;

// Dangerous tile standing log controls
// Master toggle: false = completely off
const ENABLE_DANGEROUS_TILE_LOGGING = true;
// Throttle toggle: true = at most once every DANGEROUS_TILE_LOG_INTERVAL_TICKS
const ENABLE_DANGEROUS_TILE_THROTTLE = true;
const DANGEROUS_TILE_LOG_INTERVAL_TICKS = 5;
let lastDangerousTileLogTick = -DANGEROUS_TILE_LOG_INTERVAL_TICKS;

const shouldLogDangerousTile = (state: State): boolean => {
	if (!ENABLE_DANGEROUS_TILE_LOGGING) return false;
	if (!ENABLE_DANGEROUS_TILE_THROTTLE) return true;

	const ticksSinceLastDangerousTileLog =
		state.gameTick - lastDangerousTileLogTick;
	if (ticksSinceLastDangerousTileLog < DANGEROUS_TILE_LOG_INTERVAL_TICKS) {
		return false;
	}

	lastDangerousTileLogTick = state.gameTick;
	return true;
};

/**
 * Check if line of sight between two tiles is blocked by specific objects.
 * Uses Bresenham's line algorithm to check each tile along the path.
 */
export const isLineOfSightBlocked = (
	state: State,
	fromTile: net.runelite.api.coords.WorldPoint,
	toTile: net.runelite.api.coords.WorldPoint,
	blockingObjectIds: number[],
): boolean => {
	if (!bot?.objects || blockingObjectIds.length === 0) return false;

	const x0 = fromTile.getX();
	const y0 = fromTile.getY();
	const x1 = toTile.getX();
	const y1 = toTile.getY();

	// Bresenham's line algorithm to get all tiles between two points
	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx - dy;

	let x = x0;
	let y = y0;

	// Get all blocking objects once
	const blockingObjects =
		bot.objects.getTileObjectsWithIds(blockingObjectIds);
	if (!blockingObjects || blockingObjects.length === 0) return false;

	// Check each tile along the line (excluding start and end)
	while (x !== x1 || y !== y1) {
		// Check if any blocking object is on this tile
		for (const obj of blockingObjects) {
			if (!obj) continue;
			const objLoc = obj.getWorldLocation();
			const trueObjLoc = getWorldPoint(objLoc) ?? objLoc;

			// Skip checking the exact start and end tiles
			if ((x === x0 && y === y0) || (x === x1 && y === y1)) continue;

			if (trueObjLoc.getX() === x && trueObjLoc.getY() === y) {
				logger(
					state,
					'debug',
					'isLineOfSightBlocked',
					`LOS blocked at (${x}, ${y}) by object ${obj.getId()}`,
				);
				return true;
			}
		}

		const e2 = 2 * err;
		if (e2 > -dy) {
			err -= dy;
			x += sx;
		}
		if (e2 < dx) {
			err += dx;
			y += sy;
		}
	}

	return false;
};

// Tile object-related utility functions
export const getAction = (
	tileObjectID: number,
	actionIndexToGet: number,
): string | null => {
	const composition = bot.objects.getTileObjectComposition(tileObjectID);
	const actions = composition?.getActions?.();
	if (
		!actions ||
		actionIndexToGet < 0 ||
		actionIndexToGet >= actions.length
	) {
		return null;
	}
	return actions[actionIndexToGet];
};

// Get tile object with specific ID
export const getTileObjectWithID = (
	tileObjectId: number,
): any /* Replace with correct type if available */ => {
	const tileObjectIds = bot.objects.getTileObjectsWithIds([tileObjectId]);
	return tileObjectIds[0] ?? null;
};

// Return if tile object has specific name
export const validTileName = (
	tileObjectId: number,
	tileName: string,
): boolean =>
	bot.objects.getTileObjectComposition(tileObjectId).getName() === tileName;

// return dangerous tiles based on provided object IDs (converts from instance to true world coordinates)
export const getDangerousTiles = (
	tileObjectIds: number[],
	graphicsObjectIds: number[],
): net.runelite.api.coords.WorldPoint[] => {
	const dangerousLocations: net.runelite.api.coords.WorldPoint[] = [];

	// Early return if bot APIs not ready during startup
	if (!bot || !bot.objects || !bot.graphicsObjects) {
		return dangerousLocations;
	}

	// Get tile objects (persistent game objects like Boulders)
	if (tileObjectIds && tileObjectIds.length > 0) {
		const nearbyObjects = bot.objects.getTileObjectsWithIds(tileObjectIds);
		if (nearbyObjects && nearbyObjects.length > 0) {
			for (const obj of nearbyObjects) {
				if (!obj) continue;

				const objLoc = obj.getWorldLocation();
				const trueWorldPoint = getWorldPoint(objLoc) ?? objLoc;

				dangerousLocations.push(trueWorldPoint);
			}
		}
	}

	// Get graphics objects (temporary visual effects like falling rocks)
	if (graphicsObjectIds && graphicsObjectIds.length > 0) {
		const graphicsObjs = bot.graphicsObjects.getWithIds(graphicsObjectIds);
		if (graphicsObjs && graphicsObjs.length > 0) {
			for (const obj of graphicsObjs) {
				if (!obj) continue;

				const localPoint: net.runelite.api.coords.LocalPoint | null =
					obj.getLocation();
				if (!localPoint) continue;

				const worldPoint =
					net.runelite.api.coords.WorldPoint.fromLocalInstance(
						client,
						localPoint,
					);
				if (!worldPoint) continue;

				// Convert from instance to true world coordinates
				const trueWorldPoint = getWorldPoint(worldPoint) ?? worldPoint;

				dangerousLocations.push(trueWorldPoint);
			}
		}
	}

	return dangerousLocations;
};

// Check if a tile exists in a list of tiles
export const isInTileList = (
	tile: net.runelite.api.coords.WorldPoint,
	list: net.runelite.api.coords.WorldPoint[],
): boolean =>
	list.some(
		(t) =>
			t.getX() === tile.getX() &&
			t.getY() === tile.getY() &&
			t.getPlane() === tile.getPlane(),
	);

const isValidTileSetName = (
	name: string,
): name is 'leviSafeTiles' | 'leviDebrisTiles' =>
	name === 'leviSafeTiles' || name === 'leviDebrisTiles';

/**
 * Check if a tile is walkable using the collision map
 * Returns true if the tile has no collision (is walkable)
 */
const isTileWalkable = (
	tile: net.runelite.api.coords.WorldPoint,
	state?: State,
): boolean => {
	if (!client) {
		if (state && ENABLE_COLLISION_LOGGING) {
			logger(
				state,
				'debug',
				'isTileWalkable',
				`Client not available for tile (${tile.getX()}, ${tile.getY()})`,
				LOG_COLOR_TEAL,
			);
		}
		return true;
	}

	try {
		const worldView = client.getWorldView(
			client.getTopLevelWorldView()?.getId(),
		);
		if (!worldView) {
			if (state && ENABLE_COLLISION_LOGGING) {
				logger(
					state,
					'debug',
					'isTileWalkable',
					`WorldView not available for tile (${tile.getX()}, ${tile.getY()})`,
					LOG_COLOR_TEAL,
				);
			}
			return true;
		}

		const collisionMaps = worldView.getCollisionMaps?.();
		if (!collisionMaps) {
			if (state && ENABLE_COLLISION_LOGGING) {
				logger(
					state,
					'debug',
					'isTileWalkable',
					`CollisionMaps not available for tile (${tile.getX()}, ${tile.getY()})`,
					LOG_COLOR_TEAL,
				);
			}
			return true;
		}

		const plane = tile.getPlane();
		if (plane < 0 || plane >= collisionMaps.length) return true;

		const collisionData = collisionMaps[plane];
		if (!collisionData || typeof collisionData.getFlags !== 'function') {
			return true;
		}

		// Check if we're in an instanced location
		const isInInstance = worldView.isInstance?.();

		// Determine which tile to use for collision checking
		let tileForCollision = tile;
		if (isInInstance) {
			// If in instance, convert true world to instance coordinates for collision map
			const instanceTile = getInstancePoint(tile) ?? tile;
			tileForCollision = instanceTile;

			if (state && ENABLE_COLLISION_LOGGING) {
				logger(
					state,
					'debug',
					'isTileWalkable',
					`Instance: true world (${tile.getX()}, ${tile.getY()}) -> instance occurrence (${tileForCollision.getX()}, ${tileForCollision.getY()})`,
					LOG_COLOR_TEAL,
				);
			}
		} else {
			// Not in instance, use tile directly for collision check
			if (state && ENABLE_COLLISION_LOGGING) {
				logger(
					state,
					'debug',
					'isTileWalkable',
					`Non-instance: using true world tile (${tile.getX()}, ${tile.getY()}) directly`,
					LOG_COLOR_TEAL,
				);
			}
		}

		// Convert to LocalPoint to get scene coordinates (0-104 range for collision map)
		const localPoint = net.runelite.api.coords.LocalPoint.fromWorld(
			worldView,
			tileForCollision,
		);
		if (!localPoint) {
			// Tile is outside the loaded scene (can't check collision)
			// Return true (walkable) and rely on dangerous tiles list for blocking
			if (state && ENABLE_COLLISION_LOGGING) {
				logger(
					state,
					'debug',
					'isTileWalkable',
					`Tile (${tileForCollision.getX()}, ${tileForCollision.getY()}) could not convert to LocalPoint - outside scene, assuming walkable`,
					LOG_COLOR_TEAL,
				);
			}
			return true; // Outside scene = assume walkable, rely on dangerous tiles list
		}

		// Get scene coordinates from LocalPoint (these are in 0-104 range for collision map)
		const sceneX = localPoint.getSceneX?.();
		const sceneY = localPoint.getSceneY?.();

		if (state && ENABLE_COLLISION_LOGGING) {
			logger(
				state,
				'debug',
				'isTileWalkable',
				`True world (${tile.getX()}, ${tile.getY()}) -> instance (${tileForCollision.getX()}, ${tileForCollision.getY()}) -> LocalPoint/scene (${sceneX}, ${sceneY})`,
				LOG_COLOR_TEAL,
			);
		}

		if (
			typeof sceneX !== 'number' ||
			typeof sceneY !== 'number' ||
			sceneX < 0 ||
			sceneY < 0 ||
			sceneX >= 104 ||
			sceneY >= 104
		) {
			if (state && ENABLE_COLLISION_LOGGING) {
				logger(
					state,
					'debug',
					'isTileWalkable',
					`Scene coordinates out of bounds: sceneX=${sceneX}, sceneY=${sceneY} for tile (${tile.getX()}, ${tile.getY()})`,
					LOG_COLOR_TEAL,
				);
			}
			return true;
		}

		// Get collision flags - handle Java 2D array in Rhino
		const flags = collisionData.getFlags();
		if (!flags) {
			if (state && ENABLE_COLLISION_LOGGING) {
				logger(
					state,
					'debug',
					'isTileWalkable',
					`No collision flags available for tile (${tile.getX()}, ${tile.getY()})`,
					LOG_COLOR_TEAL,
				);
			}
			return true;
		}

		// Access 2D Java array in Rhino
		let tileFlag = 0;
		try {
			const row = flags[sceneX];
			if (row && typeof row === 'object') {
				tileFlag = row[sceneY] ?? 0;
			} else {
				if (state) {
					logger(
						state,
						'debug',
						'isTileWalkable',
						`Row is not an object at sceneX=${sceneX} for tile (${tile.getX()}, ${tile.getY()})`,
						LOG_COLOR_TEAL,
					);
				}
				return true;
			}
		} catch (error) {
			if (state && ENABLE_COLLISION_LOGGING) {
				logger(
					state,
					'debug',
					'isTileWalkable',
					`Error accessing collision flags: ${(error as Error).toString()}`,
					LOG_COLOR_TEAL,
				);
			}
			return true;
		}

		// Log the flag value to help debug
		if (state && ENABLE_COLLISION_LOGGING && tileFlag !== 0) {
			logger(
				state,
				'debug',
				'isTileWalkable',
				`Tile (${tile.getX()}, ${tile.getY()}) has collision flag: 0x${tileFlag.toString(16)} (${tileFlag})`,
				LOG_COLOR_TEAL,
			);
		}

		// Collision flags from CollisionDataFlag API
		// Check each movement type individually using bitwise AND
		const BLOCK_MOVEMENT_OBJECT = 0x100; // 256
		const BLOCK_MOVEMENT_FLOOR_DECORATION = 0x40000; // 262144
		const BLOCK_MOVEMENT_FLOOR = 0x200000; // 2097152
		const BLOCK_LINE_OF_SIGHT_FULL = 0x20000; // 131072

		// Check if each specific movement type flag is set
		const blockedByObject = (tileFlag & BLOCK_MOVEMENT_OBJECT) !== 0;
		const blockedByDecoration =
			(tileFlag & BLOCK_MOVEMENT_FLOOR_DECORATION) !== 0;
		const blockedByFloor = (tileFlag & BLOCK_MOVEMENT_FLOOR) !== 0;
		const blockedLineOfSight = (tileFlag & BLOCK_LINE_OF_SIGHT_FULL) !== 0;

		// Tile is blocked if any movement type flag is set
		const isBlocked =
			blockedByObject || blockedByDecoration || blockedByFloor;

		if (state && ENABLE_COLLISION_LOGGING && isBlocked) {
			const blockReason = [
				blockedByObject ? 'Object' : null,
				blockedByDecoration ? 'Decoration' : null,
				blockedByFloor ? 'Floor' : null,
				blockedLineOfSight ? 'LineOfSight' : null,
			]
				.filter((x): x is string => x !== null)
				.join(', ');

			logger(
				state,
				'debug',
				'isTileWalkable',
				`Tile (${tile.getX()}, ${tile.getY()}) sceneX=${sceneX} sceneY=${sceneY} flag=0x${tileFlag.toString(16)} blocked by: ${blockReason}`,
				LOG_COLOR_TEAL,
			);
		}

		return !isBlocked;
	} catch (error) {
		if (state && ENABLE_COLLISION_LOGGING) {
			logger(
				state,
				'debug',
				'isTileWalkable',
				`Outer catch error for tile (${tile.getX()}, ${tile.getY()}): ${(error as Error).toString()}`,
			);
		}
		return true;
	}
};

const getDistanceScope = (
	a: net.runelite.api.coords.WorldPoint,
	b: net.runelite.api.coords.WorldPoint,
): number =>
	Math.max(Math.abs(a.getX() - b.getX()), Math.abs(a.getY() - b.getY()));

export const getSafeTile = (
	state: State,
	searchRadius: number,
	tileObjectIds?: number[],
	graphicsObjectIds?: number[],
	safeTilesSetName?: string,
	dangerousTileCoordinates?: net.runelite.api.coords.WorldPoint[],
	preferredDistanceOptions?: {
		centerTile: net.runelite.api.coords.WorldPoint;
		preferredDistance: number;
		fallbackDistance?: number;
		preferCounterClockwise?: boolean;
	},
	neverSelectTiles?: net.runelite.api.coords.WorldPoint[],
	lineOfSightOptions?: {
		targetTile: net.runelite.api.coords.WorldPoint;
		blockingObjectIds: number[];
	},
): net.runelite.api.coords.WorldPoint | null => {
	logger(
		state,
		'debug',
		'getSafeTile',
		`Searching for safe tile within ${searchRadius} tiles.`,
	);

	const player = client.getLocalPlayer();
	if (!player) {
		logger(state, 'debug', 'getSafeTile', 'Player not found');
		return null;
	}

	const playerLoc = player.getWorldLocation();
	if (!playerLoc) {
		logger(state, 'debug', 'getSafeTile', 'Player location not found');
		return null;
	}

	const truePlayerLoc = getWorldPoint(playerLoc) ?? playerLoc;

	// Get dangerous tiles (tile objects and/or graphics objects)
	const dynamicDangerousTiles = getDangerousTiles(
		tileObjectIds ?? [],
		graphicsObjectIds ?? [],
	);

	// Combine dynamic and pre-defined dangerous tiles
	const dangerousTiles = [
		...dynamicDangerousTiles,
		...(dangerousTileCoordinates || []),
	];

	// Get safe tiles (only if safeTilesSetName provided)

	const safeTilesRaw =
		safeTilesSetName && isValidTileSetName(safeTilesSetName)
			? tileSets.safeTiles(safeTilesSetName) || []
			: [];
	const safeTiles: net.runelite.api.coords.WorldPoint[] = Array.isArray(
		safeTilesRaw,
	)
		? safeTilesRaw.map(
				(t: { x: number; y: number; plane: number }) =>
					new net.runelite.api.coords.WorldPoint(t.x, t.y, t.plane),
			)
		: [];

	const getPreferredDistanceTile = (
		desiredDistance: number,
		centerTile: net.runelite.api.coords.WorldPoint,
		preferCounterClockwise: boolean,
	): net.runelite.api.coords.WorldPoint | null => {
		if (desiredDistance < 0) return null;

		const validTiles: net.runelite.api.coords.WorldPoint[] = [];
		for (let dx = -searchRadius; dx <= searchRadius; dx++) {
			for (let dy = -searchRadius; dy <= searchRadius; dy++) {
				const testTile = new net.runelite.api.coords.WorldPoint(
					truePlayerLoc.getX() + dx,
					truePlayerLoc.getY() + dy,
					truePlayerLoc.getPlane(),
				);

				if (
					getDistanceScope(testTile, centerTile) !== desiredDistance
				) {
					continue;
				}

				if (
					dangerousTiles.length > 0 &&
					isInTileList(testTile, dangerousTiles)
				) {
					continue;
				}

				if (
					safeTiles.length > 0 &&
					!isInTileList(testTile, safeTiles)
				) {
					continue;
				}

				if (
					neverSelectTiles &&
					neverSelectTiles.length > 0 &&
					isInTileList(testTile, neverSelectTiles)
				) {
					if (state.debugFullState) {
						logger(
							state,
							'debug',
							'getPreferredDistanceTile',
							`Tile (${testTile.getX()}, ${testTile.getY()}) is in neverSelectTiles, skipping`,
						);
					}
					continue;
				}

				if (!isTileWalkable(testTile, state)) {
					continue;
				}

				// Check line of sight if options provided
				if (lineOfSightOptions) {
					const { targetTile, blockingObjectIds } =
						lineOfSightOptions;
					if (
						isLineOfSightBlocked(
							state,
							testTile,
							targetTile,
							blockingObjectIds,
						)
					) {
						continue;
					}
				}

				validTiles.push(testTile);
			}
		}

		if (validTiles.length === 0) return null;

		if (state) {
			logger(
				state,
				'debug',
				'getPreferredDistanceTile',
				`Found ${validTiles.length} valid tiles at distance ${desiredDistance}`,
			);
		}

		// Calculate angle from center to each tile and prefer clockwise tiles
		const getAngle = (tile: net.runelite.api.coords.WorldPoint): number => {
			const dx: number = tile.getX() - centerTile.getX();
			const dy: number = tile.getY() - centerTile.getY();
			return Math.atan2(dy, dx);
		};

		const playerAngle: number = getAngle(truePlayerLoc);
		const clockwiseTiles: net.runelite.api.coords.WorldPoint[] = [];
		const counterClockwiseTiles: net.runelite.api.coords.WorldPoint[] = [];

		for (const tile of validTiles) {
			const tileAngle: number = getAngle(tile);
			let angleDiff: number = tileAngle - playerAngle;

			// Normalize angle difference to -PI to PI range
			if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
			if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

			// Negative angle = clockwise, positive = counter-clockwise
			// (clockwise means rotating in decreasing angle direction)
			if (angleDiff < 0) {
				clockwiseTiles.push(tile);
			} else {
				counterClockwiseTiles.push(tile);
			}
		}

		// Prefer clockwise tiles unless counter-clockwise is explicitly requested
		let tilesToCheck: net.runelite.api.coords.WorldPoint[] = [];
		if (preferCounterClockwise) {
			tilesToCheck =
				counterClockwiseTiles.length > 0
					? counterClockwiseTiles
					: clockwiseTiles;
		} else {
			tilesToCheck =
				clockwiseTiles.length > 0
					? clockwiseTiles
					: counterClockwiseTiles;
		}

		if (state) {
			logger(
				state,
				'debug',
				'getPreferredDistanceTile',
				`Clockwise tiles: ${clockwiseTiles.length}, Counter-clockwise: ${counterClockwiseTiles.length}, Checking: ${tilesToCheck.length}, Prefer CCW: ${preferCounterClockwise}`,
			);
		}

		// Return the closest tile to the player from preferred direction
		let closestTile: net.runelite.api.coords.WorldPoint | null = null;
		let minDistanceToPlayer: number = Number.POSITIVE_INFINITY;

		for (const tile of tilesToCheck) {
			const distanceToPlayer: number = getDistanceScope(
				tile,
				truePlayerLoc,
			);
			if (distanceToPlayer < minDistanceToPlayer) {
				minDistanceToPlayer = distanceToPlayer;
				closestTile = tile;
			}
		}

		if (state && closestTile) {
			logger(
				state,
				'debug',
				'getPreferredDistanceTile',
				`Selected tile (${closestTile.getX()}, ${closestTile.getY()}) at distance ${minDistanceToPlayer} from player`,
			);
		}

		return closestTile;
	};

	// Before the search loop
	if (
		dangerousTiles.length > 0 &&
		isInTileList(truePlayerLoc, dangerousTiles) &&
		shouldLogDangerousTile(state)
	) {
		logger(
			state,
			'debug',
			'getSafeTile',
			'Player is standing on DangerousTiles.',
		);
	}

	if (preferredDistanceOptions) {
		const {
			centerTile,
			preferredDistance,
			fallbackDistance,
			preferCounterClockwise,
		} = preferredDistanceOptions;
		const trueCenterTile = getWorldPoint(centerTile) ?? centerTile;
		const preferCcw = preferCounterClockwise === true;

		if (preferredDistance < 0) {
			logger(
				state,
				'debug',
				'getSafeTile',
				'Preferred distance must be non-negative.',
			);
			return null;
		}

		const preferredTile = getPreferredDistanceTile(
			preferredDistance,
			trueCenterTile,
			preferCcw,
		);
		if (preferredTile) {
			logger(
				state,
				'debug',
				'getSafeTile',
				`Found preferred-distance safe tile at (${preferredTile.getX()}, ${preferredTile.getY()})`,
			);
			return preferredTile;
		}

		// Try multiple fallback distances in sequence (e.g., 8, 7, 6...)
		const fallbackTarget =
			typeof fallbackDistance === 'number'
				? fallbackDistance
				: preferredDistance - 1;

		// Try up to 3 additional fallback distances
		for (let i = 0; i < 3; i++) {
			const currentFallback = fallbackTarget - i;
			if (currentFallback >= 0) {
				const fallbackTile = getPreferredDistanceTile(
					currentFallback,
					trueCenterTile,
					preferCcw,
				);
				if (fallbackTile) {
					logger(
						state,
						'debug',
						'getSafeTile',
						`Found fallback-distance (${currentFallback}) safe tile at (${fallbackTile.getX()}, ${fallbackTile.getY()})`,
					);
					return fallbackTile;
				}
			}
		}

		logger(
			state,
			'debug',
			'getSafeTile',
			'No preferred-distance safe tile found.',
		);
		return null;
	}

	// Search tiles in radius around player, collecting valid tiles at each distance
	// Then randomly select one to avoid predictable southwest bias
	for (let distribution = 0; distribution <= searchRadius; distribution++) {
		const validTilesAtDistance: net.runelite.api.coords.WorldPoint[] = [];

		for (let dx = -distribution; dx <= distribution; dx++) {
			for (let dy = -distribution; dy <= distribution; dy++) {
				if (
					Math.abs(dx) !== distribution &&
					Math.abs(dy) !== distribution
				)
					continue; // Only check perimeter for each radius
				const testTile = new net.runelite.api.coords.WorldPoint(
					truePlayerLoc.getX() + dx,
					truePlayerLoc.getY() + dy,
					truePlayerLoc.getPlane(),
				);

				// 1. Not under dangerous tiles (if checking dangerous tiles)
				if (
					dangerousTiles.length > 0 &&
					isInTileList(testTile, dangerousTiles)
				) {
					continue;
				}

				// 2. On safeTiles if safeTiles is defined
				if (
					safeTiles.length > 0 &&
					!isInTileList(testTile, safeTiles)
				) {
					continue;
				}

				// 3. Never select tiles in neverSelectTiles list
				if (
					neverSelectTiles &&
					neverSelectTiles.length > 0 &&
					isInTileList(testTile, neverSelectTiles)
				) {
					continue;
				}

				// 4. Tile must be walkable (check collision map)
				if (!isTileWalkable(testTile, state)) {
					continue;
				}

				// 5. Check line of sight if options provided
				if (lineOfSightOptions) {
					const { targetTile, blockingObjectIds } =
						lineOfSightOptions;
					if (
						isLineOfSightBlocked(
							state,
							testTile,
							targetTile,
							blockingObjectIds,
						)
					) {
						continue;
					}
				}

				// Tile is valid, add it to the collection
				validTilesAtDistance.push(testTile);
			}
		}

		// If we found valid tiles at this distance, randomly pick one
		if (validTilesAtDistance.length > 0) {
			const randomIndex = Math.floor(
				Math.random() * validTilesAtDistance.length,
			);
			const chosenTile = validTilesAtDistance[randomIndex];
			logger(
				state,
				'debug',
				'getSafeTile',
				`Found safe tile at (${chosenTile.getX()}, ${chosenTile.getY()})`,
			);
			return chosenTile;
		}
	}

	logger(state, 'debug', 'getSafeTile', 'No safe tile found.');
	return new net.runelite.api.coords.WorldPoint(
		truePlayerLoc.getX(),
		truePlayerLoc.getY(),
		truePlayerLoc.getPlane(),
	);
};

// Analyze webwalk path and log waypoints and destination. Returns the path for use in walking.
export const webWalkCalculator = (
	state: State,
	destinationX: number,
	destinationY: number,
): net.runelite.api.coords.WorldPoint[] => {
	try {
		if (!bot.walking) {
			logger(
				state,
				'debug',
				'webWalkCalculator',
				'Walking API unavailable.',
			);
			return [];
		}

		// Initiate webwalk to calculate path
		bot.walking.webWalkStart(
			new net.runelite.api.coords.WorldPoint(
				destinationX,
				destinationY,
				0,
			),
		);

		// Then get the calculated path
		const path = bot.walking.getWebWalkCalculatedPath?.() ?? [];
		if (path.length > 0) {
			logger(
				state,
				'debug',
				'webWalkCalculator',
				'Webwalk path is possible.',
			);
			path.forEach(
				(
					waypoint: net.runelite.api.coords.WorldPoint,
					index: number,
				) => {
					logger(
						state,
						'debug',
						'webWalkCalculator',
						`Waypoint ${index}: (${waypoint.getX()}, ${waypoint.getY()})`,
					);
				},
			);
			const destination = path.length > 0 ? path.at(-1) : null;
			if (destination) {
				logger(
					state,
					'debug',
					'webWalkCalculator',
					`Destination: (${destination.getX()}, ${destination.getY()})`,
				);
			} else {
				logger(
					state,
					'debug',
					'webWalkCalculator',
					'Destination is undefined.',
				);
			}
			return path;
		}

		logger(
			state,
			'debug',
			'webWalkCalculator',
			'No webwalk path available.',
		);
		return [];
	} catch (error) {
		logger(
			state,
			'debug',
			'webWalkCalculator',
			`Webwalk calculation failed: ${(error as Error).toString()}`,
		);
		return [];
	}
};

// Find the closest tile to the player from an array of tiles
export function findClosestFrontTile(
	frontTiles: { x: number; y: number }[],
	playerLoc: net.runelite.api.coords.WorldPoint,
): { x: number; y: number } {
	let targetTile = frontTiles[0];
	let minDistanceSquared =
		(playerLoc.getX() - targetTile.x) ** 2 +
		(playerLoc.getY() - targetTile.y) ** 2;

	for (const tile of frontTiles) {
		const dx = playerLoc.getX() - tile.x;
		const dy = playerLoc.getY() - tile.y;
		const distanceSquared = dx * dx + dy * dy;
		if (distanceSquared < minDistanceSquared) {
			minDistanceSquared = distanceSquared;
			targetTile = tile;
		}
	}
	return targetTile;
}
