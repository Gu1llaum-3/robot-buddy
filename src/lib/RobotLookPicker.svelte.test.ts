import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RobotLookPicker from './RobotLookPicker.svelte';

const checked = (container: HTMLElement, name: string) =>
	container.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;

it('picks a shell in its own colour, even after another colour was chosen', async () => {
	const screen = render(RobotLookPicker, { look: { shell: 'pebble', color: '#3366cc' } });
	// Let the thumbnails settle first: on a slow machine the layout still shifts after mounting,
	// and the click lands on another shell
	await new Promise((resolve) => setTimeout(resolve, 500));
	await screen.getByText('Pocket').click();
	expect(checked(screen.container, 'robot-shell')).toBe('egg');
	expect(checked(screen.container, 'robot-color')).toBe('#ff9447');
});
