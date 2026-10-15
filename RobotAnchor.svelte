<!--
	@component
	Reserves the robot's place in a page: give it a size (class or style), and a RobotDock set to
	`where="anchor"` stands over it, following its position and size.
-->
<script lang="ts">
	import { anchor } from './anchor.svelte.ts';

	let { class: cls = '', style = '' }: { class?: string; style?: string } = $props();
	let el: HTMLDivElement;

	$effect(() => {
		anchor.el = el;
		return () => {
			if (anchor.el === el) anchor.el = null;
		};
	});
</script>

<div bind:this={el} class={cls} {style} aria-hidden="true"></div>
