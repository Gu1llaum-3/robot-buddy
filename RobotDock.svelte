<!--
	@component
	One robot for the whole app: over the page's RobotAnchor (`where="anchor"`), or waiting in the
	bottom-right corner as a button (`where="corner"`). Mount it once in a layout that stays across
	navigations, so the robot keeps its state from page to page.
-->
<script lang="ts">
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

	// Where the robot is drawn: an anchor that is not mounted yet keeps it where it is.
	let shown: Where = $state('hidden');
	$effect(() => {
		const target = where === 'anchor' && !anchor.el ? null : where;
		if (target) shown = target;
	});

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
	style={shown === 'anchor' && rect
		? `top:${rect.top}px;left:${rect.left}px;width:${rect.size}px;height:${rect.size}px`
		: undefined}
	hidden={shown === 'hidden'}
>
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

<style>
	.dock {
		position: fixed;
		z-index: 40;
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
