export type LootPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const DEFAULT_LOOT_PRIORITY: LootPriority = 10;

export type PriorityOverrides = Partial<Record<number, LootPriority>>;

export type CategoryPriorityOverrides<T extends string> = Partial<
	Record<T, PriorityOverrides>
>;
