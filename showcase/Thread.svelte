<!-- Messages, typing dots, suggestions and the input: shared by the store widget and the chat. -->
<script lang="ts">
	import { SUGGESTIONS, type createConversation } from './conversation.svelte.ts';

	let {
		conversation,
		placeholder = 'Message the assistant…',
		autofocus = false
	}: {
		conversation: ReturnType<typeof createConversation>;
		placeholder?: string;
		autofocus?: boolean;
	} = $props();

	let draft = $state('');
	let list: HTMLDivElement;
	let input: HTMLInputElement;

	$effect(() => {
		if (autofocus) input.focus();
	});
	// Keep the latest message in view
	$effect(() => {
		void conversation.messages.length;
		void conversation.thinking;
		list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
	});

	function send(text: string) {
		conversation.send(text);
		draft = '';
	}
</script>

<div class="thread">
	<div class="messages" bind:this={list} aria-live="polite">
		{#each conversation.messages as message, i (i)}
			<p class="msg {message.from}">{message.text}</p>
		{/each}
		{#if conversation.thinking}
			<p class="msg bot typing" aria-label="The assistant is typing">
				<span></span><span></span><span></span>
			</p>
		{/if}
	</div>
	{#if conversation.messages.length === 1}
		<div class="suggestions">
			{#each SUGGESTIONS as text (text)}
				<button class="btn" type="button" onclick={() => send(text)}>{text}</button>
			{/each}
		</div>
	{/if}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			send(draft);
		}}
	>
		<input bind:this={input} bind:value={draft} {placeholder} aria-label="Message" />
		<button class="btn primary" type="submit" disabled={!draft.trim() || conversation.thinking}
			>Send</button
		>
	</form>
</div>

<style>
	.thread {
		display: flex;
		flex-direction: column;
		min-height: 0;
		height: 100%;
	}
	.messages {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 2px;
	}
	.msg {
		margin: 0;
		max-width: 85%;
		padding: 9px 13px;
		border-radius: 16px;
		font-size: 14px;
		overflow-wrap: anywhere;
	}
	.msg.bot {
		align-self: flex-start;
		background: var(--hover);
		border-bottom-left-radius: 4px;
	}
	.msg.user {
		align-self: flex-end;
		background: var(--accent);
		color: #fff;
		border-bottom-right-radius: 4px;
	}
	.typing {
		display: flex;
		gap: 4px;
		padding: 13px 14px;
	}
	.typing span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-3);
		animation: bounce 1.2s ease-in-out infinite;
	}
	.typing span:nth-child(2) {
		animation-delay: 0.15s;
	}
	.typing span:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes bounce {
		0%,
		60%,
		100% {
			transform: none;
			opacity: 0.5;
		}
		30% {
			transform: translateY(-4px);
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.typing span {
			animation: none;
		}
	}
	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding-bottom: 10px;
	}
	form {
		display: flex;
		gap: 8px;
	}
	input {
		flex: 1;
		min-width: 0;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 8px 14px;
		background: var(--panel);
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
