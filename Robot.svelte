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

	onMount(() => {
		robot = createRobot(canvas, { interactive, target: root });
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
	{@render children?.()}
</div>

<style>
	.robot,
	.face {
		position: relative;
		width: 100%;
		height: 100%;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: manipulation;
	}
</style>
