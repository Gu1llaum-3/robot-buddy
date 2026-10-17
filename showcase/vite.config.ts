// Dev server for the showcase (`pnpm dev` = `vite showcase`): a small app importing src/lib.
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	// Relative to the Vite root, this folder: the library's own config (runes mode)
	plugins: [svelte({ configFile: '../svelte.config.js' })],
	server: { open: true }
});
