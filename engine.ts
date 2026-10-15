// Robot avatar engine (Canvas 2D): no library, no network call, no framework.
// Body: superellipse shell + screen. Eyes: clean rounded rectangles with eyelids carved out
// (destination-out), placed on a virtual sphere so they foreshorten when looking sideways.
// Motion and interaction ideas (sphere-projected eyes, spring squash, poke / dizzy) are
// inspired by the MIT-licensed code of Coucou; the character itself is our own.

import { createMood } from './mood.ts';

export type Emotion =
	| 'neutral'
	| 'happy'
	| 'love'
	| 'curious'
	| 'surprised'
	| 'worried'
	| 'sad'
	| 'angry'
	| 'suspicious'
	| 'tired'
	| 'sleep'
	| 'focus';

export type RobotOptions = {
	/** Pokes tickle him, three quick ones make him dizzy. Off: the canvas only follows the cursor. */
	interactive?: boolean;
	/** Element whose hover and pokes the robot feels; defaults to the canvas. */
	target?: HTMLElement;
	/** Inactivity (no click, no key on the page) before he falls asleep, in ms; 60 s by default. */
	sleepAfter?: number;
};

export type Robot = {
	set(emotion: Emotion): void;
	/** Blink, squash, big hop, sparkles, then the happy expression: call it when a task is done. */
	celebrate(): void;
	blink(side?: 'both' | 'left' | 'right'): void;
	setInteractive(on: boolean): void;
	readonly emotion: Emotion;
	/** Stops the animation loop and removes every listener. */
	destroy(): void;
};

type Spring = { x: number; v: number; t: number; k: number; c: number };
type EyeShape = {
	x: number;
	y: number;
	w: number;
	h: number;
	r: number;
	rot: number;
	lidT: number;
	tilt: number;
	lidB: number;
};
type EyeKey = keyof EyeShape;
type Expression = {
	eyes: Partial<EyeShape>[];
	glow: number[];
	gaze: [number, number];
	blush: number;
};

const VIEW = 300; // logical canvas size
const TAU = Math.PI * 2;
const BODY = { cx: 150, cy: 168, rx: 116, ry: 104, n: 3 };
const SCREEN = { cx: 150, cy: 164, rx: 88, ry: 70, n: 3.6 };
const SHELL = ['#e2f5ed', '#a3d6c1'],
	SHELL_DARK = '#79b39d';
const EYE_CY = 164; // eye row on the screen
const EYE_GAP = 44; // half distance between eye centers when looking straight
const SPHERE_R = 100; // radius of the virtual sphere the eyes sit on
const EYE_YAW = Math.asin(EYE_GAP / SPHERE_R);

// Eye parameters (mirrored between eyes):
//   x    : offset toward the face center        rot  : rotation, positive = inner corner down
//   r    : corner roundness (fraction of size)  lidT : upper lid coverage at center (0..1 of height)
//   tilt : extra upper-lid drop at the inner corner (fraction of height; negative = outer corner drops)
//   lidB : lower lid coverage at center, curved upward (gives the smiling crescent)
const BASE: EyeShape = { x: 0, y: 0, w: 48, h: 70, r: 0.42, rot: 0, lidT: 0, tilt: 0, lidB: 0 };
const EYE_KEYS = Object.keys(BASE) as EyeKey[];

const EXPRESSIONS: Record<Emotion, Expression> = {
	neutral: { eyes: [{}], glow: [181, 220, 255], gaze: [0, 0], blush: 0.25 },
	// Love: the eyes turn into beating hearts (drawn in drawEye), hearts float toward the viewer
	love: { eyes: [{ w: 26, h: 26, r: 0.5 }], glow: [255, 150, 190], gaze: [0, -2], blush: 1 },
	happy: {
		eyes: [{ w: 58, h: 66, y: -4, r: 0.38, rot: -0.06, lidB: 0.56 }],
		glow: [255, 224, 165],
		gaze: [0, -2],
		blush: 1
	},
	curious: {
		eyes: [
			{ w: 44, h: 58, y: 5, rot: 0.06, lidT: 0.16, tilt: 0.14 },
			{ w: 56, h: 88, y: -7, r: 0.36 }
		],
		glow: [170, 240, 222],
		gaze: [10, -4],
		blush: 0.35
	},
	surprised: {
		eyes: [{ w: 58, h: 96, y: -6, x: -4, r: 0.48 }],
		glow: [205, 236, 255],
		gaze: [0, -3],
		blush: 0.45
	},
	worried: {
		eyes: [{ w: 48, h: 74, y: 2, x: 3, rot: -0.04, lidT: 0.2, tilt: -0.34 }],
		glow: [170, 198, 255],
		gaze: [0, -2],
		blush: 0.15
	},
	sad: {
		eyes: [{ w: 52, h: 60, y: 12, rot: -0.08, lidT: 0.28, tilt: -0.42 }],
		glow: [130, 168, 255],
		gaze: [0, 7],
		blush: 0.1
	},
	angry: {
		eyes: [{ w: 54, h: 70, y: 2, x: 4, rot: 0.05, lidT: 0.16, tilt: 0.46, lidB: 0.05 }],
		glow: [255, 122, 110],
		gaze: [0, 1],
		blush: 0
	},
	// Suspicious: neutral pill eyes squeezed into slits (left narrower than right), no eyelid cuts, side-eye
	suspicious: {
		eyes: [
			{ w: 54, h: 22, y: 2, r: 0.5 },
			{ w: 54, h: 36, y: 2, r: 0.5 }
		],
		glow: [225, 205, 140],
		gaze: [-11, 2],
		blush: 0
	},
	tired: {
		eyes: [{ w: 54, h: 62, y: 7, lidT: 0.5, tilt: -0.06, lidB: 0.06 }],
		glow: [150, 170, 205],
		gaze: [0, 5],
		blush: 0.2
	},
	sleep: {
		eyes: [{ w: 54, h: 62, y: 10, r: 0.34, lidT: 0.94 }],
		glow: [120, 140, 195],
		gaze: [0, 3],
		blush: 0.35
	},
	// Focus: wide-open eyes, staring, with a "Matrix" rain of digits flowing down inside them (see drawEye()).
	// Periodic pushes speed the rain up and brighten the glow
	focus: {
		eyes: [{ w: 60, h: 98, y: -4, x: -3, r: 0.46 }],
		glow: [255, 255, 255],
		gaze: [0, 0],
		blush: 0
	}
};
// Short reaction when poked
const ANNOYED: Partial<EyeShape>[] = [
	{ w: 56, h: 44, y: 6, x: 3, rot: 0.08, lidT: 0.3, tilt: 0.3 }
];

// Damped springs: [stiffness, damping ratio]. Ratio < 1 gives a small, lively overshoot.
const SPRING: Record<EyeKey, [number, number]> = {
	w: [230, 0.5],
	h: [230, 0.5],
	x: [200, 0.75],
	y: [200, 0.7],
	r: [200, 0.9],
	rot: [200, 0.7],
	lidT: [260, 0.85],
	tilt: [260, 0.8],
	lidB: [260, 0.8]
};
const makeSpring = (value: number, [k, z]: [number, number]): Spring => ({
	x: value,
	v: 0,
	t: value,
	k,
	c: 2 * Math.sqrt(k) * z
});
const stepSpring = (s: Spring, dt: number) => {
	s.v += (s.k * (s.t - s.x) - s.c * s.v) * dt;
	s.x += s.v * dt;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const random = (a: number, b: number) => a + Math.random() * (b - a);
const ease = (t: number) => {
	t = clamp(t, 0, 1);
	return t * t * (3 - 2 * t);
};
// Cheap integer hash: stable pseudo-random values per column / row
const hash = (a: number, b: number) => {
	let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be59b, 0xc2b2ae35);
	h ^= h >>> 13;
	h = Math.imul(h, 0x27d4eb2d);
	return (h ^ (h >>> 15)) >>> 0;
};

type Ctx = CanvasRenderingContext2D;

function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
	c.beginPath();
	c.moveTo(x + r, y);
	c.arcTo(x + w, y, x + w, y + h, r);
	c.arcTo(x + w, y + h, x, y + h, r);
	c.arcTo(x, y + h, x, y, r);
	c.arcTo(x, y, x + w, y, r);
	c.closePath();
}

// Superellipse ("squircle"): exponent n > 2 squares the corners off softly
function squircle(c: Ctx, { cx, cy, rx, ry, n }: typeof BODY) {
	const e = 2 / n;
	c.beginPath();
	for (let k = 0; k <= 96; k++) {
		const a = (k / 96) * TAU,
			ca = Math.cos(a),
			sa = Math.sin(a);
		const x = cx + rx * Math.sign(ca) * Math.pow(Math.abs(ca), e);
		const y = cy + ry * Math.sign(sa) * Math.pow(Math.abs(sa), e);
		if (k) c.lineTo(x, y);
		else c.moveTo(x, y);
	}
	c.closePath();
}

function heartPath(c: Ctx, s: number) {
	c.beginPath();
	c.moveTo(0, s * 0.38);
	c.bezierCurveTo(-s * 1.05, -s * 0.15, -s * 0.5, -s * 0.95, 0, -s * 0.38);
	c.bezierCurveTo(s * 0.5, -s * 0.95, s * 1.05, -s * 0.15, 0, s * 0.38);
	c.closePath();
}

export function createRobot(canvas: HTMLCanvasElement, options: RobotOptions = {}): Robot {
	const ctx = canvas.getContext('2d')!;
	const layer = document.createElement('canvas');
	const lctx = layer.getContext('2d')!;
	let interactive = options.interactive ?? true;
	const target = options.target ?? canvas;
	// What he shows: the host's expression, or a reaction of his own (love, antenna, sleep)
	const mood = createMood({ sleepAfter: options.sleepAfter }, performance.now());

	const eyes = [0, 1].map(
		() =>
			Object.fromEntries(EYE_KEYS.map((k) => [k, makeSpring(BASE[k], SPRING[k])])) as Record<
				EyeKey,
				Spring
			>
	);
	const gaze = { x: makeSpring(0, [380, 0.8]), y: makeSpring(0, [380, 0.8]) };
	// Body physics: squash anchored at the bottom, hop, lean, a wobbly antenna, eye scale (hover)
	const body = {
		sx: makeSpring(1, [260, 0.3]),
		sy: makeSpring(1, [260, 0.3]),
		y: makeSpring(0, [200, 0.45]),
		lean: makeSpring(0, [140, 0.6])
	};
	const antenna = makeSpring(0, [90, 0.16]);
	const eyeScale = makeSpring(1, [300, 0.55]);
	const blush = makeSpring(0.25, [60, 1]);
	const springs = [
		...eyes.flatMap((e) => Object.values(e)),
		gaze.x,
		gaze.y,
		...Object.values(body),
		antenna,
		eyeScale,
		blush
	];
	let glow = [...EXPRESSIONS.neutral.glow];

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let emotion: Emotion = 'neutral';
	const auto = !reducedMotion;
	let blinkStart = -1e4,
		blinkSide: 'both' | 'left' | 'right' = 'both',
		blinkQueue = 0;
	let nextBlink = performance.now() + 2500,
		nextLook = performance.now() + 3000;
	let zs: number[] = [],
		nextZ = 0,
		last = performance.now();
	type Heart = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		born: number;
		life: number;
		size: number;
		grow?: number;
	};
	type Sparkle = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		born: number;
		life: number;
		size: number;
		rot: number;
		color: string;
	};
	let hearts: Heart[] = [],
		sparkles: Sparkle[] = [];
	let hovering = false;
	let lookAt = { x: 0, y: 0 },
		lookUntil = 0; // cursor following
	let pokes: number[] = [],
		reactUntil = 0,
		dizzyUntil = 0,
		dizzyLevel = 0;
	let focusLevel = 0; // 0..1, fades the focus effects in and out
	let loveLevel = 0,
		nextLove = 0; // love: heart eyes fade, next floating heart
	let rainPhase = 0; // accumulated time driving the digit rain (speeds up during pushes)
	// Concentration pushes: ramp up, hold, release; scheduled in frame()
	let strainStart = -1e4,
		strainDur = 1,
		nextStrain = 0;
	let celebrateTimer = 0;
	let raf = 0;

	// Heartbeat "lub-dub": two quick pulses then a pause
	function heartBeat(now: number) {
		if (reducedMotion) return 1;
		const p = (now % 1100) / 1100;
		return (
			1 +
			0.14 * (Math.exp(-(((p - 0.08) / 0.05) ** 2)) + 0.55 * Math.exp(-(((p - 0.28) / 0.05) ** 2)))
		);
	}
	function strainAmount(now: number) {
		const t = (now - strainStart) / strainDur;
		if (t < 0 || t > 1) return 0;
		return t < 0.25 ? ease(t / 0.25) : t > 0.7 ? 1 - ease((t - 0.7) / 0.3) : 1;
	}

	function setEyeTargets(list: Partial<EyeShape>[]) {
		for (let i = 0; i < 2; i++) {
			const p = { ...BASE, ...(list[i] ?? list[0]) };
			for (const k of EYE_KEYS) eyes[i][k].t = p[k];
		}
	}

	function switchEmotion(name: Emotion) {
		const now = performance.now();
		emotion = name;
		reactUntil = 0;
		dizzyUntil = 0;
		setEyeTargets(EXPRESSIONS[name].eyes);
		[gaze.x.t, gaze.y.t] = EXPRESSIONS[name].gaze;
		if (name === 'focus') nextStrain = now + 700;
		if (name === 'happy') hop();
		if (name === 'love') {
			nextLove = now;
			body.sy.v -= 1.5;
			body.sx.v += 1.2;
		}
		if (name === 'surprised') {
			body.y.v -= 140;
			eyeScale.v += 3;
		}
		nextBlink = Math.max(nextBlink, now + (name === 'surprised' ? 1800 : 900));
		nextLook = now + random(1400, 2600);
		if (name === 'sleep') nextZ = now + 500;
	}

	function blink(side: 'both' | 'left' | 'right' = 'both') {
		if (emotion === 'sleep' || dizzyLevel > 0.5) return;
		blinkStart = performance.now();
		blinkSide = side;
		blinkQueue = 0;
		nextBlink = blinkStart + random(3200, 6800);
	}

	function blinkAmount(now: number, side: 'left' | 'right') {
		if (blinkSide !== 'both' && blinkSide !== side) return 1;
		const t = now - blinkStart;
		if (t < 0 || t > 260) return 1;
		if (t < 75) return 1 - 0.96 * ease(t / 75);
		if (t < 120) return 0.04;
		return 0.04 + 0.96 * ease((t - 120) / 140);
	}

	// Body impulses
	function squish() {
		body.sy.v -= 3.4;
		body.sx.v += 2.6;
		antenna.v += (Math.random() < 0.5 ? -1 : 1) * 7;
	}
	function hop() {
		body.y.v -= 160;
		body.sy.v += 1.5;
		antenna.v += 4;
	}

	// "Done!" celebration: quick blink, anticipation squash, big hop with stretch, happy eyes,
	// a burst of sparkles, antenna wobble. Ends on the happy expression.
	function celebrate() {
		clearTimeout(celebrateTimer);
		blink();
		body.sy.v -= 2.6;
		body.sx.v += 2; // anticipation
		celebrateTimer = window.setTimeout(() => {
			const now = performance.now();
			mood.setBase('happy');
			switchEmotion('happy');
			body.y.v -= 190;
			body.sy.v += 1.3;
			body.sx.v -= 0.9;
			antenna.v += 12;
			eyeScale.v += 4;
			emitSparkles(now, 12);
		}, 130);
	}

	function emitSparkles(now: number, n: number) {
		if (reducedMotion) return;
		const colors = ['255,201,77', '127,211,181', '255,150,185', '150,190,255'];
		for (let k = 0; k < n; k++) {
			const a = -Math.PI / 2 + random(-1.25, 1.25),
				sp = random(110, 190);
			sparkles.push({
				x: 150 + Math.cos(a) * 60,
				y: 88 + Math.sin(a) * 30,
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp,
				born: now + random(0, 90),
				life: random(700, 1100),
				size: random(5, 9),
				rot: random(0, TAU),
				color: colors[k % colors.length]
			});
		}
	}

	// ── Drawing ──────────────────────────────────────────────────────────────
	const deviceScale = () => {
		const m = ctx.getTransform();
		return Math.hypot(m.a, m.b);
	};

	function drawAntenna(strain: number) {
		const baseX = BODY.cx,
			baseY = BODY.cy - BODY.ry + 8,
			len = 36,
			a = antenna.x;
		const tipX = baseX + Math.sin(a) * len,
			tipY = baseY - Math.cos(a) * len;
		ctx.lineCap = 'round';
		ctx.lineWidth = 5;
		ctx.strokeStyle = SHELL_DARK;
		ctx.beginPath();
		ctx.moveTo(baseX, baseY);
		ctx.quadraticCurveTo(baseX + Math.sin(a) * len * 0.25, baseY - len * 0.6, tipX, tipY);
		ctx.stroke();
		// Tip ball: lights up and swells with focus strain (processing light)
		const r = 10 * (1 + 0.25 * strain);
		if (strain > 0.01) {
			ctx.fillStyle = `rgba(27,133,105,${0.18 * strain})`;
			ctx.beginPath();
			ctx.arc(tipX, tipY, r * 2, 0, TAU);
			ctx.fill();
		}
		if (loveLevel > 0.5) {
			const hs = 12 * heartBeat(performance.now()) * ease((loveLevel - 0.5) * 2);
			ctx.save();
			ctx.translate(tipX, tipY + hs * 0.18);
			ctx.scale(hs, hs);
			heartPath(ctx, 1);
			ctx.fillStyle = '#ff8fb3';
			ctx.fill();
			ctx.restore();
			return;
		}
		const g = ctx.createRadialGradient(tipX - r * 0.35, tipY - r * 0.4, 0, tipX, tipY, r);
		g.addColorStop(0, '#ffffff');
		g.addColorStop(1, emotion === 'sleep' ? SHELL_DARK : SHELL[1]);
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(tipX, tipY, r, 0, TAU);
		ctx.fill();
	}

	function drawShell() {
		squircle(ctx, BODY);
		const g = ctx.createLinearGradient(0, BODY.cy - BODY.ry, 0, BODY.cy + BODY.ry);
		g.addColorStop(0, SHELL[0]);
		g.addColorStop(1, SHELL[1]);
		ctx.fillStyle = g;
		ctx.fill();
		ctx.save();
		ctx.clip();
		// Edge shading for volume, then a soft specular highlight top-left
		const sh = ctx.createRadialGradient(BODY.cx, BODY.cy, 30, BODY.cx, BODY.cy, 150);
		sh.addColorStop(0, 'rgba(20,70,55,0)');
		sh.addColorStop(0.62, 'rgba(20,70,55,0)');
		sh.addColorStop(1, 'rgba(20,70,55,.22)');
		ctx.fillStyle = sh;
		ctx.fillRect(0, 0, VIEW, VIEW);
		const hl = ctx.createRadialGradient(104, BODY.cy - 72, 0, 104, BODY.cy - 72, 64);
		hl.addColorStop(0, 'rgba(255,255,255,.7)');
		hl.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = hl;
		ctx.fillRect(0, 0, VIEW, VIEW);
		ctx.restore();
	}

	function drawSpiral(cx: number, cy: number, side: number, tt: number) {
		const R = 22,
			end = 2.6 * TAU;
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate((side * tt * TAU) / 650);
		ctx.beginPath();
		for (let a = 0; a <= end; a += 0.15) {
			const r = (R * a) / end;
			if (a) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
			else ctx.moveTo(0, 0);
		}
		ctx.lineWidth = 5;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.strokeStyle = '#f9fcff';
		ctx.shadowColor = 'rgba(181,220,255,.5)';
		ctx.shadowBlur = 12 * deviceScale();
		ctx.stroke();
		ctx.restore();
	}

	// Love eye: a glowing heart that beats, pops in with loveLevel, blinks and foreshortens like a normal eye
	function drawHeartEye(cx: number, cy: number, fx: number, fy: number, now: number) {
		const s = 40 * eyeScale.x * heartBeat(now) * ease(loveLevel);
		if (s < 0.5) return;
		ctx.save();
		ctx.translate(cx, cy + s * 0.18);
		ctx.scale(fx * s, Math.max(0.06, fy) * s);
		heartPath(ctx, 1);
		const g = ctx.createLinearGradient(0, -0.75, 0, 0.4);
		g.addColorStop(0, '#ffffff');
		g.addColorStop(1, '#ffd0df');
		ctx.fillStyle = g;
		ctx.shadowColor = 'rgba(255,140,175,.65)';
		ctx.shadowBlur = 16 * deviceScale(); // shadowBlur ignores the transform
		ctx.fill();
		ctx.restore();
	}

	function drawEye(i: number, now: number, strain: number) {
		const e = eyes[i];
		const v = (k: EyeKey) => e[k].x;
		const side = i === 0 ? 1 : -1; // +x points toward the face center for the left eye
		const b = blinkAmount(now, i === 0 ? 'left' : 'right');
		const breath = 1 + 0.018 * Math.sin((now * TAU) / 3800);
		const droop = emotion === 'tired' ? 0.1 * (0.5 + 0.5 * Math.sin((now * TAU) / 2600)) : 0;

		const tt = reducedMotion ? 0 : now;

		// Eyes sit on a sphere: looking sideways moves them along it and foreshortens them
		const yaw = clamp(gaze.x.x / 75, -0.32, 0.32),
			pitch = clamp(gaze.y.x / 70, -0.25, 0.25);
		const a = -side * EYE_YAW + yaw;
		const fx = clamp(Math.cos(a) / Math.cos(EYE_YAW), 0.45, 1.1),
			fy = Math.cos(pitch);
		const s = eyeScale.x;

		// Squash & stretch on blink: height collapses, width grows a little
		const w = Math.max(8, v('w') * s * fx * (1 + 0.14 * (1 - b)));
		const h = Math.max(3.5, v('h') * s * fy * breath * b);
		const cx = SCREEN.cx + SPHERE_R * Math.sin(a) + side * v('x');
		const cy = EYE_CY + SPHERE_R * 0.8 * Math.sin(pitch) + v('y');
		if (dizzyLevel > 0.5) {
			drawSpiral(cx, cy, side, tt);
			return;
		}
		if (loveLevel > 0.01) {
			drawHeartEye(cx, cy, fx, fy * b, now);
			if (loveLevel > 0.5) return;
		}

		const rot = side * v('rot');
		const lidT = clamp(v('lidT') + droop, 0, 1);
		const tilt = v('tilt');
		const lidB = clamp(v('lidB'), 0, 1);
		const rad = Math.min(w, h) * clamp(v('r'), 0.05, 0.5);
		const top = -h / 2,
			bottom = h / 2;

		// Work only inside the eye's bounding box in device pixels (cheaper shadow blur)
		const M = ctx.getTransform();
		const scale = Math.hypot(M.a, M.b);
		const dx = M.a * cx + M.c * cy + M.e,
			dy = M.b * cx + M.d * cy + M.f;
		const m = (Math.max(w, h) / 2 + 26) * scale * 1.2;
		const bx = Math.max(0, Math.floor(dx - m)),
			by = Math.max(0, Math.floor(dy - m));
		const bw = Math.min(layer.width - bx, Math.ceil(2 * m)),
			bh = Math.min(layer.height - by, Math.ceil(2 * m));
		if (bw <= 0 || bh <= 0) return;

		lctx.setTransform(1, 0, 0, 1, 0, 0);
		lctx.clearRect(bx, by, bw, bh);
		lctx.setTransform(M.a, M.b, M.c, M.d, M.e, M.f);
		lctx.translate(cx, cy);
		lctx.rotate(rot);

		const [gr, gg, gb] = glow;
		const tint = (c: number) => Math.round(255 + (c - 255) * 0.22);
		const fill = lctx.createLinearGradient(0, top, 0, bottom);
		fill.addColorStop(0, '#ffffff');
		fill.addColorStop(1, `rgb(${tint(gr)},${tint(gg)},${tint(gb)})`);
		lctx.fillStyle = fill;
		roundRect(lctx, -w / 2, top, w, h, rad);
		lctx.fill();

		lctx.globalCompositeOperation = 'destination-out';
		lctx.fillStyle = '#000';
		// Upper lid: straight edge, tilt expressed relative to height so it scales with blinks
		const W = w;
		const lidY = (x: number) => top + lidT * h + (tilt * h * (x * side)) / (w / 2);
		lctx.beginPath();
		lctx.moveTo(-W, lidY(-W));
		lctx.lineTo(W, lidY(W));
		lctx.lineTo(W, top - 2 * h - 60);
		lctx.lineTo(-W, top - 2 * h - 60);
		lctx.closePath();
		lctx.fill();
		// Lower lid: ellipse rising from below, carves the smiling crescent
		if (lidB > 0.001) {
			const ry = h * 0.62,
				ly = bottom - lidB * h + ry;
			lctx.beginPath();
			lctx.ellipse(0, ly, w * 0.72, ry, 0, 0, TAU);
			lctx.rect(-W, ly, 2 * W, h + 60);
			lctx.fill();
		}
		// Focus: digit rain painted only inside the eye (source-atop). Each column has its own speed,
		// trail length and gap; digits sit on a fixed row grid and mutate now and then, the head is darkest
		if (focusLevel > 0.01) {
			lctx.save();
			roundRect(lctx, -w / 2, top, w, h, rad);
			lctx.clip(); // explicit bound, in addition to source-atop
			lctx.globalCompositeOperation = 'source-atop';
			const lh = 9,
				cols = Math.max(3, Math.floor(w / 8.5)),
				cw = w / cols,
				rows = Math.ceil(h / lh) + 1;
			lctx.font = '700 9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
			lctx.textAlign = 'center';
			lctx.textBaseline = 'middle';
			for (let c = 0; c < cols; c++) {
				const hs = hash(i * 31 + c, 7);
				const speed = 6 + (hs % 8); // rows per second
				const len = 4 + ((hs >>> 4) % 7); // trail length in rows
				const cycle = rows + len + 2 + ((hs >>> 8) % 8);
				const hr = Math.floor((rainPhase * speed + ((hs >>> 12) % cycle)) % cycle);
				for (let k = 0; k <= len; k++) {
					const r = hr - k;
					if (r < 0 || r >= rows) continue;
					const tick = Math.floor(rainPhase * 2.5 + (hash(c, r) % 5));
					const digit = hash(i * 131 + c, r * 17 + tick) % 10;
					const alpha = focusLevel * (k === 0 ? 0.95 : 0.7 * (1 - k / (len + 1)));
					lctx.fillStyle = `rgba(12,30,42,${alpha})`;
					lctx.fillText(String(digit), -w / 2 + (c + 0.5) * cw, top + (r + 0.5) * lh);
				}
			}
			lctx.restore();
		}
		lctx.globalCompositeOperation = 'source-over';

		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.shadowColor = `rgba(${gr | 0},${gg | 0},${gb | 0},${0.5 + 0.08 * focusLevel + 0.2 * strain})`;
		ctx.shadowBlur = (14 + focusLevel * 6 + 10 * strain) * scale;
		ctx.drawImage(layer, bx, by, bw, bh, bx, by, bw, bh);
		ctx.restore();
	}

	function drawBlush() {
		const a = blush.x;
		if (a < 0.01) return;
		const shift = clamp(gaze.x.x / 75, -0.32, 0.32) * 40;
		for (const sd of [-1, 1]) {
			const x = SCREEN.cx + sd * 64 + shift,
				y = EYE_CY + 42;
			const g = ctx.createRadialGradient(x, y, 0, x, y, 20);
			g.addColorStop(0, `rgba(255,140,175,${0.6 * a})`);
			g.addColorStop(1, 'rgba(255,140,175,0)');
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.ellipse(x, y, 20, 11, 0, 0, TAU);
			ctx.fill();
		}
	}

	function drawParticles(now: number) {
		// Sleep z's, rising from above the head
		if (emotion === 'sleep' && now >= nextZ) {
			zs.push(now);
			nextZ = now + 1400;
		}
		zs = zs.filter((t) => now - t < 2800);
		for (const born of zs) {
			const p = (now - born) / 2800;
			ctx.font = `700 ${11 + p * 12}px Inter, ui-sans-serif, sans-serif`;
			ctx.fillStyle = `rgba(110,135,145,${Math.sin(p * Math.PI) * 0.8})`;
			ctx.fillText('z', 214 + p * 30 + Math.sin(p * 7) * 4, 82 - p * 56);
		}
		// Sparkles: 4-point stars thrown up, slowed by gravity, spinning and fading
		sparkles = sparkles.filter((p) => now - p.born < p.life);
		for (const p of sparkles) {
			const age = (now - p.born) / 1000;
			if (age < 0) continue;
			const k = (age * 1000) / p.life;
			const r = p.size * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) * 0.6);
			ctx.save();
			ctx.translate(p.x + p.vx * age, p.y + p.vy * age + 240 * age * age);
			ctx.rotate(p.rot + age * 4);
			ctx.beginPath();
			for (let j = 0; j < 8; j++) {
				const rr = j % 2 ? r * 0.32 : r,
					a = (j * Math.PI) / 4;
				ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
			}
			ctx.closePath();
			ctx.fillStyle = `rgba(${p.color},${1 - k * k})`;
			ctx.fill();
			ctx.restore();
		}
		// Hearts
		hearts = hearts.filter((h) => now - h.born < h.life);
		for (const h of hearts) {
			const age = (now - h.born) / 1000;
			if (age < 0) continue;
			const p = (age * 1000) / h.life;
			ctx.save();
			ctx.translate(h.x + h.vx * age + Math.sin(age * 5) * 3, h.y + h.vy * age);
			const hs = h.size * (0.6 + 0.4 * Math.min(1, p * 4)) * (1 + (h.grow || 0) * p);
			ctx.scale(hs, hs);
			heartPath(ctx, 1);
			ctx.fillStyle = `rgba(255,128,165,${Math.sin(p * Math.PI)})`;
			ctx.fill();
			ctx.restore();
		}
	}

	function render(now: number) {
		const S = canvas.width / VIEW;
		ctx.setTransform(S, 0, 0, S, 0, 0);
		ctx.clearRect(0, 0, VIEW, VIEW);
		const strain = focusLevel * strainAmount(now);
		const bottom = BODY.cy + BODY.ry;

		// Ground shadow shrinks when he hops
		const lift = clamp(-body.y.x, 0, 40);
		ctx.fillStyle = `rgba(20,37,47,${0.12 - lift * 0.0018})`;
		ctx.beginPath();
		ctx.ellipse(150, bottom + 12, 86 * (1 - lift * 0.01), 8, 0, 0, TAU);
		ctx.fill();

		// Body transform: squash and lean pivot on the bottom, like a weeble
		ctx.save();
		ctx.translate(150, bottom + body.y.x);
		ctx.rotate(body.lean.x);
		ctx.scale(body.sx.x, body.sy.x);
		ctx.translate(-150, -bottom);

		drawAntenna(strain);
		drawShell();

		// Screen: bezel, dark glass, then everything inside is clipped to it
		ctx.save();
		squircle(ctx, SCREEN);
		ctx.lineWidth = 7;
		ctx.strokeStyle = 'rgba(30,80,65,.16)';
		ctx.stroke();
		ctx.fillStyle = '#101827';
		ctx.fill();
		ctx.clip();
		const bg = ctx.createRadialGradient(150, 148, 10, 150, 164, 120);
		bg.addColorStop(0, 'rgba(38,55,76,.6)');
		bg.addColorStop(1, 'rgba(16,24,39,0)');
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, VIEW, VIEW);
		const [gr, gg, gb] = glow;
		const mood = ctx.createRadialGradient(150, 164, 10, 150, 164, 110);
		mood.addColorStop(0, `rgba(${gr | 0},${gg | 0},${gb | 0},${0.09 + 0.05 * strain})`);
		mood.addColorStop(1, 'rgba(16,24,39,0)');
		ctx.fillStyle = mood;
		ctx.fillRect(0, 0, VIEW, VIEW);
		drawEye(0, now, strain);
		drawEye(1, now, strain);
		drawBlush();
		// Glass reflection
		const gl = ctx.createLinearGradient(0, SCREEN.cy - SCREEN.ry, 0, SCREEN.cy - SCREEN.ry * 0.2);
		gl.addColorStop(0, 'rgba(255,255,255,.08)');
		gl.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gl;
		ctx.beginPath();
		ctx.ellipse(122, SCREEN.cy - SCREEN.ry * 0.62, 58, 24, -0.25, 0, TAU);
		ctx.fill();
		ctx.restore();

		ctx.restore();
		drawParticles(now);
	}

	function frame(now: number) {
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		const wanted = mood.current(now);
		if (wanted !== emotion) switchEmotion(wanted);
		const t = reducedMotion ? 0 : now;
		const dizzy = now < dizzyUntil;
		const following = now < lookUntil && emotion !== 'sleep' && emotion !== 'focus' && !dizzy;

		if (auto && emotion !== 'sleep' && !dizzy) {
			if (now >= nextBlink && emotion !== 'focus') {
				blink();
				if (Math.random() < 0.15) blinkQueue = now + 300;
			}
			if (blinkQueue && now > blinkQueue) blink();
			if (now >= nextLook && emotion !== 'focus' && !following) {
				const [bx, by] = EXPRESSIONS[emotion].gaze;
				if (emotion === 'suspicious') {
					gaze.x.t = Math.random() < 0.5 ? -12 : 12;
					gaze.y.t = by;
				} else if (Math.random() < 0.3) {
					gaze.x.t = bx;
					gaze.y.t = by;
				} else {
					gaze.x.t = clamp(bx + random(-11, 11), -14, 14);
					gaze.y.t = clamp(by + random(-7, 7), -10, 10);
				}
				nextLook = now + random(1600, 4200);
			}
		}
		if (following) {
			gaze.x.t = lookAt.x;
			gaze.y.t = lookAt.y;
		}
		if (dizzy) {
			gaze.x.t = 8 * Math.cos(t / 140);
			gaze.y.t = 5 * Math.sin(t / 140);
		}

		// End of a short reaction (poke / dizzy): back to the current emotion
		if (reactUntil && now > reactUntil) {
			reactUntil = 0;
			setEyeTargets(EXPRESSIONS[emotion].eyes);
			[gaze.x.t, gaze.y.t] = EXPRESSIONS[emotion].gaze;
		}
		dizzyLevel += ((dizzy ? 1 : 0) - dizzyLevel) * (1 - Math.exp(-dt * 10));

		// Under the cursor his eyes widen and he blushes; a long hover turns to love (see mood.ts)
		const calm = !['angry', 'focus', 'sleep', 'suspicious'].includes(emotion) && !reactUntil;

		// Focus: schedule straining pushes at irregular intervals
		if (emotion === 'focus' && !reducedMotion && now >= nextStrain) {
			strainStart = now;
			strainDur = random(1400, 2200);
			nextStrain = now + strainDur + random(900, 1900);
		}
		loveLevel += ((emotion === 'love' ? 1 : 0) - loveLevel) * (1 - Math.exp(-dt * 8));
		if (emotion === 'love' && !reducedMotion && now >= nextLove) {
			hearts.push({
				x: 150 + random(-44, 44),
				y: 160 + random(-18, 12),
				vx: random(-18, 18),
				vy: random(-62, -42),
				born: now,
				life: random(1600, 2200),
				size: random(9, 13),
				grow: 1.4
			});
			nextLove = now + random(320, 560);
		}
		focusLevel +=
			((emotion === 'focus' ? 1 : 0) - focusLevel) *
			(1 - Math.exp(-dt * (emotion === 'focus' ? 4 : 12)));
		if (focusLevel > 0.01 && !reducedMotion) rainPhase += dt * (1 + 1.2 * strainAmount(now));

		// Body targets: breathing, happy hop with squash on landing, lean toward the gaze
		const sleeping = emotion === 'sleep';
		const breathe = Math.sin((t * TAU) / (sleeping ? 4200 : 3600));
		const hopping = emotion === 'happy' && !reducedMotion && !reactUntil;
		const hopPhase = Math.abs(Math.sin((t * TAU) / 2600));
		const landing = hopping ? Math.pow(1 - hopPhase, 8) : 0;
		body.sy.t = 1 + (sleeping ? 0.025 : 0.01) * breathe - 0.05 * landing;
		body.sx.t = 1 - (sleeping ? 0.015 : 0.006) * breathe + 0.04 * landing;
		body.y.t = hopping ? -9 * hopPhase : sleeping ? 2 : 0;
		body.lean.t =
			gaze.x.x * 0.0035 +
			(sleeping ? 0.05 : 0) +
			(dizzy ? 0.07 * Math.sin(t / 160) : 0) +
			(emotion === 'love' ? 0.045 * Math.sin(t / 650) : 0);
		antenna.t =
			-body.lean.x * 1.4 + (sleeping ? 0.55 : ['sad', 'tired'].includes(emotion) ? 0.35 : 0);
		eyeScale.t = hovering && calm ? 1.08 : 1;
		blush.t =
			reactUntil && !dizzy
				? 0.75
				: hovering && calm && interactive
					? Math.max(0.6, EXPRESSIONS[emotion].blush)
					: EXPRESSIONS[emotion].blush;

		// Fixed-step physics so springs stay stable whatever the frame rate
		const steps = Math.max(1, Math.ceil(dt * 120)),
			h = dt / steps;
		for (let s = 0; s < steps; s++) {
			for (const sp of springs) stepSpring(sp, h);
			antenna.v -= body.lean.v * 2.2 * h * 60 * 0.1; // the antenna lags behind body motion
		}
		const target = EXPRESSIONS[emotion].glow,
			mix = 1 - Math.exp(-dt * 6);
		glow = glow.map((c, j) => c + (target[j] - c) * mix);

		render(now);
		raf = requestAnimationFrame(frame);
	}

	function resize() {
		const size = canvas.clientWidth;
		if (!size) return;
		const px = Math.round(size * Math.min(2.5, window.devicePixelRatio || 1));
		if (canvas.width !== px) {
			canvas.width = canvas.height = px;
			layer.width = layer.height = px;
		}
	}
	const observer = new ResizeObserver(resize);
	observer.observe(canvas);
	resize();

	// ── Interactions ─────────────────────────────────────────────────────────
	function onPointerMove(e: PointerEvent) {
		const r = canvas.getBoundingClientRect();
		if (!r.width) return;
		const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
		const ny = (e.clientY - (r.top + r.height * 0.52)) / r.height;
		// Far from a small robot the ratio explodes: the clamp keeps the gaze on the screen
		lookAt = { x: clamp(nx * 34, -22, 22), y: clamp(ny * 26, -14, 12) };
		lookUntil = performance.now() + 2200;
	}
	function onEnter() {
		hovering = true;
		mood.hover(true, performance.now());
		blink();
	}
	function onLeave() {
		hovering = false;
		mood.hover(false, performance.now());
	}
	// The antenna, in the 300×300 drawing: the stalk and its ball above the head
	function onAntenna(e: PointerEvent) {
		const r = canvas.getBoundingClientRect();
		const x = ((e.clientX - r.left) / r.width) * VIEW,
			y = ((e.clientY - r.top) / r.height) * VIEW;
		return Math.abs(x - BODY.cx) <= 18 && y >= 18 && y <= BODY.cy - BODY.ry + 6;
	}
	function onPointerDown(e: PointerEvent) {
		if (!interactive) return;
		const now = performance.now();
		if (emotion === 'sleep') {
			squish(); // the click itself wakes him up (onActivity)
			return;
		}
		if (onAntenna(e)) {
			antenna.v += (Math.random() < 0.5 ? -1 : 1) * 14;
			mood.antenna(now, Math.random() < 0.5 ? 'surprised' : 'curious');
			return;
		}
		squish();
		if (now < dizzyUntil) return;
		pokes = pokes.filter((p) => now - p < 1300);
		pokes.push(now);
		if (pokes.length >= 3) {
			pokes = [];
			dizzyUntil = reactUntil = now + 2600;
			return;
		}
		reactUntil = now + 900;
		setEyeTargets(ANNOYED);
	}
	function onActivity() {
		mood.activity(performance.now());
	}
	window.addEventListener('pointermove', onPointerMove, { passive: true });
	window.addEventListener('pointerdown', onActivity, { capture: true, passive: true });
	window.addEventListener('keydown', onActivity, { capture: true, passive: true });
	target.addEventListener('pointerenter', onEnter);
	target.addEventListener('pointerleave', onLeave);
	target.addEventListener('pointerdown', onPointerDown);

	raf = requestAnimationFrame(frame);

	return {
		set: (name) => {
			if (EXPRESSIONS[name]) mood.setBase(name);
		},
		celebrate,
		blink,
		setInteractive: (on) => {
			interactive = on;
		},
		get emotion() {
			return emotion;
		},
		destroy() {
			cancelAnimationFrame(raf);
			clearTimeout(celebrateTimer);
			observer.disconnect();
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerdown', onActivity, { capture: true });
			window.removeEventListener('keydown', onActivity, { capture: true });
			target.removeEventListener('pointerenter', onEnter);
			target.removeEventListener('pointerleave', onLeave);
			target.removeEventListener('pointerdown', onPointerDown);
		}
	};
}
