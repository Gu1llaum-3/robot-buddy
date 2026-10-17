<!--
	A full-page assistant, ChatGPT style: the robot stands above the conversation on a RobotAnchor.
	Large on the welcome screen, it shrinks once the chat starts (the dock follows the anchor's size).
-->
<script lang="ts">
	import { RobotAnchor } from '../../src/lib/svelte.ts';
	import Thread from '../Thread.svelte';
	import { createConversation } from '../conversation.svelte.ts';
	import { stage } from '../stage.svelte.ts';

	const HISTORY = ['Order #A-2047', 'Return a jacket', 'Gift ideas under $30', 'Size guide'];

	const conversation = createConversation(
		'Ask me anything. While I think, I put on my focus face.'
	);
	const started = $derived(conversation.messages.length > 1);

	$effect(() => {
		stage.where = 'anchor';
		stage.emotion = 'neutral';
		return () => conversation.stop();
	});
</script>

<div class="app">
	<aside>
		<button class="btn" type="button" onclick={() => location.reload()}>+ New chat</button>
		<p class="label">Recent</p>
		<ul>
			{#each HISTORY as title (title)}
				<li>{title}</li>
			{/each}
		</ul>
	</aside>
	<section class="main">
		<div class="top" class:started>
			<RobotAnchor class={started ? 'chat-robot small' : 'chat-robot'} />
			{#if !started}
				<h1>How can I help you today?</h1>
				<p>The robot reacts to what you say. Try a suggestion below, or type your own.</p>
			{/if}
		</div>
		<div class="thread">
			<Thread {conversation} autofocus />
		</div>
	</section>
</div>

<style>
	.app {
		display: grid;
		grid-template-columns: 240px 1fr;
		height: 100%;
	}
	aside {
		border-right: 1px solid var(--border);
		background: var(--panel);
		padding: 16px;
	}
	aside .btn {
		width: 100%;
	}
	.label {
		margin: 20px 0 6px;
		font-size: 12px;
		font-weight: 700;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		padding: 7px 10px;
		border-radius: 8px;
		font-size: 14px;
		color: var(--text-2);
	}
	li:first-child {
		background: var(--hover);
		color: var(--text);
	}
	.main {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 760px;
		margin: 0 auto;
		padding: 16px 24px 24px;
		min-height: 0;
	}
	.top {
		display: grid;
		justify-items: center;
		text-align: center;
		padding-top: 6vh;
		transition: padding 0.3s ease;
	}
	.top.started {
		padding-top: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.top {
			transition: none;
		}
	}
	.top :global(.chat-robot) {
		width: 150px;
		height: 150px;
	}
	.top :global(.chat-robot.small) {
		width: 72px;
		height: 72px;
	}
	.top h1 {
		font-size: 26px;
		margin: 12px 0 4px;
	}
	.top p {
		margin: 0;
		color: var(--text-2);
	}
	.thread {
		flex: 1;
		min-height: 0;
	}
	@media (max-width: 760px) {
		.app {
			grid-template-columns: 1fr;
		}
		aside {
			display: none;
		}
		.main {
			padding: 12px 16px 16px;
		}
	}
</style>
