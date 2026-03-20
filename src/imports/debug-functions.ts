// imports
import { logger } from './logger.js';
import { State } from './types.js';

// Standard Debug Function
export const stateDebugger = (state: State, prefix = ''): void => {
	const recurse = (object: Record<string, unknown>, pfx: string): void => {
		for (const [key, value] of Object.entries(object)) {
			const type = typeof value;
			if (type === 'string' || type === 'number' || type === 'boolean') {
				logger(
					state,
					'debug',
					'stateDebugger',
					`${pfx}${key}: ${String(value)}`,
				);
			} else if (Array.isArray(value)) {
				logger(
					state,
					'debug',
					'stateDebugger',
					`${pfx}${key} Length: ${value.length}`,
				);
			} else if (type === 'object' && value !== null) {
				recurse(value as Record<string, unknown>, `${pfx}${key}.`);
			}
		}
	};
	recurse(state as unknown as Record<string, unknown>, prefix);
};
