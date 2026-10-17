<script lang="ts">
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import SunMoon from '@lucide/svelte/icons/sun-moon';
	import { RobotDock } from '../src/lib/svelte.ts';
	import { stage } from './stage.svelte.ts';
	import Gallery from './scenes/Gallery.svelte';
	import Store from './scenes/Store.svelte';
	import Chat from './scenes/Chat.svelte';
	import Customize from './scenes/Customize.svelte';

	const SCENES = [
		{ id: 'gallery', name: 'Gallery', component: Gallery },
		{ id: 'store', name: 'Store widget', component: Store },
		{ id: 'chat', name: 'Chat', component: Chat },
		{ id: 'customize', name: 'Customize', component: Customize }
	] as const;

	const fromHash = () => SCENES.find((s) => `#${s.id}` === location.hash) ?? SCENES[0];
	let current = $state(fromHash());
	const Scene = $derived(current.component);

	// Light, dark, or the system's: kept per browser, applied as data-theme on <html>
	const THEMES = ['system', 'light', 'dark'] as const;
	const THEME_ICONS = { system: SunMoon, light: Sun, dark: Moon };
	const THEME_KEY = 'robot-buddy-showcase-theme';
	let theme: (typeof THEMES)[number] = $state('system');
	try {
		theme = THEMES.find((t) => t === localStorage.getItem(THEME_KEY)) ?? 'system';
	} catch {
		// Storage blocked: follow the system
	}
	$effect(() => {
		if (theme === 'system') delete document.documentElement.dataset.theme;
		else document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			// Storage blocked: the choice lasts until reload
		}
	});

	let dock: ReturnType<typeof RobotDock> | undefined = $state();
	$effect(() => {
		stage.celebrate = () => dock?.celebrate();
	});
</script>

<svelte:window onhashchange={() => (current = fromHash())} />

<header>
	<a class="brand" href="#gallery">robot-buddy <span>showcase</span></a>
	<nav aria-label="Scenes">
		{#each SCENES as scene (scene.id)}
			<a href="#{scene.id}" aria-current={scene.id === current.id ? 'page' : undefined}
				>{scene.name}</a
			>
		{/each}
	</nav>
	<div class="theme" role="radiogroup" aria-label="Theme">
		{#each THEMES as name (name)}
			{@const Icon = THEME_ICONS[name]}
			<button
				type="button"
				role="radio"
				aria-checked={theme === name}
				aria-label="{name} theme"
				title="{name[0].toUpperCase()}{name.slice(1)} theme"
				onclick={() => (theme = name)}><Icon size={16} aria-hidden="true" /></button
			>
		{/each}
	</div>
</header>

<main>
	{#key current.id}
		<Scene />
	{/key}
</main>

<!-- One dock for the whole app, as in a real host: scenes only tell it where to go -->
<RobotDock
	bind:this={dock}
	where={stage.where}
	emotion={stage.emotion}
	look={stage.look}
	label="Open the assistant"
	onactivate={() => stage.onactivate?.()}
/>

<style>
	/* The header stays put and scenes scroll below it, so the chat can fill the rest exactly */
	:global(#app) {
		height: 100dvh;
		display: flex;
		flex-direction: column;
	}
	main {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px 24px;
		padding: 12px 24px;
		background: var(--panel);
		border-bottom: 1px solid var(--border);
	}
	.brand {
		font-weight: 750;
		color: var(--text);
		text-decoration: none;
	}
	.brand span {
		font-weight: 500;
		color: var(--text-3);
	}
	.theme {
		display: flex;
		padding: 3px;
		border: 1px solid var(--border);
		border-radius: 999px;
	}
	.theme button {
		border: 0;
		background: none;
		border-radius: 999px;
		display: grid;
		place-items: center;
		padding: 5px 9px;
		color: var(--text-3);
	}
	.theme button:hover {
		color: var(--text);
	}
	.theme button[aria-checked='true'] {
		background: var(--hover);
		color: var(--text);
	}
	nav {
		display: flex;
		margin-left: auto;
		flex-wrap: wrap;
		gap: 4px;
	}
	nav a {
		padding: 6px 12px;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-2);
		text-decoration: none;
	}
	nav a:hover {
		background: var(--hover);
	}
	nav a[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--accent);
	}
	@media (max-width: 600px) {
		header {
			padding: 10px 16px;
		}
	}
</style>
