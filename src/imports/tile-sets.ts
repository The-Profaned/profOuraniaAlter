export const tileSets = {
	safeTileSets: {
		leviSafeTiles: [
			{ x: 0, y: 0, plane: 0 }, // placeholder
		],
		leviDebrisTiles: {
			north: {
				a: [
					{ x: 2077, y: 6380, plane: 0 }, // tile a1
					{ x: 2076, y: 6380, plane: 0 }, // tile a2
					{ x: 2075, y: 6380, plane: 0 }, // tile a3
					{ x: 2074, y: 6380, plane: 0 }, // tile a4
					{ x: 2072, y: 6380, plane: 0 }, // tile a5
					{ x: 2074, y: 6381, plane: 0 }, // tile a6
				],
				b: [
					{ x: 2084, y: 6381, plane: 0 }, // tile b1
					{ x: 2085, y: 6381, plane: 0 }, // tile b2
					{ x: 2086, y: 6381, plane: 0 }, // tile b3
					{ x: 2087, y: 6381, plane: 0 }, // tile b4
					{ x: 2089, y: 6381, plane: 0 }, // tile b5
					{ x: 2087, y: 6382, plane: 0 }, // tile b6
				],
			},
			south: {
				a: [
					{ x: 2077, y: 6364, plane: 0 }, // tile a1
					{ x: 2076, y: 6364, plane: 0 }, // tile a2
					{ x: 2075, y: 6364, plane: 0 }, // tile a3
					{ x: 2074, y: 6364, plane: 0 }, // tile a4
					{ x: 2072, y: 6364, plane: 0 }, // tile a5
					{ x: 2074, y: 6363, plane: 0 }, // tile a6
				],
				b: [
					{ x: 2085, y: 6365, plane: 0 }, // tile b1
					{ x: 2086, y: 6365, plane: 0 }, // tile b2
					{ x: 2087, y: 6365, plane: 0 }, // tile b3
					{ x: 2088, y: 6365, plane: 0 }, // tile b4
					{ x: 2090, y: 6365, plane: 0 }, // tile b5
					{ x: 2088, y: 6364, plane: 0 }, // tile b6
				],
			},
			east: {
				a: [
					{ x: 2089, y: 6369, plane: 0 }, // tile b1
					{ x: 2089, y: 6368, plane: 0 }, // tile b2
					{ x: 2089, y: 6367, plane: 0 }, // tile b3
					{ x: 2089, y: 6366, plane: 0 }, // tile b4
					{ x: 2089, y: 6364, plane: 0 }, // tile b5
					{ x: 2090, y: 6366, plane: 0 }, // tile b6
				],
				b: [
					{ x: 2089, y: 6375, plane: 0 }, // tile a1
					{ x: 2089, y: 6376, plane: 0 }, // tile a2
					{ x: 2089, y: 6377, plane: 0 }, // tile a3
					{ x: 2089, y: 6378, plane: 0 }, // tile a4
					{ x: 2089, y: 6380, plane: 0 }, // tile a5
					{ x: 2090, y: 6378, plane: 0 }, // tile a6
				],
			},
			west: {
				a: [
					{ x: 2073, y: 6376, plane: 0 }, // tile b1
					{ x: 2073, y: 6377, plane: 0 }, // tile b2
					{ x: 2073, y: 6378, plane: 0 }, // tile b3
					{ x: 2073, y: 6379, plane: 0 }, // tile b4
					{ x: 2073, y: 6381, plane: 0 }, // tile b5
					{ x: 2072, y: 6379, plane: 0 }, // tile b6
				],
				b: [
					{ x: 2073, y: 6368, plane: 0 }, // tile a1
					{ x: 2073, y: 6367, plane: 0 }, // tile a2
					{ x: 2073, y: 6366, plane: 0 }, // tile a3
					{ x: 2073, y: 6365, plane: 0 }, // tile a4
					{ x: 2073, y: 6363, plane: 0 }, // tile a5
					{ x: 2072, y: 6365, plane: 0 }, // tile a6
				],
			},
		},
	},

	dangerousTileSets: {
		leviDangerTiles: [
			{ x: 2076, y: 6375, plane: 0 },
			{ x: 2076, y: 6374, plane: 0 },
			{ x: 2076, y: 6373, plane: 0 },
			{ x: 2076, y: 6372, plane: 0 },
			{ x: 2076, y: 6371, plane: 0 },
			{ x: 2076, y: 6370, plane: 0 },
			{ x: 2076, y: 6369, plane: 0 },
			{ x: 2086, y: 6375, plane: 0 },
			{ x: 2086, y: 6374, plane: 0 },
			{ x: 2086, y: 6373, plane: 0 },
			{ x: 2086, y: 6372, plane: 0 },
			{ x: 2086, y: 6371, plane: 0 },
			{ x: 2086, y: 6370, plane: 0 },
			{ x: 2086, y: 6369, plane: 0 },
			{ x: 2078, y: 6377, plane: 0 },
			{ x: 2079, y: 6377, plane: 0 },
			{ x: 2080, y: 6377, plane: 0 },
			{ x: 2081, y: 6377, plane: 0 },
			{ x: 2082, y: 6377, plane: 0 },
			{ x: 2083, y: 6377, plane: 0 },
			{ x: 2084, y: 6377, plane: 0 },
			{ x: 2078, y: 6367, plane: 0 },
			{ x: 2079, y: 6367, plane: 0 },
			{ x: 2080, y: 6367, plane: 0 },
			{ x: 2081, y: 6367, plane: 0 },
			{ x: 2082, y: 6367, plane: 0 },
			{ x: 2083, y: 6367, plane: 0 },
			{ x: 2084, y: 6367, plane: 0 },
		],
		leviNeverDodge: [
			{ x: 2074, y: 6363, plane: 0 },
			{ x: 2075, y: 6363, plane: 0 },
			{ x: 2076, y: 6363, plane: 0 },
			{ x: 2077, y: 6363, plane: 0 },
			{ x: 2089, y: 6363, plane: 0 },
			{ x: 2072, y: 6365, plane: 0 },
			{ x: 2072, y: 6366, plane: 0 },
			{ x: 2072, y: 6367, plane: 0 },
			{ x: 2072, y: 6368, plane: 0 },
			{ x: 2072, y: 6376, plane: 0 },
			{ x: 2072, y: 6377, plane: 0 },
			{ x: 2072, y: 6378, plane: 0 },
			{ x: 2072, y: 6379, plane: 0 },
			{ x: 2072, y: 6381, plane: 0 },
			{ x: 2074, y: 6381, plane: 0 },
			{ x: 2084, y: 6382, plane: 0 },
			{ x: 2085, y: 6382, plane: 0 },
			{ x: 2086, y: 6382, plane: 0 },
			{ x: 2087, y: 6382, plane: 0 },
			{ x: 2088, y: 6382, plane: 0 },
			{ x: 2090, y: 6380, plane: 0 },
			{ x: 2090, y: 6379, plane: 0 },
			{ x: 2090, y: 6378, plane: 0 },
			{ x: 2090, y: 6377, plane: 0 },
			{ x: 2090, y: 6376, plane: 0 },
			{ x: 2090, y: 6375, plane: 0 },
			{ x: 2090, y: 6369, plane: 0 },
			{ x: 2090, y: 6368, plane: 0 },
			{ x: 2090, y: 6367, plane: 0 },
			{ x: 2090, y: 6366, plane: 0 },
			{ x: 2090, y: 6364, plane: 0 },
			{ x: 2088, y: 6364, plane: 0 },
			{ x: 2087, y: 6364, plane: 0 },
			{ x: 2086, y: 6364, plane: 0 },
			{ x: 2085, y: 6364, plane: 0 },
		],
	},

	safeTiles: function (setName: keyof typeof this.safeTileSets) {
		return this.safeTileSets[setName] || [];
	},

	dangerousTiles: function (setName: keyof typeof this.dangerousTileSets) {
		return this.dangerousTileSets[setName] || [];
	},
};
