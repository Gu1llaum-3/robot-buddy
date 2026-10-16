# Robot

Petit robot animé (Canvas 2D, sans dépendance) qui sert de mascotte : il cligne, suit le curseur,
change d'expression, et se téléporte entre un emplacement de page et le coin bas droit de l'écran.
Le dossier ne dépend de rien d'autre dans le projet : on le copie tel quel dans un autre projet
Svelte 5 (le moteur `engine.ts` seul marche aussi sans Svelte).

## Fichiers

| Fichier              | Rôle                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `engine.ts`          | Moteur : `createRobot(canvas, options)`, sans framework               |
| `Robot.svelte`       | Le robot sur un canvas carré qui remplit son parent                   |
| `RobotDock.svelte`   | Une instance pour toute l'app : sur l'emplacement ou dans le coin     |
| `RobotAnchor.svelte` | Emplacement réservé par une page, que le dock vient occuper           |
| `anchor.svelte.ts`   | État partagé entre `RobotAnchor` et `RobotDock`                       |
| `looks.ts`           | Coques, couleurs proposées, `normalizeLook`, tons tirés d'une couleur |
| `mood.ts`            | Réactions (amour, antenne, sommeil) par-dessus l'expression demandée  |

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
- Sur l'emplacement, le robot réagit aux tapes (chatouille, tête qui tourne après trois tapes)
  et à un clic sur son antenne (surpris ou curieux, au hasard) ; dans le coin, un clic appelle
  `onactivate`.
- Partout : un long survol le rend amoureux (yeux en cœur) jusqu'à ce que le curseur s'en aille ;
  sans clic ni touche pendant une minute (bouger la souris ne compte pas), il s'endort, et le
  premier clic ou la première touche le réveille, surpris. Il ne s'endort pas pendant `focus`.
- Ces réactions passent par-dessus `emotion` puis la rendent : la logique est dans `mood.ts`
  (testée dans `mood.test.ts`) ; `createRobot(canvas, { sleepAfter })` change le délai.
- Endormi, `Robot.svelte` affiche des « z » en HTML au-dessus de lui (13 px au minimum, ils
  peuvent déborder du canvas) ; le moteur seul les dessine sur le canvas (`sleepZs`), et
  `onemotion` signale chaque changement d'expression.
- Changement de place : téléportation (il se replie en rayon de lumière puis réapparaît). Avec
  `prefers-reduced-motion`, il change de place sans animation.

Variables CSS facultatives : `--robot-corner-size` (72 px), `--robot-corner-size-narrow` (48 px,
sous 760 px), `--robot-focus` (anneau de focus du bouton), `--robot-glow` (lueur de la
téléportation), `--robot-z` (15 : au-dessus de la page, sous ses menus et panneaux).

Sans Svelte :

```ts
import { createRobot } from './engine.ts';

const robot = createRobot(document.querySelector('canvas')!, { interactive: true });
robot.set('focus');
robot.celebrate();
robot.destroy(); // arrête l'animation et retire les écouteurs
```

## Coques et couleurs

Huit coques, dans `SHELLS` (`looks.ts`) : `pebble` (Galet, par défaut), `crt` (Télé rétro),
`egg` (Pocket), `helmet` (Astronaute), `cat` (Chaton), `headphones` (Casque audio), `cloud`
(Nuage), `pixel` (Pixel). Chacune a sa couleur conseillée ; `ROBOT_COLORS` propose neuf teintes,
et n'importe quelle couleur `#rrggbb` convient : le clair, l'ombre et le contour en sont tirés.

```svelte
<RobotDock {where} look={{ shell: 'crt', color: '#f2d47e' }} />
```

- `look` est facultatif : sans lui, c'est le galet menthe. Il change en direct (`setLook()` côté
  moteur).
- `normalizeLook(valeur)` rend une apparence sûre à partir d'une valeur enregistrée ou reçue : une
  coque inconnue devient le galet, une couleur invalide la couleur conseillée de la coque. Les
  identifiants des coques sont faits pour être enregistrés : ne pas les renommer.
- Les yeux, les expressions, le sommeil et la téléportation sont les mêmes pour toutes les
  coques ; le clic qui fait sursauter vise le haut de chaque coque (antenne, oreilles du chaton,
  haut du nuage…).

Démo jouable de toutes les expressions : `docs/poc/robot-demo.html`.
