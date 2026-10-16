// Framework-free entry point: the engine and the looks catalogue work in any page.
export { createRobot } from './engine.ts';
export type { Emotion, Robot, RobotOptions } from './engine.ts';
export {
	DEFAULT_LOOK,
	ROBOT_COLORS,
	SHELLS,
	isColor,
	isShell,
	normalizeLook,
	sameLook,
	shellPalette,
	suggestedColor
} from './looks.ts';
export type { RobotLook, ShellId } from './looks.ts';
