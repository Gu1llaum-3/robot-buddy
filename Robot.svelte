<!--
	@component
	The animated robot on a square canvas that fills its parent. `emotion` drives his expression;
	`celebrate()` plays the "done!" hop once.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { createRobot, type Emotion, type Robot } from './engine.ts';

	type Props = {
		emotion?: Emotion;
		/** Pokes tickle him; off, the canvas only follows the cursor (for example inside a button). */
		interactive?: boolean;
		label?: string;
	};
	let { emotion = 'neutral', interactive = true, label = 'Petit robot animé' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let robot: Robot | undefined = $state.raw();

	onMount(() => {
		robot = createRobot(canvas, { interactive });
		return () => robot?.destroy();
	});
	$effect(() => robot?.set(emotion));
	$effect(() => robot?.setInteractive(interactive));

	export function celebrate() {
		robot?.celebrate();
	}
</script>

<div class="robot" role="img" aria-label={label}>
	<canvas bind:this={canvas} width="300" height="300"></canvas>
</div>

<style>
	.robot {
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
