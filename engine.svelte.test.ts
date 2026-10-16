import { afterEach, describe, expect, it } from 'vitest';
import { createRobot, type Robot } from './engine.ts';
import { SHELLS, type RobotLook } from './looks.ts';

// Runs in a real browser (client project): the robot is drawn on a canvas.
let cleanup: (() => void) | null = null;
afterEach(() => cleanup?.());

/** A robot of 300 drawing pixels (a 150px robot on a 2x screen), a few frames after it starts. */
async function drawn(look?: RobotLook, onemotion?: (e: string) => void) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 300;
	canvas.style.width = canvas.style.height = `${300 / devicePixelRatio}px`;
	document.body.append(canvas);
	const robot: Robot = createRobot(canvas, { interactive: true, look, onemotion });
	cleanup = () => {
		robot.destroy();
		canvas.remove();
	};
	await new Promise((resolve) => setTimeout(resolve, 400));
	const pixel = (x: number, y: number) => [
		...canvas.getContext('2d')!.getImageData(x, y, 1, 1).data
	];
	/** Presses the robot at a point of its 300×300 drawing. */
	const press = (x: number, y: number) => {
		const r = canvas.getBoundingClientRect();
		const at = { clientX: r.left + (x / 300) * r.width, clientY: r.top + (y / 300) * r.height };
		canvas.dispatchEvent(new PointerEvent('pointerdown', { ...at, bubbles: true }));
	};
	return Object.assign(pixel, { press, robot });
}

// Where the top of each shell is: its antenna, or what stands in for it
const TOP: Record<string, [number, number]> = {
	pebble: [150, 36],
	crt: [190, 30],
	egg: [150, 34],
	helmet: [150, 28],
	cat: [222, 50],
	headphones: [150, 36],
	cloud: [150, 56],
	pixel: [150, 36]
};

it('draws the whole eyes when the canvas already has its drawing size', async () => {
	const pixel = await drawn();
	// Lower half of the left eye (centre 106,164; 70 high): white, not the dark screen
	expect(pixel(106, 190)[0]).toBeGreaterThan(200);
});

describe.each(SHELLS.map((s) => s.id))('shell %s (AC-6)', (shell) => {
	it('shows the whole eyes', async () => {
		const pixel = await drawn({ shell, color: '#a3d6c1' });
		expect(pixel(106, 190)[0]).toBeGreaterThan(200);
	});
	it('keeps the tallest eyes whole (surprised)', async () => {
		const pixel = await drawn({ shell, color: '#a3d6c1' });
		pixel.robot.set('surprised');
		await new Promise((resolve) => setTimeout(resolve, 1200));
		// Surprised eyes are 96 high around y 158: their top and bottom stay white
		expect(Math.min(pixel(106, 120)[0], pixel(106, 196)[0])).toBeGreaterThan(200);
	});
	it('flinches when its top is clicked', async () => {
		const seen: string[] = [];
		const robot = await drawn({ shell, color: '#a3d6c1' }, (e) => seen.push(e));
		robot.press(...TOP[shell]);
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(seen.at(-1)).toMatch(/^(surprised|curious)$/);
	});
	it('takes the chosen colour', async () => {
		const pixel = await drawn({ shell, color: '#ff0000' });
		// Body, below the screen: red, with shading but no green or blue to speak of
		const [r, g, b] = pixel(150, 248);
		expect(r).toBeGreaterThan(120);
		expect(Math.max(g, b)).toBeLessThan(r / 2);
	});
});
