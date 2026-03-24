import { onTemplateEnd, onTemplateStart } from './ourania-ui.js';

export function onStart(): void {
	onTemplateStart();
}

export function onEnd(): void {
	onTemplateEnd();
}
