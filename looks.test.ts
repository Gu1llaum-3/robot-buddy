import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, ROBOT_COLORS, SHELLS, normalizeLook, shellPalette } from './looks.ts';

describe('normalizeLook', () => {
	it('gives the mint pebble when nothing is chosen (AC-1)', () => {
		expect(normalizeLook(null)).toEqual({ shell: 'pebble', color: '#a3d6c1' });
		expect(normalizeLook({ shell: null, color: null })).toEqual(DEFAULT_LOOK);
	});
	it('keeps a known shell and a valid colour, in lower case', () => {
		expect(normalizeLook({ shell: 'crt', color: '#FF9447' })).toEqual({
			shell: 'crt',
			color: '#ff9447'
		});
	});
	it('falls back to the pebble for an unknown shell (AC-5)', () => {
		expect(normalizeLook({ shell: 'rocket', color: '#ff9447' })).toEqual({
			shell: 'pebble',
			color: '#ff9447'
		});
	});
	it.each(['red', '#fff', '#12345g', 'url(x)', ''])(
		'uses the shell suggested colour instead of %j (AC-5)',
		(color) => {
			expect(normalizeLook({ shell: 'egg', color })).toEqual({ shell: 'egg', color: '#ff9447' });
		}
	);
});

describe('catalogue', () => {
	it('offers the eight shells, the pebble first', () => {
		expect(SHELLS.map((s) => s.id)).toEqual([
			'pebble',
			'crt',
			'egg',
			'helmet',
			'cat',
			'headphones',
			'cloud',
			'pixel'
		]);
	});
	it('suggests a colour from the palette for every shell', () => {
		const hexes = ROBOT_COLORS.map((c) => c.hex);
		for (const s of SHELLS) expect(hexes).toContain(s.color);
	});
});

describe('shellPalette', () => {
	it('draws lighter and darker tones from one colour', () => {
		// Mint (163,214,193): 55% towards white, 26% and 55% towards black
		expect(shellPalette('#a3d6c1')).toEqual({
			light: 'rgb(214,237,227)',
			mid: 'rgb(163,214,193)',
			edge: 'rgb(121,158,143)',
			deep: 'rgb(73,96,87)'
		});
	});
});
