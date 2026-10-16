<!--
	@component
	The animated robot on a square canvas that fills its parent. `emotion` drives his expression;
	`celebrate()` plays the "done!" hop once. `children` render over the canvas (for example a
	button) and share its hover.
-->
<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { createRobot, type Emotion, type Robot } from './engine.ts';

	type Props = {
		emotion?: Emotion;
		/** Pokes tickle him; off, he only follows the cursor and blinks on hover. */
		interactive?: boolean;
		label?: string;
		/** Hidden from assistive technologies, when a control over the robot already names it. */
		decorative?: boolean;
		children?: Snippet;
	};
	let {
		emotion = 'neutral',
		interactive = true,
		label = 'Petit robot animé',
		decorative = false,
		children
	}: Props = $props();

	let root: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let robot: Robot | undefined = $state.raw();
	let asleep = $state(false);

	onMount(() => {
		// The z's are drawn here rather than on the canvas, so they stay readable on a small robot
		robot = createRobot(canvas, {
			interactive,
			target: root,
			sleepZs: false,
			onemotion: (e) => (asleep = e === 'sleep')
		});
		return () => robot?.destroy();
	});
	$effect(() => robot?.set(emotion));
	$effect(() => robot?.setInteractive(interactive));

	export function celebrate() {
		robot?.celebrate();
	}
</script>

<div class="robot" bind:this={root}>
	<div class="face" role="img" aria-label={decorative ? undefined : label} aria-hidden={decorative}>
		<canvas bind:this={canvas} width="300" height="300"></canvas>
	</div>
	{#if asleep}
		<div class="zzz" aria-hidden="true"><span>z</span><span>z</span><span>z</span></div>
	{/if}
	{@render children?.()}
</div>

<style>
	.robot,
	.face {
		position: relative;
		width: 100%;
		height: 100%;
	}
	.robot {
		container-type: size;
	}
	/* Sleep z's rising from above the head, over the edges of the canvas if need be */
	.zzz {
		position: absolute;
		left: 64%;
		top: 14%;
		pointer-events: none;
		font:
			800 clamp(13px, 15cqw, 26px) / 1 Inter,
			ui-sans-serif,
			sans-serif;
		color: #4a6876;
		text-shadow:
			0 0 3px #fff,
			0 0 3px #fff;
	}
	.zzz span {
		position: absolute;
		left: 0;
		bottom: 0;
		opacity: 0;
		animation: z-rise 3.6s linear infinite;
	}
	.zzz span:nth-child(2) {
		animation-delay: 1.2s;
	}
	.zzz span:nth-child(3) {
		animation-delay: 2.4s;
	}
	@keyframes z-rise {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.6);
		}
		25% {
			opacity: 1;
		}
		75% {
			opacity: 0.9;
		}
		100% {
			opacity: 0;
			transform: translate(1.1em, -2.8em) scale(1.6);
		}
	}
	/* Without motion: three still z's, growing up and to the right */
	@media (prefers-reduced-motion: reduce) {
		.zzz span {
			opacity: 1;
		}
		.zzz span:nth-child(2) {
			transform: translate(0.5em, -1.2em) scale(1.15);
		}
		.zzz span:nth-child(3) {
			transform: translate(1em, -2.5em) scale(1.4);
		}
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: manipulation;
	}
</style>
