<!--
	@component
	Choice of the robot's shell and colour, with a live preview: `bind:look` to read it. Saving is
	up to the host (for example hidden form fields fed from `look`).
-->
<script lang="ts">
	import Robot from './Robot.svelte';
	import { DEFAULT_LOOK, ROBOT_COLORS, SHELLS, suggestedColor, type RobotLook } from './looks.ts';

	let { look = $bindable({ ...DEFAULT_LOOK }) }: { look?: RobotLook } = $props();

	// A new shell brings its own colour, unless a colour of one's own was picked.
	function pickShell(shell: RobotLook['shell']) {
		const color = look.color === suggestedColor(look.shell) ? suggestedColor(shell) : look.color;
		look = { shell, color };
	}
	const pickColor = (color: string) => (look = { ...look, color: color.toLowerCase() });
	const isPreset = $derived(ROBOT_COLORS.some((c) => c.hex === look.color));
</script>

<div class="picker">
	<div class="preview"><Robot {look} label="Aperçu du robot" /></div>
	<div class="choices">
		<fieldset>
			<legend>Coque</legend>
			<div class="shells">
				{#each SHELLS as shell (shell.id)}
					<label class="shell" title={shell.name}>
						<input
							type="radio"
							name="robot-shell"
							value={shell.id}
							checked={look.shell === shell.id}
							onchange={() => pickShell(shell.id)}
						/>
						<span class="thumb"
							><Robot
								look={{ shell: shell.id, color: look.color }}
								interactive={false}
								decorative
							/></span
						>
						<span class="name">{shell.name}</span>
					</label>
				{/each}
			</div>
		</fieldset>
		<fieldset>
			<legend>Couleur</legend>
			<div class="colors">
				{#each ROBOT_COLORS as color (color.hex)}
					<label class="swatch" title={color.name}>
						<input
							type="radio"
							name="robot-color"
							value={color.hex}
							checked={look.color === color.hex}
							onchange={() => pickColor(color.hex)}
						/>
						<span style:background={color.hex}></span>
						<span class="sr">{color.name}</span>
					</label>
				{/each}
				<label class="free" class:on={!isPreset}>
					<input
						type="color"
						value={look.color}
						oninput={(e) => pickColor(e.currentTarget.value)}
					/>Couleur libre
				</label>
			</div>
		</fieldset>
	</div>
</div>

<style>
	.picker {
		display: flex;
		flex-wrap: wrap;
		gap: 16px 24px;
		align-items: flex-start;
	}
	.preview {
		flex: none;
		width: 136px;
		height: 136px;
		border-radius: 12px;
		background: var(--hover, #f0f0f2);
		padding: 8px;
	}
	.choices {
		flex: 1;
		min-width: min(100%, 280px);
		display: grid;
		gap: 14px;
	}
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		margin-bottom: 8px;
		font-size: 13px;
		color: var(--text-2, #5f636b);
	}
	input[type='radio'] {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.shells {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
		gap: 8px;
	}
	.shell {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 2px;
		padding: 6px 4px 6px;
		border: 1px solid var(--border, #e3e3e6);
		border-radius: 10px;
		cursor: pointer;
		font-size: 12px;
		color: var(--text-2, #5f636b);
	}
	.shell:has(input:checked) {
		border-color: var(--accent, #5e6ad2);
		box-shadow: 0 0 0 1px var(--accent, #5e6ad2);
		color: var(--text, #1c1d21);
	}
	.shell:has(input:focus-visible),
	.swatch:has(input:focus-visible),
	.free:has(input:focus-visible) {
		outline: 2px solid var(--accent, #5e6ad2);
		outline-offset: 2px;
	}
	.thumb {
		width: 52px;
		height: 52px;
	}
	.name {
		text-align: center;
		line-height: 1.2;
	}
	.colors {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}
	.swatch {
		position: relative;
		cursor: pointer;
		border-radius: 50%;
	}
	.swatch span:first-of-type {
		display: block;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid var(--panel, #fcfcfc);
		box-shadow: 0 0 0 1px var(--border, #e3e3e6);
	}
	.swatch:has(input:checked) span:first-of-type {
		box-shadow: 0 0 0 2px var(--accent, #5e6ad2);
	}
	.free {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-left: 4px;
		font-size: 12.5px;
		color: var(--text-2, #5f636b);
		cursor: pointer;
		border-radius: 6px;
	}
	.free.on {
		color: var(--accent, #5e6ad2);
	}
	.free input {
		width: 30px;
		height: 26px;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
