// imports
import { getClosestNPC, getPrayerKeyForAnimation } from './npc-functions.js';
import { checkPrayer, prayers, togglePrayer } from './prayer-functions.js';
import {
	getPrayerKeyForProjectile,
	getClosestProjectile,
	getSortedProjectiles,
	type ProjectileContainer,
} from './projectile-functions.js';
import { logger } from './logger.js';
import { State } from './types.js';
import {
	getDangerousTiles,
	getSafeTile,
	isInTileList,
} from './tile-functions.js';
import { getWorldPoint, isPlayerInArea } from './location-functions.js';

// ============ Logging Toggles ============
const ENABLE_PROJECTILE_QUEUE_LOGGING = true;
const ENABLE_PROJECTILE_QUEUE_VERBOSE_LOGGING = false;

const logProjectileQueue = (state: State, message: string): void => {
	if (!ENABLE_PROJECTILE_QUEUE_LOGGING) return;
	logger(state, 'debug', 'projectilePrayerQueue', message);
};

const logProjectileQueueVerbose = (state: State, message: string): void => {
	if (!ENABLE_PROJECTILE_QUEUE_VERBOSE_LOGGING) return;
	logger(state, 'debug', 'projectilePrayerQueue', message);
};

// Player-related utility functions

// Disable all protection prayers
export const disableProtectionPrayers = (state: State): void => {
	const protectionPrayers: (keyof typeof prayers)[] = [
		'protMelee',
		'protMage',
		'protRange',
	];
	for (const prayer of protectionPrayers) {
		if (checkPrayer(state, prayer)) {
			bot.prayer.togglePrayer(prayers[prayer], true);
			logger(
				state,
				'debug',
				'disableProtectionPrayers',
				`Toggled off ${prayer}`,
			);
		}
	}
};

// Generic prayer activation helper
export const activatePrayerForThreat = (
	state: State,
	prayerKey: keyof typeof prayers | null,
	threatSource: string,
): boolean => {
	if (!prayerKey) {
		logger(
			state,
			'debug',
			'activatePrayerForThreat',
			`No prayer mapping for threat source: ${threatSource}`,
		);
		return false;
	}

	if (checkPrayer(state, prayerKey)) {
		logger(
			state,
			'debug',
			'activatePrayerForThreat',
			`Already praying ${prayerKey} for ${threatSource}`,
		);
		return true;
	}

	const activated = togglePrayer(state, prayerKey);
	logger(
		state,
		'debug',
		'activatePrayerForThreat',
		`Activated ${prayerKey} for ${threatSource}`,
	);

	return activated;
};

// Activate prayer for closest projectile
export const activatePrayerForProjectile = (
	state: State,
	trackedProjectile: ProjectileContainer,
): boolean => {
	const projId = trackedProjectile.getId();
	const prayerKey = getPrayerKeyForProjectile(projId);
	return activatePrayerForThreat(
		state,
		prayerKey,
		`projectile ${projId} hitting in ${trackedProjectile.getTicksUntilHit()} ticks`,
	);
};

// Activate prayer for closest NPC attack animation (pre-emptive)
export const activatePrayerForNPCAttack = (
	state: State,
	npcAttack: { npcIndex: number; animationId: number; distance: number },
): boolean => {
	const prayerKey = getPrayerKeyForAnimation(npcAttack.animationId);
	return activatePrayerForThreat(
		state,
		prayerKey,
		`NPC ${npcAttack.npcIndex} anim ${npcAttack.animationId} at distance ${npcAttack.distance}`,
	);
};

// Handle incoming projectiles by activating prayer for closest one
// Tracks last projectile time and only disables prayer if none seen for 3 seconds
let lastProjectileSeenTick = 0;
let lastActivatedPrayer: keyof typeof prayers | null = null;
let lastQueuedProjectileId: number | null = null;
let projectilePrayerQueue: number[] = [];

const buildProjectileLookup = (
	projectiles: ProjectileContainer[],
): Map<number, ProjectileContainer> => {
	const projectileLookup = new Map<number, ProjectileContainer>();
	for (const projectile of projectiles) {
		projectileLookup.set(projectile.getUniqueId(), projectile);
	}
	return projectileLookup;
};

const formatProjectileQueue = (
	queue: number[],
	projectileLookup: Map<number, ProjectileContainer>,
): string => {
	if (queue.length === 0) return 'empty';

	return queue
		.map((uniqueId, index) => {
			const projectile = projectileLookup.get(uniqueId);
			if (!projectile) return `${index + 1}:stale`;
			return `${index + 1}:${projectile.getId()}@${projectile.getTicksUntilHit()}`;
		})
		.join(' -> ');
};

const syncProjectilePrayerQueue = (
	state: State,
	projectiles: ProjectileContainer[],
): ProjectileContainer | null => {
	if (projectiles.length === 0) {
		if (projectilePrayerQueue.length > 0) {
			logProjectileQueueVerbose(
				state,
				'No tracked projectiles remain. Clearing projectile prayer queue.',
			);
		}
		projectilePrayerQueue = [];
		lastQueuedProjectileId = null;
		return null;
	}

	const currentProjectileIds = new Set<number>(
		projectiles.map((projectile) => projectile.getUniqueId()),
	);
	const currentQueueLengthBeforeFilter = projectilePrayerQueue.length;

	projectilePrayerQueue = projectilePrayerQueue.filter((id) =>
		currentProjectileIds.has(id),
	);

	if (projectilePrayerQueue.length !== currentQueueLengthBeforeFilter) {
		logProjectileQueueVerbose(
			state,
			`Removed ${currentQueueLengthBeforeFilter - projectilePrayerQueue.length} resolved projectile(s) from queue.`,
		);
	}

	let addedToQueue = 0;
	for (const projectile of projectiles) {
		const uniqueId = projectile.getUniqueId();
		if (projectilePrayerQueue.includes(uniqueId)) continue;
		projectilePrayerQueue.push(uniqueId);
		addedToQueue += 1;
	}

	const projectileLookup = buildProjectileLookup(projectiles);
	if (addedToQueue > 0) {
		logProjectileQueue(
			state,
			`Queued ${addedToQueue} projectile(s). Queue: ${formatProjectileQueue(projectilePrayerQueue, projectileLookup)}`,
		);
	}

	while (projectilePrayerQueue.length > 0) {
		const queuedId = projectilePrayerQueue[0];
		const queuedProjectile = projectileLookup.get(queuedId) ?? null;
		if (queuedProjectile) {
			logProjectileQueueVerbose(
				state,
				`Queue head is projectile ${queuedProjectile.getId()} (${queuedProjectile.getTicksUntilHit()} tick(s) to hit). Queue: ${formatProjectileQueue(projectilePrayerQueue, projectileLookup)}`,
			);
			return queuedProjectile;
		}
		projectilePrayerQueue.shift();
	}

	lastQueuedProjectileId = null;
	return null;
};

export const handleIncomingProjectiles = (state: State): boolean => {
	const closest = getClosestProjectile();
	const sortedProjectiles = getSortedProjectiles();
	const currentTick = state.gameTick;
	const DISABLE_DELAY_TICKS = 5; // 3 seconds at 0.6s per tick

	// If projectile exists, activate appropriate prayer
	if (closest) {
		lastProjectileSeenTick = currentTick;

		const queuedProjectile = syncProjectilePrayerQueue(
			state,
			sortedProjectiles,
		);
		if (!queuedProjectile) {
			return false;
		}

		const prayerKey = getPrayerKeyForProjectile(queuedProjectile.getId());

		if (!prayerKey) {
			logProjectileQueue(
				state,
				`No prayer mapped for queued projectile ID ${queuedProjectile.getId()}. Removing from queue.`,
			);
			const uniqueId = queuedProjectile.getUniqueId();
			projectilePrayerQueue = projectilePrayerQueue.filter(
				(id) => id !== uniqueId,
			);
			return false;
		}

		const queueHeadChanged =
			lastQueuedProjectileId !== queuedProjectile.getUniqueId();

		// Only log if queue head projectile changed or prayer changed
		if (queueHeadChanged || lastActivatedPrayer !== prayerKey) {
			logProjectileQueue(
				state,
				`Queue advanced to projectile ${queuedProjectile.getId()} (${queuedProjectile.getTicksUntilHit()} tick(s) to hit). Activating ${prayerKey}.`,
			);
		}

		lastQueuedProjectileId = queuedProjectile.getUniqueId();
		lastActivatedPrayer = prayerKey;
		return togglePrayer(state, prayerKey);
	}

	projectilePrayerQueue = [];
	lastQueuedProjectileId = null;
	logProjectileQueueVerbose(state, 'No tracked projectiles this tick.');

	// No projectile - check if enough time has passed to disable prayer
	if (
		lastActivatedPrayer &&
		currentTick - lastProjectileSeenTick >= DISABLE_DELAY_TICKS
	) {
		logProjectileQueue(
			state,
			`No projectile for 3s. Disabling ${lastActivatedPrayer}.`,
		);
		bot.prayer.togglePrayer(prayers[lastActivatedPrayer], true);
		lastActivatedPrayer = null;
	}

	return false;
};

// Handle pre-emptive prayer activation for closest NPC attack animation (stub - NPC attack tracking not implemented)
export const handleNpcAttackAnimations = (state: State): boolean => {
	logger(
		state,
		'debug',
		'handleNpcAttackAnimations',
		'NPC attack animation tracking not implemented.',
	);
	return false;
};

// Attack target NPC by ID
export const attackTargetNpc = (state: State, npcId: number): boolean => {
	const npc = getClosestNPC([npcId]);
	const player = client?.getLocalPlayer?.();
	const interacting = player.getInteracting?.();

	if (!npc) {
		logger(
			state,
			'debug',
			'attackTargetNpc',
			`No NPC found with ID ${npcId}`,
		);
		return false;
	}

	if (!player) {
		logger(state, 'debug', 'attackTargetNpc', 'Player not found');
		return false;
	}

	if (interacting && interacting === npc) {
		return true;
	}

	bot.npcs.interact(npc.getName?.(), 'Attack');
	logger(
		state,
		'debug',
		'attackTargetNpc',
		`Attacking NPC ${npcId} at ${npc.getWorldLocation?.().getX()}, ${npc.getWorldLocation?.().getY()}, ${npc.getWorldLocation?.().getPlane()}`,
	);
	return true;
};

// Move player to specified safe tile coordinates
export const moveToSafeTile = (
	state: State,
	moveToSafeTile: { x: number; y: number },
): boolean => {
	const player = client.getLocalPlayer();
	if (!player) {
		logger(state, 'debug', 'moveToSafeTile', 'Player not found');
		return false;
	}

	const playerLoc = player.getWorldLocation();
	if (!playerLoc) {
		logger(state, 'debug', 'moveToSafeTile', 'Player location not found');
		return false;
	}

	if (
		playerLoc.getX() === moveToSafeTile.x &&
		playerLoc.getY() === moveToSafeTile.y
	) {
		logger(
			state,
			'debug',
			'moveToSafeTile',
			`Already at safe tile (${moveToSafeTile.x}, ${moveToSafeTile.y})`,
		);
		return true;
	}

	// Use walkToTrueWorldPoint when working with converted instance coordinates
	bot.walking.walkToTrueWorldPoint(moveToSafeTile.x, moveToSafeTile.y);
	logger(
		state,
		'debug',
		'moveToSafeTile',
		`Moving to safe tile (${moveToSafeTile.x}, ${moveToSafeTile.y})`,
	);
	return true;
};

// Track the last movement target to prevent spam-clicking
let lastMovementTarget: { x: number; y: number; tick: number } | null = null;

// High-level function to handle dangerous tile detection and automatic movement to safety
// collision data/BFS movement data (to be added)/radius search/distance coorelation to boss center
export const avoidDangerousTiles = (
	state: State,
	options: {
		tileObjectIds?: number[];
		graphicsObjectIds?: number[];
		searchRadius?: number;
		dangerousTileCoordinates?: net.runelite.api.coords.WorldPoint[];
		bossCenterTile?: net.runelite.api.coords.WorldPoint;
		preferredBossDistance?: number;
		fallbackBossDistance?: number;
		preferCounterClockwise?: boolean;
		neverSelectTiles?: net.runelite.api.coords.WorldPoint[];
		lineOfSightCheck?: {
			targetTile: net.runelite.api.coords.WorldPoint;
			blockingObjectIds: number[];
		};
	},
): boolean => {
	// Early return if bot APIs not ready
	if (!bot || !client) {
		return false;
	}

	const {
		tileObjectIds = [],
		graphicsObjectIds = [],
		dangerousTileCoordinates = [],
		bossCenterTile,
		preferredBossDistance,
		fallbackBossDistance,
		preferCounterClockwise,
		neverSelectTiles,
		lineOfSightCheck,
	} = options;
	const searchRadius = options.searchRadius || 5;

	// Get all dangerous tiles from tile objects and graphics objects, plus pre-defined coordinates
	const dynamicDangerousTiles = getDangerousTiles(
		tileObjectIds,
		graphicsObjectIds,
	);
	const dangerousTiles = [
		...dynamicDangerousTiles,
		...dangerousTileCoordinates,
	];

	// If no danger detected, clear last target and return
	if (dangerousTiles.length === 0) {
		lastMovementTarget = null;
		return false;
	}

	// Get player location to check if they're on a dangerous tile
	const player = client.getLocalPlayer();
	if (!player) {
		logger(state, 'debug', 'avoidDangerousTiles', 'Player not found');
		return false;
	}

	const playerLoc = player.getWorldLocation();
	if (!playerLoc) {
		logger(
			state,
			'debug',
			'avoidDangerousTiles',
			'Could not get player location',
		);
		return false;
	}

	// Convert player location to true world coordinates for comparison
	const truePlayerLoc = getWorldPoint(playerLoc) ?? playerLoc;

	// ONLY move if player is actually standing on a dangerous tile
	if (!isInTileList(truePlayerLoc, dangerousTiles)) {
		// Player is not in danger, no need to move
		lastMovementTarget = null;
		return false;
	}

	// Player is on a dangerous tile, find a safe tile within the search radius
	const preferredDistanceOptions =
		bossCenterTile && typeof preferredBossDistance === 'number'
			? {
					centerTile: bossCenterTile,
					preferredDistance: preferredBossDistance,
					fallbackDistance: fallbackBossDistance,
					preferCounterClockwise: preferCounterClockwise === true,
				}
			: undefined;

	logger(
		state,
		'debug',
		'avoidDangerousTiles',
		`Finding safe tile: ${dangerousTiles.length} dangerous tiles, ${neverSelectTiles?.length ?? 0} never-select tiles, searchRadius: ${searchRadius}`,
	);

	const safeTile = getSafeTile(
		state,
		searchRadius,
		tileObjectIds,
		graphicsObjectIds,
		undefined,
		dangerousTileCoordinates,
		preferredDistanceOptions,
		neverSelectTiles,
		lineOfSightCheck,
	);

	if (!safeTile) {
		logger(
			state,
			'debug',
			'avoidDangerousTiles',
			`No safe tile found within ${searchRadius} tiles`,
		);
		return false;
	}

	// If we're already at the safe tile, no need to move
	if (
		playerLoc.getX() === safeTile.getX() &&
		playerLoc.getY() === safeTile.getY()
	) {
		lastMovementTarget = null;
		return false;
	}

	// Check if we're already walking to this same tile (prevent spam-clicking)
	const targetX = safeTile.getX();
	const targetY = safeTile.getY();
	const currentTick = state.gameTick;

	// Prevent any movement if we issued a command recently (global debounce)
	if (lastMovementTarget && currentTick - lastMovementTarget.tick < 2) {
		// Too soon since last movement command, wait
		return false;
	}

	// Also check if we're already walking to this exact tile
	if (
		lastMovementTarget &&
		lastMovementTarget.x === targetX &&
		lastMovementTarget.y === targetY &&
		currentTick - lastMovementTarget.tick < 3
	) {
		// Already walking to this tile, don't spam click
		return false;
	}

	// Update last movement target
	lastMovementTarget = { x: targetX, y: targetY, tick: currentTick };

	// Move to the safe tile
	logger(
		state,
		'debug',
		'avoidDangerousTiles',
		`Detected ${dangerousTiles.length} dangerous tiles. Moving to safety at (${safeTile.getX()}, ${safeTile.getY()})`,
	);

	return moveToSafeTile(state, {
		x: safeTile.getX(),
		y: safeTile.getY(),
	});
};

// Get player's currently worn equipment
export const getWornEquipment = (state: State): Record<string, number> => {
	const equipment: Record<string, number> = {};
	const equipmentItems = bot.equipment.getEquipment();

	// Equipment array indices match RuneLite equipment slots
	const equipmentSlots: Record<number, string> = {
		0: 'head',
		1: 'cape',
		2: 'neck',
		3: 'weapon',
		4: 'body',
		5: 'shield',
		6: 'legs',
		7: 'hands',
		8: 'feet',
		9: 'ring',
		10: 'ammo',
	};

	for (const [slotIndex, slotName] of Object.entries(equipmentSlots)) {
		const index = Number(slotIndex);
		const item = equipmentItems[index];
		if (item && item.getId?.() && item.getId() > 0) {
			equipment[slotName] = item.getId();
		}
	}

	logger(
		state,
		'debug',
		'getWornEquipment',
		`Current equipment: ${JSON.stringify(equipment)}`,
	);
	return equipment;
};

// Unequip all worn equipment or specific slots
export const unequipWornEquipment = (
	state: State,
	slots?: string[],
): {
	attemptedIds: number[];
	remainingIds: number[];
	success: boolean;
} => {
	const equipment = getWornEquipment(state);
	const targetSlots: string[] = slots ?? Object.keys(equipment);
	const attemptedIds: number[] = [];

	for (const slot of targetSlots) {
		const itemId: number | undefined = equipment[slot];
		if (!itemId) {
			continue;
		}
		attemptedIds.push(itemId);
		bot.equipment.unequip(itemId);
	}

	const remainingIds: number[] = attemptedIds.filter((id) =>
		bot.equipment.containsId(id),
	);
	const success: boolean =
		attemptedIds.length > 0 && remainingIds.length === 0;

	logger(
		state,
		'debug',
		'unequipWornEquipment',
		`Attempted unequip: ${JSON.stringify(attemptedIds)} | Remaining: ${JSON.stringify(remainingIds)}`,
	);

	return { attemptedIds, remainingIds, success };
};

// Verify if player has all required equipment worn
export const hasRequiredEquipment = (
	state: State,
	requiredEquipment: Record<string, number>,
): boolean => {
	const { isFullyGeared, missingSlot, missingItemId } = getGearSnapshot(
		state,
		requiredEquipment,
	);
	logger(
		state,
		'debug',
		'hasRequiredEquipment',
		isFullyGeared
			? 'All required equipment verified'
			: `Missing required item ${missingItemId} in slot ${missingSlot}`,
	);
	return isFullyGeared;
};

// Snapshot required vs worn equipment using a cached initial equipment object
export const getGearSnapshot = (
	state: State,
	initialEquipmentReferance: Record<string, number>,
): {
	requiredEquipment: Record<string, number>;
	wornEquipment: Record<string, number>;
	isFullyGeared: boolean;
	missingSlot: string | null;
	missingItemId: number | null;
} => {
	if (Object.keys(initialEquipmentReferance).length === 0) {
		const wornEquipment = getWornEquipment(state);
		Object.assign(initialEquipmentReferance, wornEquipment);
	}

	const requiredEquipment = initialEquipmentReferance;
	const wornEquipment = getWornEquipment(state);
	let isFullyGeared = true;
	let missingSlot: string | null = null;
	let missingItemId: number | null = null;

	for (const [slot, itemId] of Object.entries(requiredEquipment)) {
		if (wornEquipment[slot] !== itemId) {
			isFullyGeared = false;
			missingSlot = slot;
			missingItemId = itemId;
			break;
		}
	}

	return {
		requiredEquipment,
		wornEquipment,
		isFullyGeared,
		missingSlot,
		missingItemId,
	};
};

// THIS IS ONLY FOR STATE CONTROL - THIS DOES NOT ATTACK THE NPC
// Transitions to 'manage_hp/prayer' sub-state when in area or when no area bounds specified
export const engageNPC = (
	state: State & { inCombatArea: boolean },
	areaBounds?: {
		minX: number;
		maxX: number;
		minY: number;
		maxY: number;
		plane?: number;
	},
): boolean => {
	// If no area bounds specified, immediately transition to manage_hp/prayer
	if (!areaBounds) {
		state.inCombatArea = true;
		state.subState = 'manage_hp/prayer';
		logger(
			state,
			'debug',
			'engageNPC',
			'No area bounds. Transitioning to manage_hp/prayer.',
		);
		return true;
	}

	// Check if player is within specified area bounds
	const isInArea: boolean = (
		isPlayerInArea as (
			state: State,
			minX: number,
			maxX: number,
			minY: number,
			maxY: number,
			plane?: number,
		) => boolean
	)(
		state,
		areaBounds.minX,
		areaBounds.maxX,
		areaBounds.minY,
		areaBounds.maxY,
		areaBounds.plane,
	);

	// Player entered combat area
	if (isInArea && !state.inCombatArea) {
		state.inCombatArea = true;
		state.subState = 'manage_hp/prayer';
		logger(
			state,
			'debug',
			'engageNPC',
			'Player in combat area. Transitioning to manage_hp/prayer.',
		);
		return true;
	}

	// Player left combat area
	if (!isInArea && state.inCombatArea) {
		state.inCombatArea = false;
		logger(state, 'debug', 'engageNPC', 'Player left combat area.');
		return false;
	}

	// Still outside area
	if (!isInArea && !state.inCombatArea) {
		logger(state, 'debug', 'engageNPC', 'Moving to combat area...');
		return false;
	}

	return false;
};

// Cast a spell from an array on a target NPC (uses first available spell name)
export const castSpellOnNpc = (
	state: State,
	spellNames: string[],
	npcIds: number[],
): boolean => {
	// Find closest NPC from the provided IDs
	const targetNpc = getClosestNPC(npcIds);

	if (!targetNpc) {
		logger(
			state,
			'debug',
			'castSpellOnNpc',
			`No NPC found with IDs: ${npcIds.join(', ')}`,
		);
		return false;
	}

	if (spellNames.length === 0) {
		logger(state, 'debug', 'castSpellOnNpc', 'No spell names provided.');
		return false;
	}

	const spellName = spellNames[0];

	try {
		(
			bot.magic.castOnNpc as (
				spellName: string,
				npc: net.runelite.api.NPC,
			) => void
		)(spellName, targetNpc);
		logger(
			state,
			'debug',
			'castSpellOnNpc',
			`Requested spell cast ${spellName} on NPC ${targetNpc.getName?.()}`,
		);
		return true;
	} catch (error) {
		logger(
			state,
			'debug',
			'castSpellOnNpc',
			`Spell ${spellName} request failed: ${String(error)}`,
		);
		return false;
	}
};

// Eat food from inventory by item IDs
// Respects food delay lockout - will not eat if still locked out from previous food
export const eatFood = (
	state: State,
	foodItemIds: number[],
	foodDelay: number,
	fallbackFoodIds?: number[],
): boolean => {
	// Check if we're still in food lockout
	if (state.lastFoodEatTick && state.lastFoodDelay) {
		const ticksSinceLastEat = state.gameTick - state.lastFoodEatTick;
		if (ticksSinceLastEat < state.lastFoodDelay) {
			logger(
				state,
				'debug',
				'eatFood',
				`Food locked out - ${state.lastFoodDelay - ticksSinceLastEat} ticks remaining`,
			);
			return false;
		}
	}

	// Try primary food items first
	for (const itemIds of foodItemIds) {
		const hasFood = bot.inventory.containsId(itemIds);
		if (hasFood) {
			logger(
				state,
				'debug',
				'eatFood',
				`Found food ${itemIds}, attempting to eat`,
			);
			bot.inventory.interactWithIds([itemIds], ['Eat']);
			state.lastFoodEatTick = state.gameTick;
			state.lastFoodDelay = foodDelay;
			logger(
				state,
				'debug',
				'eatFood',
				`Ate food item ID ${itemIds} with ${foodDelay} tick delay`,
			);
			return true;
		}
	}

	// Fallback to combo foods if no primary food found
	if (fallbackFoodIds && fallbackFoodIds.length > 0) {
		logger(
			state,
			'debug',
			'eatFood',
			`No primary food found, trying fallback combo foods`,
		);
		for (const itemIds of fallbackFoodIds) {
			const hasFood = bot.inventory.containsId(itemIds);
			if (hasFood) {
				bot.inventory.interactWithIds([itemIds], ['Eat']);
				state.lastFoodEatTick = state.gameTick;
				state.lastFoodDelay = foodDelay;
				logger(
					state,
					'debug',
					'eatFood',
					`Ate fallback food item ID ${itemIds} with ${foodDelay} tick delay`,
				);
				return true;
			}
		}
	}

	logger(
		state,
		'debug',
		'eatFood',
		`No food found from IDs: ${foodItemIds.join(', ')}${fallbackFoodIds ? ` or fallback: ${fallbackFoodIds.join(', ')}` : ''}`,
	);
	return false;
};

// Combo eat: eat a normal delay food and a combo delay food in the same tick
// Returns true if both foods were eaten successfully
// Respects food delay lockout
export const comboEat = (
	state: State,
	normalFoodIds: number[],
	comboFoodIds: number[],
	normalFoodDelay: number,
): boolean => {
	// Check if we're still in food lockout
	if (state.lastFoodEatTick && state.lastFoodDelay) {
		const ticksSinceLastEat = state.gameTick - state.lastFoodEatTick;
		if (ticksSinceLastEat < state.lastFoodDelay) {
			logger(
				state,
				'debug',
				'comboEat',
				`Food locked out - ${state.lastFoodDelay - ticksSinceLastEat} ticks remaining`,
			);
			return false;
		}
	}

	// First, check if we have both types of food
	const hasNormalFood = normalFoodIds.some((id) =>
		bot.inventory.containsId(id),
	);
	const hasComboFood = comboFoodIds.some((id) =>
		bot.inventory.containsId(id),
	);

	if (!hasNormalFood || !hasComboFood) {
		logger(
			state,
			'debug',
			'comboEat',
			`Missing food - normal: ${hasNormalFood}, combo: ${hasComboFood}`,
		);
		return false;
	}

	// Eat normal delay food first
	let normalEaten = false;
	for (const itemId of normalFoodIds) {
		if (bot.inventory.containsId(itemId)) {
			bot.inventory.interactWithIds([itemId], ['Eat']);
			logger(
				state,
				'debug',
				'comboEat',
				`Eating normal food item ID ${itemId}`,
			);
			normalEaten = true;
			break;
		}
	}

	// Immediately eat combo delay food (karambwan) in the same tick
	if (normalEaten) {
		for (const itemId of comboFoodIds) {
			if (bot.inventory.containsId(itemId)) {
				bot.inventory.interactWithIds([itemId], ['Eat']);
				// Update state tracking - use normalFoodDelay since that's the longer lockout
				state.lastFoodEatTick = state.gameTick;
				state.lastFoodDelay = normalFoodDelay;
				logger(
					state,
					'debug',
					'comboEat',
					`Combo eating item ID ${itemId} with ${normalFoodDelay} tick delay`,
				);
				return true;
			}
		}
	}

	return false;
};

// Eat food and drink potion at the same time
// Returns true if both food and potion were consumed successfully
// Respects both food and potion delay lockouts
export const eatFoodAndDrinkPotion = (
	state: State,
	foodItemIds: number[],
	foodDelay: number,
	potionItemIds: number[],
	potionDelay: number,
): boolean => {
	// Check if we're still in food lockout
	if (state.lastFoodEatTick && state.lastFoodDelay) {
		const ticksSinceLastEat = state.gameTick - state.lastFoodEatTick;
		if (ticksSinceLastEat < state.lastFoodDelay) {
			logger(
				state,
				'debug',
				'eatFoodAndDrinkPotion',
				`Food locked out - ${state.lastFoodDelay - ticksSinceLastEat} ticks remaining`,
			);
			return false;
		}
	}

	// Check if we're still in potion lockout
	if (state.lastPotionDrinkTick) {
		const ticksSinceLastDrink = state.gameTick - state.lastPotionDrinkTick;
		if (ticksSinceLastDrink < potionDelay) {
			logger(
				state,
				'debug',
				'eatFoodAndDrinkPotion',
				`Potion locked out - ${potionDelay - ticksSinceLastDrink} ticks remaining`,
			);
			return false;
		}
	}

	// Check if we have both food and potion
	const hasFood = foodItemIds.some((id) => bot.inventory.containsId(id));
	const hasPotion = potionItemIds.some((id) => bot.inventory.containsId(id));

	if (!hasFood || !hasPotion) {
		logger(
			state,
			'debug',
			'eatFoodAndDrinkPotion',
			`Missing items - food: ${hasFood}, potion: ${hasPotion}`,
		);
		return false;
	}

	// Eat food first
	let foodEaten = false;
	for (const itemId of foodItemIds) {
		if (bot.inventory.containsId(itemId)) {
			bot.inventory.interactWithIds([itemId], ['Eat']);
			logger(
				state,
				'debug',
				'eatFoodAndDrinkPotion',
				`Eating food item ID ${itemId}`,
			);
			foodEaten = true;
			break;
		}
	}

	// Immediately drink potion in the same tick
	if (foodEaten) {
		for (const itemId of potionItemIds) {
			if (bot.inventory.containsId(itemId)) {
				bot.inventory.interactWithIds([itemId], ['Drink']);
				// Update state tracking for both food and potion
				state.lastFoodEatTick = state.gameTick;
				state.lastFoodDelay = foodDelay;
				state.lastPotionDrinkTick = state.gameTick;
				logger(
					state,
					'debug',
					'eatFoodAndDrinkPotion',
					`Drinking potion item ID ${itemId} - food delay: ${foodDelay}, potion delay: ${potionDelay}`,
				);
				return true;
			}
		}
	}

	return false;
};

// Drink potion from inventory by item IDs
// Respects potion delay lockout - will not drink if still locked out from previous potion
export const drinkPotion = (
	state: State,
	potionItemIds: number[],
	potionDelay: number,
): boolean => {
	// Check if we're still in potion lockout
	if (state.lastPotionDrinkTick) {
		const ticksSinceLastDrink = state.gameTick - state.lastPotionDrinkTick;
		if (ticksSinceLastDrink < potionDelay) {
			logger(
				state,
				'debug',
				'drinkPotion',
				`Potion locked out - ${potionDelay - ticksSinceLastDrink} ticks remaining`,
			);
			return false;
		}
	}

	for (const itemIds of potionItemIds) {
		if (bot.inventory.containsId(itemIds)) {
			bot.inventory.interactWithIds([itemIds], ['Drink']);
			state.lastPotionDrinkTick = state.gameTick;
			logger(
				state,
				'debug',
				'drinkPotion',
				`Drinking potion item ID ${itemIds} with ${potionDelay} tick delay`,
			);
			return true;
		}
	}
	return false;
};

// Check if player is on a tile, runs between two tiles, or web walks to a tile with timeout handling
export const runBetweenTiles = (
	state: State,
	tileA: { x: number; y: number },
	tileB: { x: number; y: number },
): boolean => {
	const player = client?.getLocalPlayer?.();
	const playerLocRaw = player?.getWorldLocation?.();

	if (!player || !playerLocRaw) {
		logger(
			state,
			'debug',
			'runBetweenTiles',
			'Player or location not found',
		);
		return false;
	}

	// Get actual world point (handles instance conversion)
	const playerLoc = getWorldPoint(playerLocRaw) ?? playerLocRaw;
	const playerX = playerLoc.getX();
	const playerY = playerLoc.getY();

	// Check if player is at tile A (exact coordinate match)
	const isAtA = playerX === tileA.x && playerY === tileA.y;

	// Run to opposite tile
	const targetTile = isAtA ? tileB : tileA;
	const targetDesc = isAtA
		? `Tile B (${tileB.x}, ${tileB.y})`
		: `Tile A (${tileA.x}, ${tileA.y})`;

	logger(
		state,
		'debug',
		'runBetweenTiles',
		`Player at (${playerX}, ${playerY}) - atA: ${isAtA} - walking to ${targetDesc}`,
	);

	bot.walking.walkToTrueWorldPoint(targetTile.x, targetTile.y);
	logger(state, 'debug', 'runBetweenTiles', `Walking to ${targetDesc}`);

	return true;
};

// Equipment slot indices for swapping gear
export const equipmentSlotIndices: Record<string, number> = {
	head: 0,
	cape: 1,
	neck: 2,
	weapon: 3,
	body: 4,
	shield: 5,
	legs: 7,
	hands: 9,
	feet: 10,
	ring: 12,
	ammo: 13,
};

// Helper function to web walk to a point if not already web walking
export function webWalkToPointIfIdle(
	worldPoint: net.runelite.api.coords.WorldPoint,
): void {
	if (!bot.walking.isWebWalking()) {
		bot.walking.webWalkStart(worldPoint);
	}
}
