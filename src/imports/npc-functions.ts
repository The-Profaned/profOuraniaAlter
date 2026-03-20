// imports
import { animationPrayerMap, animationTypeMap } from './npc-ids.js';
import { prayers } from './prayer-functions.js';
import { logger } from './logger.js';
import { State } from './types.js';
import { getWorldPoint } from './location-functions.js';

type AnimationActor = net.runelite.api.Actor & {
	isNpc?: () => boolean;
	getAnimation?: () => number;
	getWorldLocation?: () => net.runelite.api.coords.WorldPoint;
	getIndex?: () => number;
};

type AnimationChangedEvent = {
	getActor?: () => net.runelite.api.Actor;
	getAnimationId?: () => number;
};

type NpcDespawnedEvent = {
	getNpc?: () => net.runelite.api.NPC;
};

// Track NPC attack animations
export const trackedNpcAttacks = new Map<
	number,
	{ npcIndex: number; animationId: number; distance: number }
>();

// Check if NPC with specific ID is currently rendered
export const npcRendered = (npcId: number): boolean =>
	bot.npcs.getWithIds([npcId]).length > 0;

// Check if NPC is alive
export const isNpcAlive = (npc: net.runelite.api.NPC | undefined): boolean => {
	if (!npc) return false;
	return !(npc.isDead?.() ?? false);
};

// Return first NPC with specific NPC-ID
export const getFirstNPC = (npcId: number): net.runelite.api.NPC | undefined =>
	bot.npcs.getWithIds([npcId])[0];

// Get closest NPC with the specific ID
export const getClosestNPC = (
	npcIds: number[],
): net.runelite.api.NPC | undefined => {
	const npcs = bot.npcs.getWithIds(npcIds);
	if (!npcs?.length) return undefined;

	let closest: net.runelite.api.NPC | null = null;
	let minDistance = Number.POSITIVE_INFINITY;

	npcs.forEach((npc) => {
		const distance = client
			.getLocalPlayer()
			.getWorldLocation()
			.distanceTo(npc.getWorldLocation());

		if (distance < minDistance) {
			minDistance = distance;
			closest = npc;
		}
	});

	return closest || undefined;
};

export const getNpcCenterTile = (
	npc: net.runelite.api.NPC,
): net.runelite.api.coords.WorldPoint | null => {
	const npcLoc: net.runelite.api.coords.WorldPoint | null =
		npc.getWorldLocation?.() ?? null;
	if (!npcLoc) return null;

	const trueNpcLoc: net.runelite.api.coords.WorldPoint =
		getWorldPoint(npcLoc) ?? npcLoc;
	const composition: net.runelite.api.NPCComposition | null =
		npc.getComposition?.() ?? null;
	const size: number | undefined = composition?.getSize?.();
	const sizeNumber: number = typeof size === 'number' && size > 0 ? size : 1;
	const offset: number = Math.floor(sizeNumber / 2);

	return new net.runelite.api.coords.WorldPoint(
		trueNpcLoc.getX() + offset,
		trueNpcLoc.getY() + offset,
		trueNpcLoc.getPlane(),
	);
};

// Initialize event listeners for NPC attack tracking
export const initializeNpcAttackTracking = (state: State): void => {
	const registerEvent = <T>(
		eventName: string,
		handler: (event: T) => void,
	): void => {
		try {
			bot.events.register(eventName, handler, 0);
			return;
		} catch (error) {
			logger(
				state,
				'debug',
				'initializeNpcAttackTracking',
				`Event register fallback for ${eventName}: ${(error as Error).toString()}`,
			);
		}

		try {
			bot.events.register(eventName, handler, 0);
		} catch (error) {
			logger(
				state,
				'debug',
				'initializeNpcAttackTracking',
				`Event register skipped for ${eventName}: ${(error as Error).toString()}`,
			);
		}
	};

	registerEvent<AnimationChangedEvent>(
		'AnimationChanged',
		(event: AnimationChangedEvent) => {
			updateNpcAttackAnimation(state, event);
		},
	);

	registerEvent<NpcDespawnedEvent>(
		'NpcDespawned',
		(event: NpcDespawnedEvent) => {
			removeNpcAttack(state, event);
		},
	);
};

// Update NPC attack animation or add to tracking
export const updateNpcAttackAnimation = (
	state: State,
	event: AnimationChangedEvent,
): void => {
	const actor = event.getActor?.() as AnimationActor | undefined;
	if (!actor?.isNpc?.()) return;
	const npc = actor;
	const eventAnimationId = event.getAnimationId?.();
	const actorAnimationId = npc.getAnimation?.();
	let animationId: number | undefined;
	if (typeof eventAnimationId === 'number') {
		animationId = eventAnimationId;
	} else if (typeof actorAnimationId === 'number') {
		animationId = actorAnimationId;
	}
	if (typeof animationId !== 'number') return;
	const prayerKey = animationPrayerMap[animationId];
	const playerLoc = client?.getLocalPlayer?.()?.getWorldLocation?.();
	const npcLoc = npc.getWorldLocation?.();
	if (!playerLoc || !npcLoc) return;
	const distance = npcLoc.distanceTo(playerLoc);
	const maxDistance = 10;

	if (!prayerKey) {
		const fallbackIndex = npc.getIndex?.();
		if (typeof fallbackIndex === 'number') {
			trackedNpcAttacks.delete(fallbackIndex);
		}
		return;
	}

	const npcIndex = npc.getIndex?.();
	if (typeof npcIndex !== 'number') return;
	if (distance <= maxDistance) {
		trackedNpcAttacks.set(npcIndex, {
			npcIndex,
			animationId,
			distance,
		});
		logger(
			state,
			'debug',
			'updateNpcAttackAnimation',
			`Tracking npc ${npcIndex} anim=${animationId} at distance ${distance}`,
		);
	} else if (trackedNpcAttacks.has(npcIndex)) {
		trackedNpcAttacks.delete(npcIndex);
		logger(
			state,
			'debug',
			'updateNpcAttackAnimation',
			`Npc ${npcIndex} out of range`,
		);
	}
};

// Remove NPC from tracking on despawn
export const removeNpcAttack = (
	state: State,
	event: NpcDespawnedEvent,
): void => {
	const npc = event.getNpc?.();
	if (!npc) return;
	const npcIndex = npc.getIndex?.();
	if (typeof npcIndex !== 'number') return;
	if (trackedNpcAttacks.has(npcIndex)) {
		trackedNpcAttacks.delete(npcIndex);
		logger(
			state,
			'debug',
			'removeNpcAttack',
			`Npc ${npcIndex} despawned/removed`,
		);
	}
};

// Generic lookup for animation ID in a map
export const getAnimationMapValue = <T>(
	animationId: number,
	map: Record<number, T>,
): T | null => map[animationId] ?? null;

// Get prayer key for given NPC animation ID
export const getPrayerKeyForAnimation = (
	animationId: number,
): keyof typeof prayers | null =>
	getAnimationMapValue(animationId, animationPrayerMap);

// Get type key for given NPC animation ID
export const getTypeKeyForAnimation = (
	animationId: number,
): 'magic' | 'ranged' | 'melee' | 'other' | null =>
	getAnimationMapValue(animationId, animationTypeMap);

// Check NPC orientation in relation to player
// Returns the direction the NPC is facing and whether it's facing the player
// Useful for predicting special attacks that target ground locations
export const npcOrientationToPlayer = (
	npc: net.runelite.api.NPC | undefined,
): {
	npcOrientation: number | null;
	angleToPlayer: number;
	isFacingPlayer: boolean;
	facingDirection:
		| 'NORTH'
		| 'NORTHEAST'
		| 'EAST'
		| 'SOUTHEAST'
		| 'SOUTH'
		| 'SOUTHWEST'
		| 'WEST'
		| 'NORTHWEST'
		| 'UNKNOWN';
} => {
	if (!npc) {
		return {
			npcOrientation: null,
			angleToPlayer: 0,
			isFacingPlayer: false,
			facingDirection: 'UNKNOWN',
		};
	}

	const player = client.getLocalPlayer();
	if (!player) {
		return {
			npcOrientation: null,
			angleToPlayer: 0,
			isFacingPlayer: false,
			facingDirection: 'UNKNOWN',
		};
	}

	const playerLoc = player.getWorldLocation();
	const npcLoc = npc.getWorldLocation();

	// Get NPC's current orientation (0-2047 in OSRS, where 0 = East)
	const npcOrientation =
		(npc as net.runelite.api.Actor).getOrientation?.() ?? null;

	// Calculate angle from NPC to player
	const deltaX = playerLoc.getX() - npcLoc.getX();
	const deltaY = playerLoc.getY() - npcLoc.getY();
	const angleToPlayerRad = Math.atan2(deltaY, deltaX);
	const angleToPlayerDeg = (angleToPlayerRad * 180) / Math.PI;

	// Normalize to 0-360
	const normalizedAngleToPlayer = (angleToPlayerDeg + 360) % 360;

	// Determine 8-directional facing (based on orientation if available)
	let npcFacingDirection:
		| 'NORTH'
		| 'NORTHEAST'
		| 'EAST'
		| 'SOUTHEAST'
		| 'SOUTH'
		| 'SOUTHWEST'
		| 'WEST'
		| 'NORTHWEST'
		| 'UNKNOWN' = 'UNKNOWN';

	if (npcOrientation !== null) {
		// OSRS orientation: 0 = East, 512 = North, 1024 = West, 1536 = South
		// Range 0-2047 (256 values per direction for 8 directions)
		const normalizedOrientation = npcOrientation % 2048;

		if (normalizedOrientation >= 1920 || normalizedOrientation < 128) {
			npcFacingDirection = 'EAST';
		} else if (
			normalizedOrientation >= 128 &&
			normalizedOrientation < 384
		) {
			npcFacingDirection = 'NORTHEAST';
		} else if (
			normalizedOrientation >= 384 &&
			normalizedOrientation < 640
		) {
			npcFacingDirection = 'NORTH';
		} else if (
			normalizedOrientation >= 640 &&
			normalizedOrientation < 896
		) {
			npcFacingDirection = 'NORTHWEST';
		} else if (
			normalizedOrientation >= 896 &&
			normalizedOrientation < 1152
		) {
			npcFacingDirection = 'WEST';
		} else if (
			normalizedOrientation >= 1152 &&
			normalizedOrientation < 1408
		) {
			npcFacingDirection = 'SOUTHWEST';
		} else if (
			normalizedOrientation >= 1408 &&
			normalizedOrientation < 1664
		) {
			npcFacingDirection = 'SOUTH';
		} else if (
			normalizedOrientation >= 1664 &&
			normalizedOrientation < 1920
		) {
			npcFacingDirection = 'SOUTHEAST';
		}
	}

	// Check if NPC is facing player (within ~45 degree cone)
	let isFacingPlayer = false;

	if (npcOrientation !== null) {
		const normalizedOrientation = npcOrientation % 2048;
		// Convert orientation to degrees (2048 = 360 degrees)
		const npcFacingDeg = (normalizedOrientation / 2048) * 360;

		// Calculate angle difference
		let angleDiff = Math.abs(npcFacingDeg - normalizedAngleToPlayer);
		if (angleDiff > 180) {
			angleDiff = 360 - angleDiff;
		}

		// NPC is facing player if angle difference is less than 45 degrees
		isFacingPlayer = angleDiff < 45;
	}

	return {
		npcOrientation,
		angleToPlayer: normalizedAngleToPlayer,
		isFacingPlayer,
		facingDirection: npcFacingDirection,
	};
};
