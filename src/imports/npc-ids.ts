import { prayers } from './prayer-functions.js';

// NPC IDs
export const NPC = {
	leviathan: net.runelite.api.gameval.NpcID.LEVIATHAN,
	leviathanQuest: net.runelite.api.gameval.NpcID.LEVIATHAN_QUEST,
	abbyssalPathfinder: net.runelite.api.gameval.NpcID.LEVIATHAN_BUFF_NPC,
	graveDefault: net.runelite.api.gameval.NpcID.GRAVESTONE_DEFAULT,
	graveAngel: net.runelite.api.gameval.NpcID.GRAVESTONE_ANGEL,
};

// Group NPC IDs
export const npcGroupIds = {
	leviathans: [12214, 12215],
};

// NPC Animation IDs
export const npcAnimationIds = {
	// placeholder for actual numeric animation IDs
};

// Map NPC animation IDs to prayer keys (add your IDs here)
export const animationPrayerMap: Record<number, keyof typeof prayers> = {
	/* example:
        npcAnimationId: "protRange",
        npcAnimationId: "protMage",
        */
};

// Map NPC animation IDs to attack type labels
export const animationTypeMap: Record<
	number,
	'magic' | 'ranged' | 'melee' | 'other'
> = {
	/* example:
        npcAnimationId: "ranged",
        npcAnimationId: "magic",
        */
};

// NPC Projectile IDs
export const npcProjectileIds = {
	leviathanMagic: 2489,
	leviathanMelee: 2488,
	leviathanRanged: 2487,
	scurriousAttackMagic: 2640,
	scurriousAttackRanged: 2642,
};

// NPC Graphic Animation IDs (Spot Animations - G: in debugger)
export const npcGraphicIds = {
	leviathanMagic: 2486,
	leviathanMelee: 2482,
	leviathanRanged: 2484,
};

// Map graphic animation IDs to prayer keys (PRIORITY - earliest detection)
export const graphicPrayerMap: Record<number, keyof typeof prayers> = {
	[npcGraphicIds.leviathanMagic]: 'protMage',
	[npcGraphicIds.leviathanRanged]: 'protRange',
	[npcGraphicIds.leviathanMelee]: 'protMelee',
};

// Map numeric projectile IDs to prayer keys (FALLBACK - 1-2 tick delay)
export const projectilePrayerMap: Record<number, keyof typeof prayers> = {
	[npcProjectileIds.leviathanMagic]: 'protMage',
	[npcProjectileIds.leviathanRanged]: 'protRange',
	[npcProjectileIds.leviathanMelee]: 'protMelee',
	[npcProjectileIds.scurriousAttackMagic]: 'protMage',
	[npcProjectileIds.scurriousAttackRanged]: 'protRange',
};

// Map numeric projectile IDs to attack type labels
export const projectileTypeMap: Record<
	number,
	'magic' | 'ranged' | 'melee' | 'other'
> = {
	[npcProjectileIds.leviathanRanged]: 'ranged',
	[npcProjectileIds.leviathanMelee]: 'melee',
	[npcProjectileIds.leviathanMagic]: 'magic',
	[npcProjectileIds.scurriousAttackMagic]: 'magic',
	[npcProjectileIds.scurriousAttackRanged]: 'ranged',
};
