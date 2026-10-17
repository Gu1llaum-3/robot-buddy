// English names for the catalogue, which is in French: passed to RobotLookPicker as `names`.

import type { LookPickerLabels } from '../src/lib/svelte.ts';

export const NAMES: Record<string, string> = {
	pebble: 'Pebble',
	crt: 'Retro TV',
	egg: 'Pocket',
	helmet: 'Astronaut',
	cat: 'Kitten',
	headphones: 'Headphones',
	cloud: 'Cloud',
	pixel: 'Pixel',
	'#a3d6c1': 'Mint',
	'#9ccbf0': 'Sky',
	'#c4b5f2': 'Lavender',
	'#f5b0cc': 'Pink',
	'#f4a593': 'Coral',
	'#ff9447': 'Orange',
	'#f2d47e': 'Butter',
	'#dfe4ea': 'Pearl',
	'#9aa3ad': 'Graphite'
};

export const PICKER_LABELS: LookPickerLabels = {
	shell: 'Shell',
	color: 'Colour',
	freeColor: 'Custom colour',
	preview: 'Robot preview'
};
