<!-- Every shell and every expression, on plain <Robot> components (the dock stays hidden). -->
<script lang="ts">
	import { Robot, SHELLS, type Emotion, type RobotLook } from '../../src/lib/svelte.ts';
	import { EMOTIONS } from '../emotions.ts';
	import { NAMES } from '../names.ts';
	import { stage } from '../stage.svelte.ts';

	$effect(() => {
		stage.where = 'hidden';
	});

	let look: RobotLook = $state({ ...stage.look });
	let emotion: Emotion = $state('neutral');
	let robot: ReturnType<typeof Robot> | undefined = $state();
</script>

<section class="intro">
	<h1>Meet the robot</h1>
	<p>
		Eight shells, any colour, twelve expressions. Hover it, poke it, click the top of its head, or
		leave it alone for a minute.
	</p>
</section>

<section class="hero">
	<div class="big">
		<Robot bind:this={robot} {look} {emotion} label="Robot preview" />
	</div>
	<div class="controls">
		<h2>Expressions</h2>
		<div class="chips">
			{#each EMOTIONS as name (name)}
				<button
					class="btn"
					type="button"
					aria-pressed={emotion === name}
					onclick={() => (emotion = name)}>{name}</button
				>
			{/each}
		</div>
		<button class="btn primary" type="button" onclick={() => robot?.celebrate()}>celebrate()</button
		>
		<p class="hint">
			<code>focus</code> is the "thinking" face. Reactions of its own (love on hover, surprise on an antenna
			flick, sleep) take over for a moment, then hand back the expression you set.
		</p>
	</div>
</section>

<section>
	<h2>Shells</h2>
	<p class="hint">Each shell in its own colour. Pick one to try it above.</p>
	<div class="shells">
		{#each SHELLS as shell (shell.id)}
			<button
				type="button"
				class="shell"
				aria-pressed={look.shell === shell.id}
				onclick={() => (look = { shell: shell.id, color: shell.color })}
			>
				<span class="thumb">
					<Robot
						look={{ shell: shell.id, color: shell.color }}
						interactive={false}
						sleepAfter={Infinity}
						decorative
					/>
				</span>
				<span class="name">{NAMES[shell.id]}</span>
				<code>{shell.id}</code>
			</button>
		{/each}
	</div>
</section>

<style>
	section {
		max-width: 1040px;
		margin: 0 auto;
		padding: 24px;
	}
	.intro h1 {
		font-size: 30px;
		margin: 12px 0 6px;
	}
	.intro p,
	.hint {
		color: var(--text-2);
		margin: 0;
	}
	.hint {
		font-size: 13px;
	}
	h2 {
		font-size: 18px;
		margin: 0 0 6px;
	}
	.hero {
		display: flex;
		flex-wrap: wrap;
		gap: 24px 40px;
		align-items: center;
	}
	.big {
		width: min(100%, 300px);
		aspect-ratio: 1;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 28px;
		padding: 16px;
	}
	.controls {
		flex: 1;
		min-width: min(100%, 300px);
		display: grid;
		gap: 14px;
		justify-items: start;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.shells {
		margin-top: 14px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 12px;
	}
	.shell {
		display: grid;
		justify-items: center;
		gap: 4px;
		padding: 16px 8px 12px;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 18px;
	}
	.shell:hover {
		border-color: var(--text-3);
	}
	.shell[aria-pressed='true'] {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent);
	}
	.thumb {
		width: 96px;
		height: 96px;
	}
	.name {
		font-weight: 650;
	}
	.shell code {
		color: var(--text-3);
	}
	@media (max-width: 600px) {
		section {
			padding: 16px;
		}
	}
</style>
