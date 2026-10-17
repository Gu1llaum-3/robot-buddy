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
	let party: ReturnType<typeof Robot> | undefined = $state();
	let partyMood: Emotion = $state('sad');

	// Falling asleep: the demo robot dozes after SLEEP_DEMO ms without a click or a key, drowsy
	// (tired) for the last DROWSY_DEMO ms. The bar mirrors that timing; it does not drive it.
	const SLEEP_DEMO = 10_000,
		DROWSY_DEMO = 5_000;
	let lastActivity = $state(performance.now());
	let now = $state(performance.now());
	$effect(() => {
		const tick = setInterval(() => (now = performance.now()), 200);
		return () => clearInterval(tick);
	});
	const idle = $derived(Math.min(SLEEP_DEMO, now - lastActivity));
	const phase = $derived(
		idle >= SLEEP_DEMO ? 'Asleep' : idle >= SLEEP_DEMO - DROWSY_DEMO ? 'Drowsy…' : 'Awake'
	);
</script>

<svelte:window
	onpointerdowncapture={() => (lastActivity = performance.now())}
	onkeydowncapture={() => (lastActivity = performance.now())}
/>

<section class="intro">
	<h1>Meet the robot</h1>
	<p>
		Eight shells, any colour, twelve expressions. Hover it, poke it, click the top of its head, or
		leave it alone for a minute.
	</p>
</section>

<section class="hero">
	<div class="big">
		<Robot {look} {emotion} label="Robot preview" />
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
		<p class="hint">
			<code>focus</code> is the "thinking" face. Reactions of its own (see Animations below) take over
			for a moment, then hand back the expression you set.
		</p>
	</div>
</section>

<section>
	<h2>Animations</h2>
	<p class="hint">One-off moves and the robot's own reactions, each on its own robot.</p>
	<div class="cards">
		<article>
			<div class="stage">
				<Robot bind:this={party} {look} emotion={partyMood} label="Celebrating robot" />
			</div>
			<h3>Celebrate</h3>
			<p>
				<code>celebrate()</code>: blink, squash, a big hop and sparkles. Happy for a moment, then
				back to the expression it had. Call it when a task is done.
			</p>
			<div class="row">
				<span class="hint">Start from</span>
				{#each ['neutral', 'sad', 'focus'] as const as name (name)}
					<button
						class="btn"
						type="button"
						aria-pressed={partyMood === name}
						onclick={() => (partyMood = name)}>{name}</button
					>
				{/each}
			</div>
			<button class="btn primary" type="button" onclick={() => party?.celebrate()}>Celebrate</button
			>
		</article>

		<article>
			<div class="stage">
				<Robot {look} sleepAfter={SLEEP_DEMO} label="Robot falling asleep" />
			</div>
			<h3>Falling asleep</h3>
			<p>
				After <code>sleepAfter</code> without a click or a key, it gets drowsy, then dozes off. This
				one sleeps after {SLEEP_DEMO / 1000} s (60 s by default). Click anywhere to wake it up.
			</p>
			<div class="meter" aria-hidden="true">
				<span style:width="{(idle / SLEEP_DEMO) * 100}%"></span>
				<i style:left="{((SLEEP_DEMO - DROWSY_DEMO) / SLEEP_DEMO) * 100}%"></i>
			</div>
			<p class="phase" aria-live="polite">{phase}</p>
		</article>

		<article>
			<div class="stage"><Robot {look} sleepAfter={Infinity} label="Robot to play with" /></div>
			<h3>Reactions</h3>
			<ul>
				<li><strong>Hover</strong> it for a second: love</li>
				<li><strong>Click the top</strong> of its head: surprised or curious</li>
				<li><strong>Poke</strong> it: tickled; three quick pokes: dizzy</li>
				<li><strong>Wake</strong> it from sleep: a start</li>
			</ul>
		</article>
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
	.cards {
		margin-top: 14px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 290px), 1fr));
		gap: 16px;
	}
	article {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 18px;
	}
	.stage {
		align-self: center;
		width: 140px;
		height: 140px;
	}
	h3 {
		font-size: 16px;
		margin: 4px 0 0;
	}
	article p,
	article ul {
		margin: 0;
		font-size: 14px;
		color: var(--text-2);
	}
	article ul {
		padding-left: 18px;
	}
	article strong,
	article .phase {
		color: var(--text);
	}
	.phase {
		font-weight: 650;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: auto;
	}
	.meter {
		position: relative;
		align-self: stretch;
		height: 6px;
		margin-top: auto;
		border-radius: 3px;
		background: var(--hover);
	}
	.meter span {
		display: block;
		height: 100%;
		border-radius: 3px;
		background: var(--accent);
	}
	/* Where drowsiness starts */
	.meter i {
		position: absolute;
		top: -3px;
		width: 2px;
		height: 12px;
		background: var(--text-3);
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
