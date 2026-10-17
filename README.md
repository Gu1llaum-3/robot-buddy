# Robot

**English** · [Français](README.fr.md)

A small animated robot that serves as an assistant's mascot. It blinks, follows the cursor,
changes expression, reacts when touched, falls asleep when nobody clicks, and teleports between a
slot on the page and the bottom-right corner of the screen. It comes in eight shells and in any
colour.

Everything is drawn in Canvas 2D: no library, no image, no network call. The code imports nothing
but `svelte`, and only for the components: the engine works in any page, with or without a
framework.

Born in the Comptoir project (`toryo-agent`), where its history comes from. To see it in context,
run `pnpm dev`: the [showcase](#showcase) opens in the browser with a gallery, an e-commerce
corner widget, a full-page chat and the look picker. The older playable demo of every expression,
[`demo/robot-demo.html`](demo/robot-demo.html), opens directly in a browser.

## Contents

1. [Prerequisites](#prerequisites)
2. [Installing](#installing)
3. [Files](#files)
4. [Quick start](#quick-start)
5. [Components](#components)
6. [The engine without Svelte](#the-engine-without-svelte)
7. [Expressions and reactions](#expressions-and-reactions)
8. [Shells and colours](#shells-and-colours)
9. [Saving each user's look](#saving-each-users-look)
10. [Customising the display (CSS)](#customising-the-display-css)
11. [Accessibility and reduced motion](#accessibility-and-reduced-motion)
12. [What the host project must write](#what-the-host-project-must-write)
13. [Tests](#tests)
14. [Adding a shell](#adding-a-shell)
15. [Known limitations](#known-limitations)
16. [Showcase](#showcase)
17. [Developing the module](#developing-the-module)

## Prerequisites

| Need                                            | For                                                       | Details                                                                                                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser with Canvas 2D                          | Everything                                                | `roundRect`, `ResizeObserver`, `matchMedia`: all recent browsers                                                                                                          |
| TypeScript                                      | Everything                                                | The module is written in TypeScript                                                                                                                                       |
| `.ts` imports                                   | Everything                                                | The module writes `import … from './engine.ts'`. SvelteKit 3 accepts it out of the box; otherwise, add `"allowImportingTsExtensions": true` (with `noEmit`) to `tsconfig` |
| Svelte 5 (runes)                                | The `.svelte` components and `anchor.svelte.ts`           | Not needed if you only use the engine                                                                                                                                     |
| CSS `container-type` and `:has()`               | The sleep z's and the picker                              | All recent browsers                                                                                                                                                       |
| Vitest                                          | The `*.test.ts` tests                                     | Optional                                                                                                                                                                  |
| `vitest-browser-svelte` and Playwright Chromium | The `*.svelte.test.ts` tests, which run in a real browser | Optional; `pnpm exec playwright install chromium`                                                                                                                         |

No npm dependency is needed to run the robot.

## Installing

Four ways:

1. **Release tarball** (recommended): each
   [GitHub release](https://github.com/Gu1llaum-3/robot-buddy/releases) carries the package,
   already built. Nothing runs on install, and the version is pinned.

   ```sh
   pnpm add https://github.com/Gu1llaum-3/robot-buddy/releases/download/v0.1.0/robot-buddy-0.1.0.tgz
   # or: npm install https://github.com/Gu1llaum-3/robot-buddy/releases/download/v0.1.0/robot-buddy-0.1.0.tgz
   ```

2. **Git dependency**: `pnpm add github:Gu1llaum-3/robot-buddy#v0.1.0` (or `npm install`). The
   `prepare` script builds `dist/` on install, with the development tools, so it has to be
   allowed: with pnpm, add `robot-buddy` to `allowBuilds` in `pnpm-workspace.yaml` (pnpm prints
   the exact entry); npm builds it but warns until `npm install-scripts approve robot-buddy`.
3. **Copy the sources**: the `src/lib/` folder into the project (for example into
   `src/lib/robot-buddy/`), without the `*.test.ts` files if you don't keep the tests. You then
   import the files directly (`./robot-buddy/engine.ts`, `./robot-buddy/RobotDock.svelte`).
4. **npm package**: not published yet (`"private": true` in `package.json`).

Except when copying the sources, the package has two entry points:

```ts
import { createRobot, SHELLS, normalizeLook } from 'robot-buddy'; // any project, no framework
import { RobotDock, RobotAnchor, Robot, RobotLookPicker } from 'robot-buddy/svelte'; // Svelte 5
```

`robot-buddy/svelte` also re-exports all of `robot-buddy`. Svelte is only an optional dependency
(`peerDependency`): a project without Svelte uses the first entry point alone.

Next: wire up the robot (see [Quick start](#quick-start)), then write what depends on the project
(see [What the host project must write](#what-the-host-project-must-write)).

## Files

| File                     | Role                                                                     | Depends on                         |
| ------------------------ | ------------------------------------------------------------------------ | ---------------------------------- |
| `engine.ts`              | Engine: `createRobot(canvas, options)`, drawing, animation, interactions | `mood.ts`, `looks.ts`              |
| `mood.ts`                | Reactions (love, antenna, sleep) on top of the requested expression      | —                                  |
| `looks.ts`               | Shells, suggested colours, `normalizeLook`, tones drawn from a colour    | —                                  |
| `Robot.svelte`           | The robot on a square canvas that fills its parent                       | `engine.ts`, `looks.ts`            |
| `RobotDock.svelte`       | A single instance for the whole app: on the slot or in the corner        | `Robot.svelte`, `anchor.svelte.ts` |
| `RobotAnchor.svelte`     | Slot reserved by a page, which the dock comes to occupy                  | `anchor.svelte.ts`                 |
| `anchor.svelte.ts`       | State shared between `RobotAnchor` and `RobotDock`                       | —                                  |
| `RobotLookPicker.svelte` | Shell and colour picker, with preview                                    | `Robot.svelte`, `looks.ts`         |
| `index.ts`               | `robot-buddy` entry point: engine and catalogue                          | `engine.ts`, `looks.ts`            |
| `svelte.ts`              | `robot-buddy/svelte` entry point: components, plus all of `robot-buddy`  | the components                     |

All these files are in `src/lib/`. `engine.ts`, `mood.ts` and `looks.ts` depend neither on Svelte
nor on the DOM at load time: they can be used on their own.

## Quick start

**1. A single instance, in a layout that stays mounted from one page to the next.** The robot
thus keeps its state (expression, springs, sleep) while navigating.

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { RobotDock } from 'robot-buddy/svelte';

	let { children } = $props();
	const where = $derived(page.url.pathname === '/assistant' ? 'anchor' : 'corner');
</script>

{@render children()}
<RobotDock {where} label="Open the assistant" onactivate={() => goto('/assistant')} />
```

**2. In the page where it should land, reserve its place.** The size comes from the class.

```svelte
<script lang="ts">
	import { RobotAnchor } from 'robot-buddy/svelte';
</script>

<RobotAnchor class="mascot" />

<style>
	:global(.mascot) {
		width: 150px;
		height: 150px;
	}
</style>
```

**3. Make it react to the application** (optional): `emotion`, `look`, and `celebrate()` when a
task finishes.

```svelte
<RobotDock bind:this={dock} {where} emotion={busy ? 'focus' : 'neutral'} look={myLook} />
<!-- later: dock.celebrate() -->
```

With no slot to occupy (no `RobotAnchor`), you can also put a plain robot anywhere with
`<Robot />`: it fills its parent.

## Components

### `RobotDock`

The application's single robot: `fixed` position, over the page's `RobotAnchor` or in the
bottom-right corner, with a teleport every time it changes place.

| Prop         | Type                               | Default     | Role                                                                 |
| ------------ | ---------------------------------- | ----------- | -------------------------------------------------------------------- |
| `where`      | `'anchor' \| 'corner' \| 'hidden'` | required    | On the page's slot, in the corner, or hidden                         |
| `emotion`    | `Emotion`                          | `'neutral'` | Requested expression (see [Expressions](#expressions-and-reactions)) |
| `look`       | `RobotLook`                        | mint pebble | Shell and colour                                                     |
| `label`      | `string`                           | `'Ouvrir'`  | Accessible name of the corner button                                 |
| `onactivate` | `() => void`                       | —           | Click or Enter key on the corner robot                               |

Method, through `bind:this`: `celebrate()`.

- While `where` is `'anchor'` but the page has not mounted its `RobotAnchor` yet, the robot stays
  where it is.
- On the slot, it follows the slot's position and size every frame, to keep up with a page that
  rearranges itself (a growing field, a resize).
- Between two slots of different sizes, it glides instead of teleporting.
- In the corner, the robot is a button: hover it, it blinks and follows your gaze, and a click
  calls `onactivate`. On the slot, it reacts to taps.

### `RobotAnchor`

| Prop    | Type     | Role                                              |
| ------- | -------- | ------------------------------------------------- |
| `class` | `string` | Class that gives the slot its size (and position) |

Only one `RobotAnchor` shown at a time: the last one mounted wins.

### `Robot`

The robot alone, on a square canvas that fills its parent (give the parent a size).

| Prop          | Type          | Default               | Role                                                               |
| ------------- | ------------- | --------------------- | ------------------------------------------------------------------ |
| `emotion`     | `Emotion`     | `'neutral'`           | Requested expression                                               |
| `look`        | `RobotLook`   | mint pebble           | Shell and colour; changes live                                     |
| `interactive` | `boolean`     | `true`                | Reacts to taps (tickle, dizziness, antenna)                        |
| `sleepAfter`  | `number` (ms) | `60000`               | Inactivity before sleep; `Infinity` keeps it awake                 |
| `label`       | `string`      | `'Petit robot animé'` | Alternative text of the image                                      |
| `decorative`  | `boolean`     | `false`               | Hidden from screen readers (when a button on top already names it) |
| `children`    | snippet       | —                     | Content laid on top, which shares the hover (for example a button) |

Method, through `bind:this`: `celebrate()`.

### `RobotLookPicker`

The shell and colour picker: an animated preview, the eight shells as thumbnails (each in its own
colour), the nine tints and a free colour. Picking a shell takes it in its own colour; you then
recolour it.

```svelte
<script lang="ts">
	import { DEFAULT_LOOK, RobotLookPicker, sameLook } from 'robot-buddy/svelte';

	let { saved } = $props(); // the saved look
	let look = $state({ ...saved });
</script>

<form method="post" action="?/robot">
	<RobotLookPicker bind:look />
	<input type="hidden" name="shell" value={look.shell} />
	<input type="hidden" name="color" value={look.color} />
	<button disabled={sameLook(look, saved)}>Save</button>
	<button type="button" onclick={() => (look = { ...DEFAULT_LOOK })}>Default</button>
</form>
```

The picker saves nothing: that is the project's job (see
[Saving each user's look](#saving-each-users-look)). The preview and thumbnails never fall
asleep.

Its texts are in French by default. `labels` replaces them, and `names` gives the shell and tint
names, keyed by shell id or tint hex (the catalogue's name for any left out):

```svelte
<RobotLookPicker
	bind:look
	labels={{ shell: 'Shell', color: 'Colour', freeColor: 'Custom colour', preview: 'Preview' }}
	names={{ pebble: 'Pebble', cat: 'Kitten', '#a3d6c1': 'Mint' }}
/>
```

## The engine without Svelte

```ts
import { createRobot } from 'robot-buddy';

const canvas = document.querySelector('canvas')!; // square, sized in CSS
const robot = createRobot(canvas, {
	look: { shell: 'crt', color: '#f2d47e' },
	onemotion: (e) => console.log('expression', e)
});
robot.set('focus');
robot.celebrate();
robot.destroy(); // stops the animation and removes every listener
```

**`createRobot(canvas, options)` options**

| Option        | Type                   | Default     | Role                                                                         |
| ------------- | ---------------------- | ----------- | ---------------------------------------------------------------------------- |
| `look`        | `RobotLook`            | mint pebble | Starting shell and colour                                                    |
| `interactive` | `boolean`              | `true`      | Reacts to taps                                                               |
| `target`      | `HTMLElement`          | the canvas  | Element whose hover and taps count (useful when a button covers the canvas)  |
| `sleepAfter`  | `number` (ms)          | `60000`     | Inactivity before sleep; `Infinity` keeps it awake                           |
| `sleepZs`     | `boolean`              | `true`      | Draw the sleep z's on the canvas (`Robot.svelte` shows them in HTML instead) |
| `onemotion`   | `(e: Emotion) => void` | —           | Called on every expression change, reactions included                        |

**Methods of the returned robot**

| Method               | Role                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------- |
| `set(emotion)`       | Changes the requested expression                                                      |
| `celebrate()`        | Jump for joy, sparkles, `happy` for 2.6 s, then back to its expression                |
| `blink(side?)`       | Blinks (`'both'`, `'left'` or `'right'`)                                              |
| `setLook(look)`      | Changes the shell and colour live                                                     |
| `setInteractive(on)` | Turns reactions to taps on or off                                                     |
| `emotion`            | Expression shown (read-only)                                                          |
| `destroy()`          | Stops the animation loop and removes the listeners; call it when the canvas goes away |

The drawing size follows the canvas's CSS size and the screen density (up to 2.5×).

## Expressions and reactions

**Expressions** (`Emotion`): `neutral`, `happy`, `love`, `curious`, `surprised`, `worried`, `sad`,
`angry`, `suspicious`, `tired`, `sleep`, `focus`. `focus` scrolls a rain of digits through the
eyes: it is the "I'm thinking" expression.

**The robot's own reactions** (`mood.ts`). They take over the requested expression, then hand it
back:

| Gesture                                                          | Reaction                                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Long hover (1.2 s)                                               | In love (heart eyes) as long as the cursor stays                              |
| Click on the top of the shell (antenna, ears, top of the cloud…) | Surprised or curious, at random, for 1.8 s                                    |
| Tap on the robot (`interactive`)                                 | Tickle; three quick taps: dizzy                                               |
| One minute without a click or key on the page                    | Drowsy (`tired`) for the last 5 s, then falls asleep, even if the mouse moves |
| Click or key while drowsy                                        | Perks up, back to the expression                                              |
| Click or key while asleep                                        | Wakes up, surprised, for 1.5 s                                                |

A newly requested expression (`set`, `emotion` prop) ends any reaction, sleep included. It does
not fall asleep or fall in love during `focus`, `angry`, `suspicious` or `sleep`. Drowsiness
lasts 5 s, or half of `sleepAfter` when that is shorter than 10 s. `celebrate()` also counts as
activity, and wakes it up.

## Shells and colours

| Id           | Name (`name`)             | Suggested colour             | Clickable top           |
| ------------ | ------------------------- | ---------------------------- | ----------------------- |
| `pebble`     | Galet — pebble (default)  | Menthe (mint) `#a3d6c1`      | The ball antenna        |
| `crt`        | Télé rétro — retro TV     | Beurre (butter) `#f2d47e`    | The rabbit-ear antennas |
| `egg`        | Pocket                    | Orange `#ff9447`             | The keyring loop        |
| `helmet`     | Astronaute — astronaut    | Nacre (pearl) `#dfe4ea`      | The beacon              |
| `cat`        | Chaton — kitten           | Rose (pink) `#f5b0cc`        | The ears                |
| `headphones` | Casque audio — headphones | Lavande (lavender) `#c4b5f2` | The ball antenna        |
| `cloud`      | Nuage — cloud             | Ciel (sky) `#9ccbf0`         | The top of the cloud    |
| `pixel`      | Pixel                     | Corail (coral) `#f4a593`     | The block antenna       |

The eyes, expressions, sleep and teleport are the same for every shell.

**Colours.** `ROBOT_COLORS` offers nine tints: Menthe (mint), Ciel (sky), Lavande (lavender),
Rose (pink), Corail (coral), Orange, Beurre (butter), Nacre (pearl), Graphite. Any `#rrggbb` colour
works: the light, shade and outline are drawn from it (`shellPalette`). Soft tints keep the eyes
readable; a very dark colour works, but the screen stands out less from the shell.

**`looks.ts` exports**

| Export                     | Role                                                     |
| -------------------------- | -------------------------------------------------------- |
| `SHELLS`                   | The shells: `{ id, name, color }`                        |
| `ROBOT_COLORS`             | The suggested tints: `{ name, hex }`                     |
| `ShellId`, `RobotLook`     | Types: `RobotLook = { shell: ShellId; color: string }`   |
| `DEFAULT_LOOK`             | The mint pebble                                          |
| `normalizeLook(value)`     | Safe look from a saved or received value (see below)     |
| `suggestedColor(shell)`    | A shell's suggested colour                               |
| `sameLook(a, b)`           | Same shell and same colour, ignoring case                |
| `isShell(v)`, `isColor(v)` | Guards: known shell, `#rrggbb` colour                    |
| `shellPalette(color)`      | `light`, `mid`, `edge`, `deep` tones drawn from a colour |

`normalizeLook` keeps what is valid: an unknown shell becomes the pebble, an invalid colour
becomes the shell's suggested colour, and `null` gives the mint pebble.

## Saving each user's look

The module stores nothing. Keeping two strings, the shell and the colour, wherever you like
(database, preferences, `localStorage`) is enough.

- **When reading**, pass the value through `normalizeLook()` before giving it to the robot: an
  old, empty or tampered value becomes a valid look.
- **When writing**, reject what is not valid with `isShell()` and `isColor()`, on the server.
- **"Default"**: you can save "no choice" (empty values) rather than the mint pebble. Those
  accounts will then follow the default if it ever changes.
- **Never rename** a shell id: it is stored as is.

In Comptoir, for example: two optional columns `robot_shell` and `robot_color` on `user`,
`src/lib/server/robot-look.ts` (`robotLookOf`, `saveRobotLook`), and the "Robot appearance" card
in `src/routes/(app)/profile/`.

## Customising the display (CSS)

Optional CSS variables, to set on `:root` or on a parent of the dock:

| Variable                     | Default        | Role                                                       |
| ---------------------------- | -------------- | ---------------------------------------------------------- |
| `--robot-corner-size`        | `72px`         | Size of the robot in the corner                            |
| `--robot-corner-size-narrow` | `48px`         | Size in the corner below 760 px wide                       |
| `--robot-z`                  | `15`           | Dock `z-index`: above the page, below its menus and panels |
| `--robot-focus`              | `currentColor` | Focus ring of the corner button                            |
| `--robot-glow`               | mint green     | Teleport glow                                              |
| `--robot-zzz`                | `#4a6876`      | Colour of the sleep z's (`Robot`)                          |
| `--robot-zzz-halo`           | `#fff`         | Halo around the z's; darken it on a dark page              |

The component also uses the project's `--text`, `--text-2`, `--border`, `--panel`, `--hover` and
`--accent` tokens when they exist (picker), with fallback values.

## Accessibility and reduced motion

- The robot is a named image (`label`). In the corner, it is a real named button (`label`),
  reachable by keyboard, with a focus ring.
- With `prefers-reduced-motion`, it does not teleport (it simply changes place), stops breathing,
  stops blinking and looking around on its own, no longer hops when happy, emits neither sparkles
  nor hearts, the `focus` digit rain stops, and its z's stay still. The small jolts (surprise,
  celebration) and cursor tracking remain.
- The picker uses real radio buttons (shells, tints) and a native colour input.

## What the host project must write

The module knows nothing of routes, the application or the database. Those parts are written in
each project. As an example, here is where they live in the original project (Comptoir,
`toryo-agent`):

| What        | In Comptoir                                                    | Role                                                                                |
| ----------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Placement   | `src/lib/ui/robot.ts` (`robotPlacement`)                       | For each page: on the slot (large or small), in the corner, or hidden               |
| Mood        | `src/lib/ui/robot.ts` (`robotMood`)                            | The application state becomes an expression (thinking, happy, surprised)            |
| Celebration | `src/routes/(app)/+layout.svelte`                              | Calls `celebrate()` when a task succeeds                                            |
| Slots       | `src/routes/(app)/agent/+page.svelte`, `src/routes/layout.css` | `RobotAnchor` on the home page (150 px) and in the chat (124 px, next to the input) |
| Saved look  | `src/lib/server/robot-look.ts`, `src/routes/(app)/profile/`    | Reading, writing and the picker screen                                              |

## Tests

| File                             | Runs in | What it checks                                                                  |
| -------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `looks.test.ts`                  | Node    | Catalogue, `normalizeLook`, `sameLook`, tones                                   |
| `mood.test.ts`                   | Node    | Love, antenna, celebration, drowsiness, sleep, wake-up                          |
| `engine.svelte.test.ts`          | Browser | For each shell: whole eyes (even "surprised"), colour applied, click on the top |
| `Robot.svelte.test.ts`           | Browser | Back to the mint pebble when `look` goes away                                   |
| `RobotLookPicker.svelte.test.ts` | Browser | A shell is picked in its own colour; translated labels and names                |

The browser tests need Vitest's browser mode (`vitest-browser-svelte`, Playwright provider).
Here: `pnpm test` (see [Developing the module](#developing-the-module)).

## Adding a shell

1. `src/lib/looks.ts`: add `{ id, name, color }` to `SHELLS` (a new id, never reused).
2. `src/lib/engine.ts`: add its entry to `SHELL_DRAWINGS`. Only `body`, `screen` and `top` are
   required:
   - `body`: the silhouette;
   - `screen`: the screen outline, large enough for the eyes (roughly x 62 to 238, y 110 to 206
     in the 300 × 300 drawing);
   - `back`, `details`, `front`: what goes behind the shell, on it, and over the screen;
   - `antenna`: what moves with the spring;
   - `top`: the click area that makes it jump;
   - `flat`: flat fill with a thick outline instead of the gradient.
3. The `engine.svelte.test.ts` tests cover the new shell automatically, except the click area:
   add a point to `TOP`.

## Known limitations

- **A single `RobotDock` instance** per application, and a single `RobotAnchor` shown at a time
  (state shared in `anchor.svelte.ts`).
- **French text** in the module: shell and tint names (`looks.ts`), default texts of
  `Robot.svelte` and of the picker. The picker takes translations (`labels`, `names`); `Robot`
  takes a `label`; the dock's robot keeps its French accessible name when it stands on a slot.
- **Development warning**: when loading a page that contains the picker, the console may show
  "The specified value "" does not conform… valid CSS color". It comes from Svelte, which briefly
  empties the colour input on hydration; the value is restored.
- **Server-side rendering**: the canvas only draws in the browser. On the first server-rendered
  display, the slot is empty until the script loads.

## Showcase

`pnpm dev` starts a Vite dev server on `showcase/` and opens it in the browser. It is a small
Svelte app, in English, that imports the library straight from `src/lib` (changes show up live)
and is not part of the published package. A switch in its header picks a light or dark theme
(or the system's), to see the robots on both. Four scenes:

| Scene        | What it shows                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gallery      | Every shell, every expression and `celebrate()`, on plain `Robot` components                                                                     |
| Store widget | A pretend shop: the `RobotDock` waits in the corner as a button, then teleports into the header of the help panel it opens (`corner` → `anchor`) |
| Chat         | A full-page assistant: the robot stands above the conversation on a `RobotAnchor`, large on the welcome screen, then smaller                     |
| Customize    | `RobotLookPicker`; the chosen look is kept in `localStorage` and dresses the robot in the other scenes                                           |

In the store and the chat, a pretend assistant answers by keyword: the robot shows `focus` while it
"types", then reacts to the answer (happy, sad, worried, suspicious…), and celebrates a found
order. The single `RobotDock` lives in `showcase/App.svelte`; each scene only says where it goes
and how it feels (`showcase/stage.svelte.ts`), as a host app would.

## Developing the module

```sh
pnpm install                          # development tools, and builds dist/
pnpm dev                              # showcase in the browser
pnpm exec playwright install chromium # once, for the browser tests
pnpm check                            # types (svelte-check)
pnpm test                             # Node and browser tests
pnpm build                            # package into dist/ (svelte-package)
pnpm lint                             # formatting (Prettier)
```

- Sources in `src/lib/`, package built into `dist/` (ignored by git). The sources' `.ts` imports
  become `.js` in `dist/`.
- Commit messages in English (conventional commits), as in the original project.

**Releasing a version**: bump `version` in `package.json`, commit, then push a matching tag.

```sh
git tag v0.2.0 && git push origin v0.2.0
```

The `Release` workflow (`.github/workflows/release.yml`) checks that the tag matches the
version, runs the checks and tests, builds the package and attaches `robot-buddy-<version>.tgz` to
a new GitHub release.

## Licence

MIT, see [`LICENSE`](LICENSE).
