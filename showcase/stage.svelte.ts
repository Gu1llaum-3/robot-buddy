// What the app's single RobotDock shows: each scene sets where it sits and how it feels.

import { normalizeLook, type Emotion, type RobotLook } from '../src/lib/index.ts';

type Where = 'anchor' | 'corner' | 'hidden';

const STORAGE_KEY = 'robot-buddy-showcase-look';

function storedLook(): RobotLook {
	try {
		return normalizeLook(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
	} catch {
		return normalizeLook();
	}
}

export const stage = $state<{
	where: Where;
	emotion: Emotion;
	look: RobotLook;
	/** Set by App once the dock is mounted. */
	celebrate: () => void;
	/** Corner button pressed. */
	onactivate?: () => void;
}>({ where: 'hidden', emotion: 'neutral', look: storedLook(), celebrate: () => {} });

export function saveLook(look: RobotLook) {
	stage.look = look;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(look));
	} catch {
		// Private mode or blocked storage: the look lasts until reload
	}
}
