// imports
import { logger } from './logger.js';
import { State } from './types.js';

// Timeout Manager to handle multiple conditions with timeouts
export const timeoutManager = {
	conditions: [] as Array<{
		conditionFunction: () => boolean;
		maxWait: number;
		ticksWaited: number;
		ticksDelayed: number;
		onFail?: () => void;
	}>,
	globalFallback: undefined as (() => void) | undefined,
	globalFallbackThreshold: 60,
	globalTicksWaiting: 0,

	// Add a new condition to monitor with timeout
	add({
		state,
		conditionFunction,
		maxWait,
		onFail,
		initialTimeout = 0,
	}: {
		state: State;
		conditionFunction: () => boolean;
		maxWait: number;
		onFail?: (() => void) | string;
		initialTimeout?: number;
	}): void {
		const failCallback =
			typeof onFail === 'string'
				? () => logger(state, 'all', 'Timeout', onFail)
				: onFail;
		this.conditions.push({
			conditionFunction,
			maxWait,
			ticksWaited: 0,
			ticksDelayed: initialTimeout,
			onFail: failCallback,
		});
	},

	// Process each tick to check conditions
	tick(): void {
		this.conditions = this.conditions.filter((condition) => {
			if (condition.ticksDelayed > 0) {
				condition.ticksDelayed--;
				return true;
			}
			if (condition.conditionFunction()) return false;
			condition.ticksWaited++;
			if (condition.ticksWaited >= condition.maxWait) {
				condition.onFail?.();
				return false;
			}
			return true;
		});
		if (this.conditions.length === 0) {
			this.globalTicksWaiting++;
			if (
				this.globalFallback &&
				this.globalTicksWaiting >= this.globalFallbackThreshold
			) {
				this.globalFallback();
				this.globalTicksWaiting = 0;
			}
		} else {
			this.globalTicksWaiting = 0;
		}
	},
	isWaiting(): boolean {
		return this.conditions.length > 0;
	},
};
