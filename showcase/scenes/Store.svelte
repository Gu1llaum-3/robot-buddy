<!--
	The classic e-commerce helper: the robot waits in the bottom-right corner as a button, then
	teleports into the header of the chat panel it opens (RobotDock `corner` → `anchor`).
-->
<script lang="ts">
	import { RobotAnchor } from '../../src/lib/svelte.ts';
	import Thread from '../Thread.svelte';
	import { createConversation } from '../conversation.svelte.ts';
	import { stage } from '../stage.svelte.ts';

	const PRODUCTS = [
		{ name: 'Linen overshirt', price: 59, tone: ['#e9dcc9', '#c9b391'] },
		{ name: 'Ceramic mug', price: 18, tone: ['#cfe3ea', '#87aebd'] },
		{ name: 'Wool beanie', price: 25, tone: ['#f3c9b9', '#d98b70'] },
		{ name: 'Canvas tote', price: 32, tone: ['#dfe6cf', '#9fb27a'] },
		{ name: 'Desk lamp', price: 79, tone: ['#f1e2a6', '#d1b04c'] },
		{ name: 'Scented candle', price: 22, tone: ['#e3d8f1', '#a893cf'] }
	];

	let open = $state(false);
	let teaser = $state(true);
	const conversation = createConversation(
		"Hi! I'm the shop assistant. Questions about an order, a return, or a product?"
	);

	$effect(() => {
		stage.where = open ? 'anchor' : 'corner';
	});
	$effect(() => {
		stage.emotion = 'neutral';
		stage.onactivate = () => {
			open = true;
			teaser = false;
		};
		return () => {
			stage.onactivate = undefined;
			conversation.stop();
		};
	});
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="shop">
	<div class="banner">
		<p class="eyebrow">Autumn collection</p>
		<h1>Slow goods for cosy days</h1>
		<p>
			A pretend store. The robot waits in the corner: click it to open the help panel, and watch it
			teleport into the panel's header.
		</p>
	</div>
	<div class="grid">
		{#each PRODUCTS as product (product.name)}
			<article>
				<div
					class="photo"
					style:background="linear-gradient(135deg, {product.tone[0]}, {product.tone[1]})"
				></div>
				<h2>{product.name}</h2>
				<p>${product.price}</p>
				<button class="btn" type="button" onclick={() => stage.celebrate()}>Add to cart</button>
			</article>
		{/each}
	</div>
</div>

{#if teaser && !open}
	<button class="teaser" type="button" onclick={() => stage.onactivate?.()}>
		Need help? <span aria-hidden="true">👋</span>
	</button>
{/if}

{#if open}
	<div class="panel" role="dialog" aria-label="Shop assistant">
		<div class="head">
			<RobotAnchor class="panel-robot" />
			<div>
				<strong>Shop assistant</strong>
				<small>Usually replies instantly</small>
			</div>
			<button class="close" type="button" aria-label="Close" onclick={() => (open = false)}
				>×</button
			>
		</div>
		<div class="body">
			<Thread {conversation} autofocus placeholder="Ask about an order…" />
		</div>
	</div>
{/if}

<style>
	.shop {
		max-width: 1040px;
		margin: 0 auto;
		padding: 24px 24px 120px;
	}
	.banner {
		padding: 36px 32px;
		border-radius: 24px;
		background: var(--banner);
		margin-bottom: 24px;
	}
	.banner h1 {
		font-size: clamp(24px, 4vw, 34px);
		margin: 4px 0 8px;
	}
	.banner p {
		margin: 0;
		color: var(--text-2);
		max-width: 52ch;
	}
	.banner .eyebrow {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--eyebrow);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 16px;
	}
	article {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 18px;
		padding: 12px 12px 16px;
	}
	.photo {
		aspect-ratio: 4 / 3;
		border-radius: 12px;
		filter: var(--photo);
	}
	article h2 {
		font-size: 15px;
		margin: 12px 0 2px;
	}
	article p {
		margin: 0 0 10px;
		color: var(--text-2);
	}
	/* Just left of the 72px corner robot */
	.teaser {
		position: fixed;
		right: 104px;
		bottom: 36px;
		z-index: 14;
		border: 1px solid var(--border);
		background: var(--panel);
		border-radius: 16px 16px 4px 16px;
		padding: 8px 14px;
		font-size: 14px;
		font-weight: 600;
		box-shadow: 0 8px 24px var(--shadow);
	}
	.panel {
		position: fixed;
		right: 20px;
		bottom: 20px;
		z-index: 12;
		width: min(380px, calc(100vw - 32px));
		height: min(560px, calc(100vh - 96px));
		display: flex;
		flex-direction: column;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 22px;
		box-shadow: 0 24px 60px var(--shadow);
		overflow: hidden;
		animation: rise 0.22s ease-out;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.panel {
			animation: none;
		}
	}
	.head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		background: var(--accent-soft);
	}
	.head :global(.panel-robot) {
		width: 56px;
		height: 56px;
		flex: none;
	}
	.head div {
		flex: 1;
		display: grid;
	}
	.head small {
		color: var(--text-2);
	}
	.close {
		border: 0;
		background: none;
		font-size: 24px;
		line-height: 1;
		color: var(--text-2);
		padding: 4px 8px;
		border-radius: 8px;
	}
	.close:hover {
		background: var(--hover);
	}
	.body {
		flex: 1;
		min-height: 0;
		padding: 0 14px 14px;
	}
	@media (max-width: 760px) {
		.shop {
			padding: 16px 16px 96px;
		}
		.banner {
			padding: 24px 20px;
		}
		.teaser {
			right: 72px;
			bottom: 22px;
		}
		.panel {
			right: 16px;
			bottom: 16px;
		}
	}
</style>
