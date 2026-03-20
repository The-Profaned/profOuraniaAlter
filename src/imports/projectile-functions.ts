// imports
import { projectilePrayerMap, projectileTypeMap } from './npc-ids.js';
import { prayers } from './prayer-functions.js';

// Projectile interface definition
export interface Projectile {
	getId?: () => number;
	id?: number;
	getWorldLocation?: () => { distanceTo: (loc: any) => number };
	getSourceLevel?: () => number;
	getTargetLevel?: () => number;
	getTargetPoint?: () => net.runelite.api.coords.WorldPoint;
	getTargetActor?: () => net.runelite.api.Actor | null;
	getX?: () => number;
	getY?: () => number;
	getRemainingCycles?: () => number;
	getStartCycle?: () => number;
	getEndCycle?: () => number;
	// ...other methods/properties
}

/**
 * ProjectileContainer - wraps a Projectile object with timing metadata.
 * Matches the Java example's ProjectileContainer pattern.
 */
let nextProjectileId = 1;

export class ProjectileContainer {
	private projectile: Projectile;
	private startTime: number;
	private lifetimeMS: number;
	private finalTick: number;
	private targetPoint: net.runelite.api.coords.WorldPoint | null = null;
	private uniqueId: number;

	constructor(
		projectile: Projectile,
		startTime: number,
		lifetimeMS: number,
		finalTick: number,
	) {
		this.projectile = projectile;
		this.startTime = startTime;
		this.lifetimeMS = lifetimeMS;
		this.finalTick = finalTick;
		this.uniqueId = nextProjectileId++;
	}

	getUniqueId(): number {
		return this.uniqueId;
	}

	getProjectile(): Projectile {
		return this.projectile;
	}

	getStartTime(): number {
		return this.startTime;
	}

	getLifetimeMS(): number {
		return this.lifetimeMS;
	}

	getFinalTick(): number {
		return this.finalTick;
	}

	getTargetPoint(): net.runelite.api.coords.WorldPoint | null {
		return this.targetPoint;
	}

	setTargetPoint(point: net.runelite.api.coords.WorldPoint | null): void {
		this.targetPoint = point;
	}

	getId(): number {
		let projId: number | undefined;
		if (typeof this.projectile.getId === 'function') {
			projId = this.projectile.getId();
		} else if (typeof this.projectile.id === 'number') {
			projId = this.projectile.id;
		}
		return projId ?? -1;
	}

	getEndTime(): number {
		return this.startTime + this.lifetimeMS + 60;
	}

	getRemainingMillis(): number {
		return Math.max(0, this.getEndTime() - Date.now());
	}

	getEndCycle(): number | null {
		const endCycle = this.projectile.getEndCycle?.();
		return typeof endCycle === 'number' ? endCycle : null;
	}

	getStartCycle(): number | null {
		const startCycle = this.projectile.getStartCycle?.();
		return typeof startCycle === 'number' ? startCycle : null;
	}

	getTargetX(): number {
		const targetPoint =
			this.targetPoint ?? this.projectile.getTargetPoint?.();
		return targetPoint?.getX?.() ?? this.projectile.getX?.() ?? 0;
	}

	getTargetY(): number {
		const targetPoint =
			this.targetPoint ?? this.projectile.getTargetPoint?.();
		return targetPoint?.getY?.() ?? this.projectile.getY?.() ?? 0;
	}

	getTicksUntilHit(): number {
		const currentTick = client?.getTickCount?.() ?? 0;
		const ticksRemaining = this.finalTick - currentTick;
		return Math.max(0, ticksRemaining);
	}
}

// Set of tracked projectile containers
const trackedProjectiles = new Set<ProjectileContainer>();

// Set of IDs to track (configured by calling setTrackedProjectileIds)
let trackedIdSet = new Set<number>();
let hasLoggedMissingTrackedIds = false;

const getProjectileId = (projectile: Projectile): number | null => {
	if (typeof projectile.getId === 'function') {
		const id = projectile.getId();
		return typeof id === 'number' ? id : null;
	}
	if (typeof projectile.id === 'number') {
		return projectile.id;
	}
	return null;
};

const getProjectileSignature = (projectile: Projectile): string => {
	const id = getProjectileId(projectile) ?? -1;
	const startCycleRaw = projectile.getStartCycle?.();
	const endCycleRaw = projectile.getEndCycle?.();
	const startCycle = typeof startCycleRaw === 'number' ? startCycleRaw : -1;
	const endCycle = typeof endCycleRaw === 'number' ? endCycleRaw : -1;
	const targetPoint = projectile.getTargetPoint?.();
	const targetX = targetPoint?.getX?.() ?? projectile.getX?.() ?? -1;
	const targetY = targetPoint?.getY?.() ?? projectile.getY?.() ?? -1;
	return `${id}:${startCycle}:${endCycle}:${targetX}:${targetY}`;
};

const findMatchingTrackedContainer = (
	projectile: Projectile,
): ProjectileContainer | null => {
	const signature = getProjectileSignature(projectile);
	for (const container of trackedProjectiles) {
		const trackedProjectile = container.getProjectile();
		if (trackedProjectile === projectile) {
			return container;
		}
		if (getProjectileSignature(trackedProjectile) === signature) {
			return container;
		}
	}
	return null;
};

/**
 * Configure which projectile IDs to track via ProjectileMoved events
 */
export const setTrackedProjectileIds = (trackedIds: number[]): void => {
	trackedIdSet = new Set<number>(trackedIds);
	log.print(
		`[ProjectileTracking] Configured to track IDs: ${trackedIds.join(', ')}`,
	);
};

/**
 * Event handler for ProjectileMoved events.
 * Call this from onProjectileMoved() in your script's index.ts.
 * Updates the targetPoint of an existing container if found, or adds new projectile if not tracked yet.
 */
export const handleProjectileMoved = (projectile: Projectile): void => {
	if (!projectile) return;

	const player = client?.getLocalPlayer?.();
	if (!player) return;

	// First, check if already tracked and update target point
	const existingContainer = findMatchingTrackedContainer(projectile);
	if (existingContainer) {
		const targetPoint = projectile.getTargetPoint?.();
		if (targetPoint) {
			existingContainer.setTargetPoint(targetPoint);
		}
		return;
	}

	// Not tracked yet - add it if it matches our criteria (matching Java reference behavior)
	const projId = getProjectileId(projectile) ?? undefined;

	// Only add if it's a tracked ID
	if (!projId || !trackedIdSet.has(projId)) {
		return;
	}

	// Only filter out projectiles explicitly targeting other actors
	const targetActor = projectile.getTargetActor?.();
	if (
		targetActor !== null &&
		targetActor !== undefined &&
		targetActor !== player
	) {
		return;
	}

	// Add new projectile container
	const now = Date.now();
	const remainingCycles = projectile.getRemainingCycles?.();
	const lifetimeMS =
		typeof remainingCycles === 'number' ? remainingCycles * 20 : 600;
	const ticksRemaining = Math.floor(lifetimeMS / 600);
	const currentTick = client?.getTickCount?.() ?? 0;
	const finalTick = currentTick + ticksRemaining;

	const container = new ProjectileContainer(
		projectile,
		now,
		lifetimeMS,
		finalTick,
	);
	const targetPoint = projectile.getTargetPoint?.();
	if (targetPoint) {
		container.setTargetPoint(targetPoint);
	}

	trackedProjectiles.add(container);
	log.print(
		`[ProjectileTracking] Added projectile via onProjectileMoved: ID=${projId}, remainingCycles=${remainingCycles}, lifetimeMS=${lifetimeMS}, ticksRemaining=${ticksRemaining}, currentTick=${currentTick}, finalTick=${finalTick}, total=${trackedProjectiles.size}`,
	);
};

/**
 * Check client projectile deque for new projectiles and add them if not already tracked.
 * This catches projectiles that spawn without triggering ProjectileMoved events.
 * Call this from onGameTick() - BotMaker doesn't support onClientTick().
 * Uses client.getTickCount() for accurate tick tracking even though scanned on game ticks.
 */
export const scanForNewProjectiles = (): void => {
	const player = client?.getLocalPlayer?.();
	if (!player) return;

	const projectileDeque = client?.getProjectiles?.();
	if (!projectileDeque) return;

	// Debug: Log tracking configuration
	if (trackedIdSet.size === 0) {
		if (!hasLoggedMissingTrackedIds) {
			log.print(
				'[ProjectileTracking] WARNING: No tracked IDs configured! Call setTrackedProjectileIds() first.',
			);
			hasLoggedMissingTrackedIds = true;
		}
		return;
	}
	hasLoggedMissingTrackedIds = false;

	const now = Date.now();
	// First, remove expired projectiles
	const toRemove: ProjectileContainer[] = [];
	for (const container of trackedProjectiles) {
		if (now > container.getEndTime()) {
			toRemove.push(container);
		}
	}
	for (const container of toRemove) {
		trackedProjectiles.delete(container);
	}

	// Scan for new projectiles
	const iterator = projectileDeque.iterator();

	while (iterator.hasNext()) {
		const projectile = iterator.next() as Projectile;
		if (!projectile) continue;

		const existingContainer = findMatchingTrackedContainer(projectile);
		if (existingContainer) {
			continue;
		}

		const projId = getProjectileId(projectile) ?? undefined;

		// Skip if not a tracked ID
		if (!projId || !trackedIdSet.has(projId)) {
			continue;
		}

		// Only filter out projectiles explicitly targeting other actors
		// (Allow null targetActor for tile-targeted projectiles like boss attacks)
		const targetActor = projectile.getTargetActor?.();
		if (
			targetActor !== null &&
			targetActor !== undefined &&
			targetActor !== player
		) {
			continue;
		}

		// Create new container
		const remainingCycles = projectile.getRemainingCycles?.();
		const lifetimeMS =
			typeof remainingCycles === 'number' ? remainingCycles * 20 : 600;
		// 60ms buffer is in getEndTime(), not in tick calculation
		const ticksRemaining = Math.floor(lifetimeMS / 600);
		const currentTick = client?.getTickCount?.() ?? 0;
		const finalTick = currentTick + ticksRemaining;

		const container = new ProjectileContainer(
			projectile,
			now,
			lifetimeMS,
			finalTick,
		);

		const targetPoint = projectile.getTargetPoint?.();
		if (targetPoint) {
			container.setTargetPoint(targetPoint);
		}

		trackedProjectiles.add(container);
		// Added-via-scan logging removed to avoid duplicates with onProjectileMoved logging
	}
};

/**
 * Clean up expired projectiles each game tick.
 * Call this once per tick from onGameTick.
 * Note: scanForNewProjectiles also removes expired projectiles, so this
 * is primarily for cases where onClientTick doesn't run frequently enough.
 */
export const cleanExpiredProjectiles = (): void => {
	const player = client?.getLocalPlayer?.();
	if (!player) {
		trackedProjectiles.clear();
		return;
	}

	const now = Date.now();
	const toRemove: ProjectileContainer[] = [];
	for (const container of trackedProjectiles) {
		if (now > container.getEndTime()) {
			toRemove.push(container);
		}
	}
	for (const container of toRemove) {
		trackedProjectiles.delete(container);
	}
};

/**
 * Debug function to see all projectiles in the deque and which match tracked IDs
 */
export const debugProjectiles = (trackedIds: number[]): string => {
	const projectileDeque = client?.getProjectiles?.();
	if (!projectileDeque) {
		return 'No projectiles deque available';
	}

	const projectileList: string[] = [];
	const iterator = projectileDeque.iterator();
	let allCount = 0;

	while (iterator.hasNext()) {
		const projectile = iterator.next() as Projectile;
		if (!projectile) continue;
		allCount++;

		let projId: number | undefined;
		if (typeof projectile.getId === 'function') {
			const id = projectile.getId();
			projId = typeof id === 'number' ? id : undefined;
		} else if (typeof projectile.id === 'number') {
			projId = projectile.id;
		}

		const xValue = projectile.getX?.();
		const yValue = projectile.getY?.();
		const targetX = typeof xValue === 'number' ? xValue : undefined;
		const targetY = typeof yValue === 'number' ? yValue : undefined;
		const isTracked = projId && trackedIds.includes(projId) ? 'MATCH' : '';

		projectileList.push(
			`ID: ${projId} | Target: (${targetX}, ${targetY}) ${isTracked}`,
		);
	}

	return `Total projectiles: ${allCount} | Tracked IDs: ${trackedIds.join(', ')} | List: ${projectileList.join(' | ')}`;
};

/**
 * Debug function to output all available Projectile.d.ts fields per projectile.
 * Optionally filters to a specific set of projectile IDs.
 */
export const debugProjectileDetails = (trackedIds?: number[]): string => {
	const projectileDeque = client?.getProjectiles?.();
	if (!projectileDeque) {
		return 'No projectiles deque available';
	}

	const trackedIdSet = trackedIds ? new Set<number>(trackedIds) : null;
	const projectileList: string[] = [];
	const iterator = projectileDeque.iterator();
	let allCount = 0;
	let matchedCount = 0;

	while (iterator.hasNext()) {
		const projectile = iterator.next() as Projectile;
		if (!projectile) continue;
		allCount++;

		let projId: number | undefined;
		if (typeof projectile.getId === 'function') {
			const id = projectile.getId();
			projId = typeof id === 'number' ? id : undefined;
		} else if (typeof projectile.id === 'number') {
			projId = projectile.id;
		}

		if (trackedIdSet && (!projId || !trackedIdSet.has(projId))) {
			continue;
		}

		matchedCount++;
		const targetPoint = projectile.getTargetPoint?.();
		const tpxValue = targetPoint?.getX?.();
		const tpyValue = targetPoint?.getY?.();
		const pxValue = projectile.getX?.();
		const pyValue = projectile.getY?.();

		let targetX = 0;
		if (typeof tpxValue === 'number') {
			targetX = tpxValue;
		} else if (typeof pxValue === 'number') {
			targetX = pxValue;
		}

		let targetY = 0;
		if (typeof tpyValue === 'number') {
			targetY = tpyValue;
		} else if (typeof pyValue === 'number') {
			targetY = pyValue;
		}

		const startCycleValue = projectile.getStartCycle?.();
		const startCycle =
			typeof startCycleValue === 'number' ? startCycleValue : undefined;
		const endCycleValue = projectile.getEndCycle?.();
		const endCycle =
			typeof endCycleValue === 'number' ? endCycleValue : undefined;
		const remainingCyclesValue = projectile.getRemainingCycles?.();
		const remainingCycles =
			typeof remainingCyclesValue === 'number'
				? remainingCyclesValue
				: undefined;
		const sourceLevelValue = projectile.getSourceLevel?.();
		const sourceLevel =
			typeof sourceLevelValue === 'number' ? sourceLevelValue : undefined;
		const targetLevelValue = projectile.getTargetLevel?.();
		const targetLevel =
			typeof targetLevelValue === 'number' ? targetLevelValue : undefined;
		const targetActor = projectile.getTargetActor?.();
		const ticksUntilHit =
			typeof remainingCycles === 'number'
				? Math.max(1, Math.ceil(remainingCycles / 30))
				: 1;

		projectileList.push(
			[
				`ID:${projId ?? 'na'}`,
				`startCycle:${startCycle ?? 'na'}`,
				`endCycle:${endCycle ?? 'na'}`,
				`remainingCycles:${remainingCycles ?? 'na'}`,
				`ticksUntilHit:${ticksUntilHit}`,
				`sourceLevel:${sourceLevel ?? 'na'}`,
				`targetLevel:${targetLevel ?? 'na'}`,
				`targetX:${targetX ?? 'na'}`,
				`targetY:${targetY ?? 'na'}`,
				`hasTargetActor:${targetActor ? 'true' : 'false'}`,
			].join(' | '),
		);
	}

	const filterLabel = trackedIds
		? `Tracked IDs: ${trackedIds.join(', ')}`
		: 'Tracked IDs: ALL';
	return `Total projectiles: ${allCount} | Matched: ${matchedCount} | ${filterLabel} | List: ${projectileList.join(' || ')}`;
};

/**
 * Get all tracked projectiles sorted by ticks until hit (shortest first)
 */
export const getSortedProjectiles = (): ProjectileContainer[] => {
	return Array.from(trackedProjectiles).sort((a, b) => {
		const aTicksUntilHit = a.getTicksUntilHit();
		const bTicksUntilHit = b.getTicksUntilHit();
		if (aTicksUntilHit !== bTicksUntilHit) {
			return aTicksUntilHit - bTicksUntilHit;
		}
		const aEndCycle = a.getEndCycle() ?? Number.MAX_SAFE_INTEGER;
		const bEndCycle = b.getEndCycle() ?? Number.MAX_SAFE_INTEGER;
		if (aEndCycle !== bEndCycle) {
			return aEndCycle - bEndCycle;
		}
		const aStartCycle = a.getStartCycle() ?? Number.MAX_SAFE_INTEGER;
		const bStartCycle = b.getStartCycle() ?? Number.MAX_SAFE_INTEGER;
		return aStartCycle - bStartCycle;
	});
};

/**
 * Get total count of projectiles targeting player
 */
export const getProjectileCount = (): number => {
	return trackedProjectiles.size;
};

/**
 * Check if any projectiles are targeting player
 */
export const hasIncomingProjectiles = (): boolean => {
	return trackedProjectiles.size > 0;
};

/**
 * Get closest projectile (hits soonest)
 */
export const getClosestProjectile = (): ProjectileContainer | null => {
	const sorted = getSortedProjectiles();
	return sorted.length > 0 ? sorted[0] : null;
};

/**
 * Clear all tracked projectiles
 */
export const clearProjectileTracking = (): void => {
	trackedProjectiles.clear();
};

// Generic lookup for projectile ID in a map
export const getProjectileMapValue = <T>(
	projectileId: number,
	map: Record<number | string, T>,
): T | null => map[projectileId] ?? null;

// Get the prayer key for a projectile ID
export const getPrayerKeyForProjectile = (
	projectileId: number,
): keyof typeof prayers | null =>
	getProjectileMapValue(projectileId, projectilePrayerMap);

// Get the attack type for a projectile ID
export const getTypeKeyForProjectile = (
	projectileId: number,
): 'magic' | 'ranged' | 'melee' | 'other' | null =>
	getProjectileMapValue(projectileId, projectileTypeMap);
