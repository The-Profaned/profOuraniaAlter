type WorldClient = net.runelite.api.Client & {
	getWorlds?: () => java.util.List<net.runelite.api.World>;
	hopToWorld?: (world: net.runelite.api.World) => void;
};

const LOGGED_IN_POST_HOP_TICKS = 2;

export type OccupancyCoordinate = {
	x: number;
	y: number;
	plane: number;
};

type OccupancyOptions = {
	localPlayer?: net.runelite.api.Player | null;
	requireAnimation?: boolean;
};

type PlayerCollection =
	| net.runelite.api.Player[]
	| java.util.List<net.runelite.api.Player>;

const toPlayerArray = (
	players: PlayerCollection | null | undefined,
): net.runelite.api.Player[] => {
	if (!players) return [];
	if (Array.isArray(players)) return players;

	const result: net.runelite.api.Player[] = [];
	const size: number = players.size();
	for (let index = 0; index < size; index++) {
		const player: net.runelite.api.Player | null = players.get(index);
		if (!player) continue;
		result.push(player);
	}

	return result;
};

const isAtCoordinate = (
	location: net.runelite.api.coords.WorldPoint,
	coordinate: OccupancyCoordinate,
): boolean => {
	return (
		location.getX() === coordinate.x &&
		location.getY() === coordinate.y &&
		location.getPlane() === coordinate.plane
	);
};

const isOtherPlayer = (
	player: net.runelite.api.Player,
	localPlayer: net.runelite.api.Player | null,
): boolean => {
	if (!localPlayer) return true;
	if (player === localPlayer) return false;

	const localName = localPlayer.getName?.() ?? null;
	const playerName = player.getName?.() ?? null;
	if (localName && playerName && localName === playerName) return false;

	return true;
};

export const isOccupiedByOtherPlayer = (
	coordinates: OccupancyCoordinate | OccupancyCoordinate[],
	options?: OccupancyOptions,
): boolean => {
	const coordinateList = Array.isArray(coordinates)
		? coordinates
		: [coordinates];
	if (coordinateList.length === 0) return false;

	const localPlayer =
		options?.localPlayer ?? client.getLocalPlayer?.() ?? null;
	const requireAnimation = options?.requireAnimation ?? false;
	const players = toPlayerArray(client.getPlayers?.());
	if (players.length === 0) return false;

	for (const player of players) {
		if (!player) continue;
		if (!isOtherPlayer(player, localPlayer)) continue;

		const playerLocation = player.getWorldLocation?.();
		if (!playerLocation) continue;

		const isOnTargetCoordinate = coordinateList.some(
			(coordinate: OccupancyCoordinate) =>
				isAtCoordinate(playerLocation, coordinate),
		);
		if (!isOnTargetCoordinate) continue;
		if (!requireAnimation) return true;

		const animationId = player.getAnimation?.() ?? -1;
		if (animationId !== -1) return true;
	}

	return false;
};

export const shouldHopIfCrowded = (
	anchorCoordinate: OccupancyCoordinate,
	resourceCoordinates: OccupancyCoordinate[],
	localPlayer?: net.runelite.api.Player | null,
): boolean => {
	const isAnchorOccupied = isOccupiedByOtherPlayer(anchorCoordinate, {
		localPlayer,
	});
	if (isAnchorOccupied) return true;

	const isResourceOccupied = isOccupiedByOtherPlayer(resourceCoordinates, {
		localPlayer,
		requireAnimation: true,
	});
	if (isResourceOccupied) return true;

	return false;
};

export const isLoggedIntoWorld = (): boolean => {
	const worldId = client.getWorld?.() ?? -1;
	const localPlayer = client.getLocalPlayer?.() ?? null;
	return worldId > 0 && localPlayer !== null;
};

export const getPostHopActionDelayTicks = (): number => {
	return isLoggedIntoWorld() ? LOGGED_IN_POST_HOP_TICKS : 0;
};

const TEMPORARY_GAME_MODE_TYPES: readonly net.runelite.api.WorldType[] = [
	net.runelite.api.WorldType.DEADMAN,
	net.runelite.api.WorldType.SEASONAL,
	net.runelite.api.WorldType.LAST_MAN_STANDING,
	net.runelite.api.WorldType.BETA_WORLD,
];

const worldHasType = (
	world: net.runelite.api.World,
	worldType: net.runelite.api.WorldType,
): boolean => {
	const types = world.getTypes?.();
	if (!types) return false;
	return types.contains(worldType);
};

const isTemporaryGameModeWorld = (world: net.runelite.api.World): boolean => {
	return TEMPORARY_GAME_MODE_TYPES.some((worldType) =>
		worldHasType(world, worldType),
	);
};

const isValidMembersTarget = (
	world: net.runelite.api.World,
	currentWorldId: number,
): boolean => {
	const worldId = world.getId?.() ?? -1;
	if (worldId <= 0) return false;
	if (worldId === currentWorldId) return false;
	if (!worldHasType(world, net.runelite.api.WorldType.MEMBERS)) return false;
	if (worldHasType(world, net.runelite.api.WorldType.PVP)) return false;
	if (worldHasType(world, net.runelite.api.WorldType.HIGH_RISK)) return false;
	if (isTemporaryGameModeWorld(world)) return false;
	return true;
};

export const smartWorldHop = (): boolean => {
	try {
		const worldClient = client as WorldClient;
		const currentWorldId = client.getWorld?.() ?? -1;
		const worldsList = worldClient.getWorlds?.();
		if (!worldsList || worldsList.isEmpty()) {
			log.print('[WorldHop] No worlds available to hop.');
			return false;
		}

		const worldsArray = worldsList.toArray();
		const worlds: net.runelite.api.World[] = [];
		for (const worldElement of worldsArray) {
			const world: net.runelite.api.World | null = worldElement ?? null;
			if (!world) continue;
			if (!isValidMembersTarget(world, currentWorldId)) continue;
			worlds.push(world);
		}

		if (worlds.length === 0) {
			log.print('[WorldHop] No eligible members world found.');
			return false;
		}

		const randomIndex = Math.floor(Math.random() * worlds.length);
		const targetWorld = worlds[randomIndex];
		if (!targetWorld) return false;

		const targetWorldId = targetWorld.getId?.() ?? -1;
		worldClient.hopToWorld?.(targetWorld);
		log.print(`[WorldHop] Hopping to members world ${targetWorldId}.`);
		return true;
	} catch {
		log.print('[WorldHop] smartWorldHop failed.');
		return false;
	}
};
