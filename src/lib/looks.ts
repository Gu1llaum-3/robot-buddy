// The robot's looks: the shells, the suggested colours, and the tones drawn from one colour.
// Ids are stored as is (for example in a user's settings): never rename one.

export const ROBOT_COLORS = [
	{ name: 'Menthe', hex: '#a3d6c1' },
	{ name: 'Ciel', hex: '#9ccbf0' },
	{ name: 'Lavande', hex: '#c4b5f2' },
	{ name: 'Rose', hex: '#f5b0cc' },
	{ name: 'Corail', hex: '#f4a593' },
	{ name: 'Orange', hex: '#ff9447' },
	{ name: 'Beurre', hex: '#f2d47e' },
	{ name: 'Nacre', hex: '#dfe4ea' },
	{ name: 'Graphite', hex: '#9aa3ad' }
] as const;

export const SHELLS = [
	{ id: 'pebble', name: 'Galet', color: '#a3d6c1' },
	{ id: 'crt', name: 'Télé rétro', color: '#f2d47e' },
	{ id: 'egg', name: 'Pocket', color: '#ff9447' },
	{ id: 'helmet', name: 'Astronaute', color: '#dfe4ea' },
	{ id: 'cat', name: 'Chaton', color: '#f5b0cc' },
	{ id: 'headphones', name: 'Casque audio', color: '#c4b5f2' },
	{ id: 'cloud', name: 'Nuage', color: '#9ccbf0' },
	{ id: 'pixel', name: 'Pixel', color: '#f4a593' }
] as const;

export type ShellId = (typeof SHELLS)[number]['id'];
export type RobotLook = { shell: ShellId; color: string };
/** The first shell, in its own colour: the robot as it comes. */
export const DEFAULT_LOOK: RobotLook = { shell: SHELLS[0].id, color: SHELLS[0].color };

export const suggestedColor = (shell: ShellId): string => SHELLS.find((s) => s.id === shell)!.color;

/** Same shell and colour, whatever the case of the colour. */
export const sameLook = (
	a: { shell: string; color: string },
	b: { shell: string; color: string }
) => a.shell === b.shell && a.color.toLowerCase() === b.color.toLowerCase();

export const isShell = (v: unknown): v is ShellId => SHELLS.some((s) => s.id === v);
export const isColor = (v: unknown): v is string =>
	typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

/** A stored or received look made safe: an unknown shell gives the pebble, a bad colour the shell's own. */
export function normalizeLook(
	raw?: { shell?: string | null; color?: string | null } | null
): RobotLook {
	const shell = isShell(raw?.shell) ? raw.shell : DEFAULT_LOOK.shell;
	const color = isColor(raw?.color) ? raw.color.toLowerCase() : suggestedColor(shell);
	return { shell, color };
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (c: number[], to: number, t: number) =>
	`rgb(${c.map((v) => Math.round(v + (to - v) * t)).join(',')})`;

/** Light, middle, edge and deep tones of a shell, all from one colour. */
export function shellPalette(color: string) {
	const c = rgb(isColor(color) ? color : DEFAULT_LOOK.color);
	return {
		light: mix(c, 255, 0.55),
		mid: mix(c, 0, 0),
		edge: mix(c, 0, 0.26),
		deep: mix(c, 0, 0.55)
	};
}
