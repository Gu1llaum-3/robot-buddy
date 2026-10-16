import { describe, expect, it } from 'vitest';
import { createMood } from './mood.ts';

const SLEEP = 60_000;
const start = () => createMood({ sleepAfter: SLEEP }, 0);

describe('robot mood', () => {
	it('shows the expression the host asks for', () => {
		const mood = start();
		mood.setBase('happy');
		expect(mood.current(10)).toBe('happy');
	});

	describe('long hover', () => {
		it('turns to love after a moment under the cursor', () => {
			const mood = start();
			mood.hover(true, 1000);
			expect(mood.current(1500)).toBe('neutral');
			expect(mood.current(2300)).toBe('love');
		});
		it('goes back to the host expression when the cursor leaves', () => {
			const mood = start();
			mood.hover(true, 0);
			mood.current(2000);
			mood.hover(false, 2500);
			expect(mood.current(2600)).toBe('neutral');
		});
		it('stays focused while the agent is working', () => {
			const mood = start();
			mood.setBase('focus');
			mood.hover(true, 0);
			expect(mood.current(5000)).toBe('focus');
		});
	});

	describe('antenna flick', () => {
		it.each(['surprised', 'curious'] as const)(
			'reacts %s for a moment, then comes back',
			(pick) => {
				const mood = start();
				mood.antenna(1000, pick);
				expect(mood.current(1100)).toBe(pick);
				expect(mood.current(4000)).toBe('neutral');
			}
		);
	});

	describe('sleep', () => {
		it('falls asleep after a while without a click or a key', () => {
			const mood = start();
			expect(mood.current(SLEEP - 1)).toBe('neutral');
			expect(mood.current(SLEEP)).toBe('sleep');
		});
		it('is kept awake by activity', () => {
			const mood = start();
			mood.activity(SLEEP - 10);
			expect(mood.current(SLEEP + 10)).toBe('neutral');
		});
		it('falls asleep even under the cursor', () => {
			const mood = start();
			mood.hover(true, 0);
			expect(mood.current(SLEEP)).toBe('sleep');
		});
		it('never sleeps when kept awake (sleepAfter: Infinity)', () => {
			const mood = createMood({ sleepAfter: Infinity }, 0);
			expect(mood.current(SLEEP * 100)).toBe('neutral');
		});
		it('never sleeps while the agent is working', () => {
			const mood = start();
			mood.setBase('focus');
			expect(mood.current(SLEEP * 3)).toBe('focus');
		});
		it('wakes up surprised on activity, then shows the host expression', () => {
			const mood = start();
			mood.current(SLEEP);
			mood.activity(SLEEP + 100);
			expect(mood.current(SLEEP + 200)).toBe('surprised');
			expect(mood.current(SLEEP + 3000)).toBe('neutral');
		});
		it('wakes up when the host asks for another expression', () => {
			const mood = start();
			mood.current(SLEEP);
			mood.setBase('focus');
			expect(mood.current(SLEEP + 10)).toBe('focus');
		});
	});
});
