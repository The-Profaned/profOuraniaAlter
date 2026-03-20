export const WORLD_POINTS = {
	ouraniaAltar: {
		x: 0,
		y: 0,
		plane: 0,
	},
	prayerAltar: {
		x: 0,
		y: 0,
		plane: 0,
	},
	ladderTop: {
		x: 0,
		y: 0,
		plane: 0,
	},
	ladderBottom: {
		x: 0,
		y: 0,
		plane: 0,
	},
	bankArea: {
		x: 0,
		y: 0,
		plane: 0,
	},
} as const;

export const OBJECT_IDS = {
	ouraniaAltar: 0,
	prayerAltar: 0,
	ladder: 0,
	bankBooth: 0,
	bankChest: 0,
} as const;

export const NPC_IDS = {
	banker: 0,
} as const;

export const INTERACTIONS = {
	useAltar: 'Craft-rune',
	prayAtAltar: 'Pray-at',
	climbDown: 'Climb-down',
	bank: 'Bank',
} as const;
