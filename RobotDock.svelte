<!--
	@component
	One robot for the whole app: over the page's RobotAnchor (`where="anchor"`), or waiting in the
	bottom-right corner as a button (`where="corner"`). Mount it once in a layout that stays across
	navigations, so the robot keeps its state from page to page.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import Robot from './Robot.svelte';
	import { anchor } from './anchor.svelte.ts';
	import type { Emotion } from './engine.ts';

	type Where = 'anchor' | 'corner' | 'hidden';
	type Props = {
		where: Where;
		emotion?: Emotion;
		/** Accessible name of the corner button. */
		label?: string;
		/** Corner button pressed. */
		onactivate?: () => void;
	};
	let { where, emotion = 'neutral', label = 'Ouvrir', onactivate }: Props = $props();

	type Rect = { top: number; left: number; size: number };
	let rect: Rect | null = $state(null);
	let robot: ReturnType<typeof Robot> | undefined = $state();

	// Teleport: the robot vanishes where it stands (out), moves, then appears at its new place (in).
	// The animations below read these durations through --out and --in.
	const OUT_MS = 250,
		IN_MS = 320;

	/** Where the robot is drawn; `goal` is where it is heading. */
	let shown: Where = $state('hidden');
	let phase: 'idle' | 'out' | 'in' = $state('idle');
	let goal: Where | null = null;
	let timer = 0;

	// An anchor that is not mounted yet keeps the robot where it is until the page shows it.
	$effect(() => {
		const target = where === 'anchor' && !anchor.el ? null : where;
		if (target) untrack(() => go(target));
	});
	$effect(() => () => clearTimeout(timer));

	function go(target: Where) {
		if (target === goal) return;
		const first = goal === null;
		goal = target;
		clearTimeout(timer);
		if (first || matchMedia('(prefers-reduced-motion: reduce)').matches) {
			move(target);
			phase = 'idle';
		} else if (shown === 'hidden') arrive(target);
		else {
			phase = 'out';
			timer = window.setTimeout(() => arrive(target), OUT_MS);
		}
	}
	function arrive(target: Where) {
		move(target);
		if (target === 'hidden') {
			phase = 'idle';
			return;
		}
		phase = 'in';
		timer = window.setTimeout(() => (phase = 'idle'), IN_MS);
	}
	function move(target: Where) {
		if (target !== 'anchor') rect = null; // measured again on the next visit
		shown = target;
	}

	// Follow the anchor every frame: it moves with the page layout (a growing composer, a resize).
	$effect(() => {
		const el = anchor.el;
		if (shown !== 'anchor' || !el) return;
		let raf = 0;
		const follow = () => {
			const r = el.getBoundingClientRect();
			const next = { top: r.top, left: r.left, size: Math.min(r.width, r.height) };
			if (!rect || rect.top !== next.top || rect.left !== next.left || rect.size !== next.size)
				rect = next;
			raf = requestAnimationFrame(follow);
		};
		follow();
		return () => cancelAnimationFrame(raf);
	});

	export function celebrate() {
		robot?.celebrate();
	}
</script>

<div
	class="dock"
	data-where={shown}
	data-phase={phase}
	data-emotion={emotion}
	style="--out:{OUT_MS}ms;--in:{IN_MS}ms;{shown === 'anchor' && rect
		? `top:${rect.top}px;left:${rect.left}px;width:${rect.size}px;height:${rect.size}px`
		: ''}"
	hidden={shown === 'hidden' || (shown === 'anchor' && !rect)}
>
	<div class="stage">
		<Robot
			bind:this={robot}
			{emotion}
			interactive={shown === 'anchor'}
			decorative={shown === 'corner'}
		>
			{#if shown === 'corner'}
				<button class="open" type="button" aria-label={label} title={label} onclick={onactivate}
				></button>
			{/if}
		</Robot>
	</div>
</div>

<style>
	.dock {
		position: fixed;
		/* Above the page, below its menus and overlays (raise it in a page that needs it). */
		z-index: var(--robot-z, 15);
	}
	/* Between the welcome and the chat, the robot shrinks or grows instead of teleporting. */
	.dock[data-where='anchor'][data-phase='idle'] {
		transition:
			top 0.3s ease,
			left 0.3s ease,
			width 0.3s ease,
			height 0.3s ease;
	}
	.dock[data-where='corner'] {
		right: 20px;
		bottom: 20px;
		width: var(--robot-corner-size, 72px);
		height: var(--robot-corner-size, 72px);
	}
	@media (max-width: 760px) {
		.dock[data-where='corner'] {
			right: 12px;
			bottom: calc(12px + env(safe-area-inset-bottom, 0px));
			width: var(--robot-corner-size-narrow, 48px);
			height: var(--robot-corner-size-narrow, 48px);
		}
	}
	.stage {
		position: relative;
		width: 100%;
		height: 100%;
		transform-origin: 50% 60%;
		--glow: var(--robot-glow, rgba(127, 211, 181, 0.85));
	}
	/* Flash of light around the robot, and a beam it collapses into or stretches out of */
	.stage::before,
	.stage::after {
		content: '';
		position: absolute;
		pointer-events: none;
		opacity: 0;
	}
	.stage::after {
		inset: -25%;
		border-radius: 50%;
		background: radial-gradient(circle, var(--glow) 0%, transparent 62%);
	}
	.stage::before {
		left: calc(50% - 2px);
		width: 4px;
		top: -20%;
		bottom: -10%;
		border-radius: 2px;
		background: linear-gradient(transparent, #fff 30%, #fff 70%, transparent);
		box-shadow: 0 0 12px 3px var(--glow);
	}
	[data-phase='out'] .stage {
		animation: teleport-out var(--out) ease-in forwards;
	}
	[data-phase='out'] .stage::after {
		animation: flash-out var(--out) ease-out;
	}
	[data-phase='out'] .stage::before {
		animation: beam-out var(--out) ease-in;
	}
	[data-phase='in'] .stage {
		animation: teleport-in var(--in) ease-out;
	}
	[data-phase='in'] .stage::after {
		animation: flash-in var(--in) ease-out;
	}
	[data-phase='in'] .stage::before {
		animation: beam-in var(--in) ease-out;
	}
	@keyframes teleport-out {
		35% {
			transform: scale(1.12, 0.82);
			filter: brightness(1.4);
		}
		100% {
			transform: scale(0.06, 1.5);
			filter: brightness(2.2);
			opacity: 0;
		}
	}
	@keyframes flash-out {
		60% {
			opacity: 0.9;
			transform: scale(1.1);
		}
		100% {
			opacity: 0;
			transform: scale(0.4);
		}
	}
	@keyframes beam-out {
		60% {
			opacity: 0;
			transform: scaleY(0.4);
		}
		85% {
			opacity: 1;
			transform: scaleY(1);
		}
		100% {
			opacity: 0;
			transform: scaleY(1.3);
		}
	}
	@keyframes teleport-in {
		0% {
			transform: scale(0.06, 1.6);
			filter: brightness(2.2);
			opacity: 0;
		}
		45% {
			transform: scale(1.15, 0.85);
			filter: brightness(1.4);
			opacity: 1;
		}
		72% {
			transform: scale(0.95, 1.06);
		}
		100% {
			transform: none;
			filter: none;
		}
	}
	@keyframes flash-in {
		0% {
			opacity: 0.9;
			transform: scale(0.5);
		}
		100% {
			opacity: 0;
			transform: scale(1.2);
		}
	}
	@keyframes beam-in {
		0% {
			opacity: 1;
			transform: scaleY(1.3);
		}
		40% {
			opacity: 0;
			transform: scaleY(0.4);
		}
		100% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dock,
		.stage,
		.stage::before,
		.stage::after {
			animation: none !important;
			transition: none !important;
		}
	}
	.open {
		position: absolute;
		inset: 0;
		border: 0;
		padding: 0;
		background: transparent;
		border-radius: 30%;
		cursor: pointer;
	}
	.open:focus-visible {
		outline: 2px solid var(--robot-focus, currentColor);
		outline-offset: 2px;
	}
</style>
