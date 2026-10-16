import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Robot from './Robot.svelte';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

it('goes back to the mint pebble when its look is removed (AC-1)', async () => {
	const box = document.createElement('div');
	box.style.cssText = `width:${300 / devicePixelRatio}px;height:${300 / devicePixelRatio}px`;
	document.body.append(box);
	const screen = render(Robot, {
		target: box,
		props: { look: { shell: 'crt', color: '#ff0000' } }
	});
	await wait(300);
	await screen.rerender({ look: undefined });
	await wait(300);

	// Body below the screen: mint (green above red), no longer the red TV
	const canvas = box.querySelector('canvas')!;
	const [r, g] = canvas.getContext('2d')!.getImageData(150, 248, 1, 1).data;
	box.remove();
	expect(g).toBeGreaterThan(r);
});
