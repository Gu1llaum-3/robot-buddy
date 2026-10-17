# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`robot-buddy`: an animated assistant mascot drawn entirely in Canvas 2D (no images, no runtime
dependencies, no network calls), packaged as a library with an optional Svelte 5 layer. The
user-facing documentation is `README.md` (English) with a French translation in `README.fr.md`;
keep both in sync when the public API, shells, files or tests change.

## Commands

```sh
pnpm install                          # also runs svelte-package (prepare) and builds dist/
pnpm exec playwright install chromium # once, needed by the browser tests
pnpm dev                              # showcase app in the browser (Vite on showcase/)
pnpm check                            # types (svelte-check)
pnpm test                             # all tests, Node + browser (vitest --run)
pnpm build                            # package into dist/ (svelte-package)
pnpm lint                             # Prettier check; `pnpm format` to fix
```

Single test / project:

```sh
pnpm vitest --run src/lib/mood.test.ts      # one file
pnpm vitest --run --project node            # Node project only (no browser needed)
pnpm vitest --run -t "name of the test"     # by test name
```

Tests are split by filename in `vite.config.ts`: `*.svelte.test.ts` run in headless Chromium
(Vitest browser mode, Playwright provider, `vitest-browser-svelte`); every other `*.test.ts`
runs in Node. `expect.requireAssertions` is on, so every test must assert something.

## Architecture

Everything lives in `src/lib/`. Two package entry points:

- `index.ts` → `robot-buddy`: framework-free engine + looks catalogue.
- `svelte.ts` → `robot-buddy/svelte`: re-exports `index.ts` plus the Svelte components.

The framework-free core must stay free of Svelte and of DOM access at module load:

- `engine.ts` — `createRobot(canvas, options)` returns a handle (`set`, `celebrate`, `blink`,
  `setLook`, `setInteractive`, `destroy`). Draws in a fixed 300×300 logical space (`VIEW`);
  eyes are spring-animated shapes (`EXPRESSIONS`, `SPRING`) projected on a virtual sphere.
  Each shell is an entry in `SHELL_DRAWINGS` (`body`, `screen`, `top` required; `back`,
  `details`, `front`, `antenna`, `flat` optional).
- `mood.ts` — pure state machine layering the robot's own reactions (love on hover, antenna
  flick, sleep after inactivity, wake-up surprise) over the expression the host asked for.
  Takes an explicit `now`, so it is tested without timers.
- `looks.ts` — catalogue of shells (`SHELLS`) and colours, `normalizeLook` (sanitises stored
  looks, falls back to `DEFAULT_LOOK`), and tone derivation (`shellPalette`).

Svelte layer (runes mode, set in `svelte.config.js`):

- `Robot.svelte` wraps the engine on a square canvas that fills its parent.
- `RobotDock.svelte` (single instance per app) and `RobotAnchor.svelte` (a slot a page reserves)
  communicate through the shared `$state` in `anchor.svelte.ts`: the dock sits on the current
  anchor, or teleports to the bottom-right corner when there is none. Only one dock and one
  visible anchor at a time.
- `RobotLookPicker.svelte` — shell/colour picker with live preview.

App-specific concerns (which page shows the robot, mapping app state to moods, persisting each
user's look) are intentionally left to the host project; don't add them here.

Adding a shell: add `{ id, name, color }` to `SHELLS` in `looks.ts` (new id, never reused), add
its drawing to `SHELL_DRAWINGS` in `engine.ts`, and add a click point to `TOP` in
`engine.svelte.test.ts` (the other per-shell checks pick the new shell up automatically).

`showcase/` is a dev-only Svelte app (`pnpm dev`, own `vite.config.ts`, English UI) that imports
`src/lib` directly: gallery, e-commerce corner widget, full-page chat, look picker. It mounts the
single `RobotDock` in `App.svelte`; scenes set its `where`/`emotion` through `stage.svelte.ts`.
It is not packaged (only `dist` is published) but is type-checked and Prettier-checked.

`demo/robot-demo.html` is a standalone page with its own inline script; it does not import
`src/lib`, so engine changes are not reflected there automatically.

## Conventions

- Releases: pushing a `v<version>` tag (must equal `package.json` `version`) runs
  `.github/workflows/release.yml`, which tests, packs and attaches the tarball to a GitHub
  release; that tarball is the recommended install path. Keep the `prepare` script: it is what
  makes installing straight from git work.
- Sources import siblings with explicit `.ts` extensions (`allowImportingTsExtensions` +
  `rewriteRelativeImportExtensions`); they become `.js` in `dist/` (git-ignored).
- Prettier: tabs, single quotes, no trailing commas, width 100.
- Code comments in English; user-facing strings (shell/colour names, component default labels)
  are in French.
- Respect `prefers-reduced-motion` in any new animation (see README "Accessibilité et mouvement
  réduit" for what is disabled vs kept).
- Commit messages in English, conventional commits.
