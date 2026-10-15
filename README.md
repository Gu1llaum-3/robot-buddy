# Robot

Petit robot animé (Canvas 2D, sans dépendance) qui sert de mascotte : il cligne, suit le curseur,
change d'expression, et se téléporte entre un emplacement de page et le coin bas droit de l'écran.
Le dossier ne dépend de rien d'autre dans le projet : on le copie tel quel dans un autre projet
Svelte 5 (le moteur `engine.ts` seul marche aussi sans Svelte).

## Fichiers

| Fichier              | Rôle                                                              |
| -------------------- | ----------------------------------------------------------------- |
| `engine.ts`          | Moteur : `createRobot(canvas, options)`, sans framework           |
| `Robot.svelte`       | Le robot sur un canvas carré qui remplit son parent               |
| `RobotDock.svelte`   | Une instance pour toute l'app : sur l'emplacement ou dans le coin |
| `RobotAnchor.svelte` | Emplacement réservé par une page, que le dock vient occuper       |
| `anchor.svelte.ts`   | État partagé entre `RobotAnchor` et `RobotDock`                   |

## Utilisation

Dans un layout qui reste monté d'une page à l'autre :

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import RobotDock from '$lib/robot/RobotDock.svelte';

	const where = $derived(page.url.pathname === '/assistant' ? 'anchor' : 'corner');
</script>

<RobotDock
	{where}
	emotion="neutral"
	label="Ouvrir l'assistant"
	onactivate={() => goto('/assistant')}
/>
```

Dans la page où il doit se poser, réserver sa place (la taille vient de la classe) :

```svelte
<RobotAnchor class="mascot" />

<style>
	:global(.mascot) {
		width: 150px;
		height: 150px;
	}
</style>
```

- `where` : `'anchor'` (sur le `RobotAnchor` de la page, en suivant sa position et sa taille),
  `'corner'` (bouton en bas à droite, qui appelle `onactivate`) ou `'hidden'`.
- `emotion` : `neutral`, `happy`, `love`, `curious`, `surprised`, `worried`, `sad`, `angry`,
  `suspicious`, `tired`, `sleep`, `focus`.
- `celebrate()` (via `bind:this`) : saut de joie et étincelles, à la fin d'une tâche.
- Sur l'emplacement, le robot réagit aux tapes (chatouille, tête qui tourne après trois tapes,
  cœur après un long survol) ; dans le coin, il cligne et suit le regard seulement.
- Changement de place : téléportation (il se replie en rayon de lumière puis réapparaît). Avec
  `prefers-reduced-motion`, il change de place sans animation.

Variables CSS facultatives : `--robot-corner-size` (72 px), `--robot-corner-size-narrow` (48 px,
sous 760 px), `--robot-focus` (anneau de focus du bouton), `--robot-glow` (lueur de la
téléportation).

Sans Svelte :

```ts
import { createRobot } from './engine.ts';

const robot = createRobot(document.querySelector('canvas')!, { interactive: true });
robot.set('focus');
robot.celebrate();
robot.destroy(); // arrête l'animation et retire les écouteurs
```

Démo jouable de toutes les expressions : `docs/poc/robot-demo.html`.
