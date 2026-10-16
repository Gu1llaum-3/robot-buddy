import { expect, it } from 'vitest';
import { createRobot } from './engine.ts';

// Runs in a real browser (client project): the eyes are drawn on a canvas.
it('draws the whole eyes when the canvas already has its drawing size', async () => {
	// 300 drawing pixels from the start: a 150px robot on a 2x screen, as on the agent welcome
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 300;
	canvas.style.width = canvas.style.height = `${300 / devicePixelRatio}px`;
	document.body.append(canvas);
	const robot = createRobot(canvas, { interactive: false });
	await new Promise((resolve) => setTimeout(resolve, 400));

	// Lower half of the left eye (centre 106,164; 70 high): white, not the dark screen
	const [red] = canvas.getContext('2d')!.getImageData(106, 190, 1, 1).data;
	robot.destroy();
	canvas.remove();
	expect(red).toBeGreaterThan(200);
});
