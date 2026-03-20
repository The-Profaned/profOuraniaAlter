// Utility functions
// random integer between min and max (inclusive)
export const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

// Fisher-Yates shuffle for true randomness
export const shuffle = (length: number): number[] => {
	const random = Array.from({ length }, (_, index) => index + 1);
	for (let index = random.length - 1; index > 0; index--) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[random[index], random[randomIndex]] = [
			random[randomIndex],
			random[index],
		];
	}
	return random;
};
