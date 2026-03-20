export type UniqueDropTableConfig = {
	baseIds: number[];
	includeIds?: number[];
	excludeIds?: number[];
};

export const createUniqueDropTable = (
	config: UniqueDropTableConfig,
): number[] => {
	const uniqueIds = new Set<number>(config.baseIds);
	for (const id of config.includeIds ?? []) {
		uniqueIds.add(id);
	}
	for (const id of config.excludeIds ?? []) {
		uniqueIds.delete(id);
	}
	return [...uniqueIds];
};
