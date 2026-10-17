<!--
	RobotLookPicker with a live preview. The chosen look is kept in localStorage and dresses the
	robot in the other scenes, as a host would save it in each user's settings.
-->
<script lang="ts">
	import { RobotLookPicker, type RobotLook } from '../../src/lib/svelte.ts';
	import { NAMES, PICKER_LABELS } from '../names.ts';
	import { saveLook, stage } from '../stage.svelte.ts';

	$effect(() => {
		stage.where = 'hidden';
	});

	let look: RobotLook = $state({ ...stage.look });
	$effect(() => saveLook(look));
</script>

<section>
	<h1>Make it yours</h1>
	<p class="lead">
		Pick a shell, then repaint it. Your choice is saved in this browser and used by the robot in the
		store and the chat.
	</p>
	<div class="card">
		<RobotLookPicker bind:look labels={PICKER_LABELS} names={NAMES} />
	</div>
	<h2>What to store</h2>
	<p class="lead">
		The look is two strings. Run whatever you read back through <code>normalizeLook</code>: an
		unknown shell or a bad colour falls back to a safe default.
	</p>
	<pre><code
			>{`import { normalizeLook } from 'robot-buddy';

// saved: ${JSON.stringify(look)}
const look = normalizeLook(user.robotLook);`}</code
		></pre>
</section>

<style>
	section {
		max-width: 760px;
		margin: 0 auto;
		padding: 24px;
	}
	h1 {
		font-size: 30px;
		margin: 12px 0 6px;
	}
	h2 {
		font-size: 18px;
		margin: 32px 0 6px;
	}
	.lead {
		color: var(--text-2);
		margin: 0;
	}
	.card {
		margin-top: 20px;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 22px;
		padding: 20px;
	}
	pre {
		margin: 12px 0 0;
		padding: 14px 16px;
		border-radius: 14px;
		background: var(--code-bg);
		color: #e7ecef;
		overflow-x: auto;
	}
	pre code {
		background: none;
		padding: 0;
	}
	@media (max-width: 600px) {
		section {
			padding: 16px;
		}
	}
</style>
