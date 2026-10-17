// Which expression the robot shows right now: the one the host asked for (`base`), or a short
// reaction of his own (petted, antenna flicked, celebrating, drowsy then asleep after a while
// without activity).

import type { Emotion } from './engine.ts';

export type MoodOptions = {
	/** Inactivity (no click, no key) before he falls asleep, in ms. */
	sleepAfter?: number;
};

const LOVE_AFTER = 1200; // hover time before love
const ANTENNA_MS = 1800; // reaction to an antenna flick
const WAKE_MS = 1500; // surprised on waking up
const CELEBRATE_MS = 2600; // happy after celebrate(), then back to the host's expression
const DROWSY_MS = 5000; // tired just before falling asleep (at most half of sleepAfter)
// Host expressions a pet does not override (busy, or not in the mood)
const NOT_NOW: Emotion[] = ['angry', 'focus', 'sleep', 'suspicious'];

type Reaction =
	{ kind: 'love' | 'drowsy' | 'sleep' } | { kind: 'short'; emotion: Emotion; until: number } | null;

export function createMood({ sleepAfter = 60_000 }: MoodOptions = {}, now = 0) {
	let base: Emotion = 'neutral';
	let reaction: Reaction = null;
	let hoverSince: number | null = null;
	let lastActivity = now;
	const drowsyAfter = sleepAfter - Math.min(DROWSY_MS, sleepAfter / 2);

	return {
		/** The host's expression; it also ends any reaction, sleep included. */
		setBase(name: Emotion) {
			base = name;
			reaction = null;
		},
		hover(on: boolean, now: number) {
			hoverSince = on ? now : null;
			if (!on && reaction?.kind === 'love') reaction = null;
		},
		antenna(now: number, pick: 'surprised' | 'curious') {
			lastActivity = now;
			reaction = { kind: 'short', emotion: pick, until: now + ANTENNA_MS };
		},
		/** A click or a key anywhere on the page; moving the mouse does not count. */
		activity(now: number) {
			lastActivity = now;
			if (reaction?.kind === 'sleep')
				reaction = { kind: 'short', emotion: 'surprised', until: now + WAKE_MS };
			else if (reaction?.kind === 'drowsy') reaction = null;
		},
		/** Happy for a moment ("done!"), whatever the host's expression; wakes him up. */
		celebrate(now: number) {
			lastActivity = now;
			reaction = { kind: 'short', emotion: 'happy', until: now + CELEBRATE_MS };
		},
		current(now: number): Emotion {
			if (reaction?.kind === 'short' && now >= reaction.until) reaction = null;
			const busy = NOT_NOW.includes(base);
			const idle = now - lastActivity;
			if (!busy && reaction?.kind !== 'short') {
				if (idle >= sleepAfter) reaction = { kind: 'sleep' };
				else if (idle >= drowsyAfter) reaction = { kind: 'drowsy' };
			}
			if (!reaction && !busy && hoverSince !== null && now - hoverSince >= LOVE_AFTER)
				reaction = { kind: 'love' };
			if (!reaction) return base;
			if (reaction.kind === 'drowsy') return 'tired';
			return reaction.kind === 'short' ? reaction.emotion : reaction.kind;
		}
	};
}
