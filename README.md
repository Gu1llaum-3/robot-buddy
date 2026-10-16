# Robot

Petit robot animé qui sert de mascotte à un assistant. Il cligne des yeux, suit le curseur,
change d'expression, réagit quand on le touche, s'endort quand personne ne clique, et se
téléporte entre un emplacement de page et le coin bas droit de l'écran. Il existe en huit coques
et dans n'importe quelle couleur.

Tout est dessiné en Canvas 2D : pas de bibliothèque, pas d'image, pas d'appel réseau. Le code
n'importe rien d'autre que `svelte`, et seulement pour les composants : le moteur marche dans
n'importe quelle page, avec ou sans framework.

Né dans le projet Comptoir (`toryo-agent`), d'où vient son historique. Démo jouable de toutes
les expressions : [`demo/robot-demo.html`](demo/robot-demo.html), à ouvrir dans un navigateur.

## Sommaire

1. [Prérequis](#prérequis)
2. [Installer](#installer)
3. [Les fichiers](#les-fichiers)
4. [Démarrage rapide](#démarrage-rapide)
5. [Composants](#composants)
6. [Le moteur sans Svelte](#le-moteur-sans-svelte)
7. [Expressions et réactions](#expressions-et-réactions)
8. [Coques et couleurs](#coques-et-couleurs)
9. [Enregistrer l'apparence de chacun](#enregistrer-lapparence-de-chacun)
10. [Personnaliser l'affichage (CSS)](#personnaliser-laffichage-css)
11. [Accessibilité et mouvement réduit](#accessibilité-et-mouvement-réduit)
12. [Ce que le projet d'accueil doit écrire](#ce-que-le-projet-daccueil-doit-écrire)
13. [Tests](#tests)
14. [Ajouter une coque](#ajouter-une-coque)
15. [Limites connues](#limites-connues)
16. [Développer le module](#développer-le-module)

## Prérequis

| Besoin                                            | Pour quoi                                                          | Détail                                                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigateur avec Canvas 2D                         | Tout                                                               | `roundRect`, `ResizeObserver`, `matchMedia` : tous les navigateurs récents                                                                                        |
| TypeScript                                        | Tout                                                               | Le module est écrit en TypeScript                                                                                                                                 |
| Imports en `.ts`                                  | Tout                                                               | Le module écrit `import … from './engine.ts'`. SvelteKit 3 l'accepte d'office ; sinon, ajouter `"allowImportingTsExtensions": true` (avec `noEmit`) au `tsconfig` |
| Svelte 5 (runes)                                  | Les composants `.svelte` et `anchor.svelte.ts`                     | Inutile si l'on n'utilise que le moteur                                                                                                                           |
| CSS `container-type` et `:has()`                  | Les « z » du sommeil et le sélecteur                               | Tous les navigateurs récents                                                                                                                                      |
| Vitest                                            | Les tests `*.test.ts`                                              | Facultatif                                                                                                                                                        |
| `vitest-browser-svelte` et Chromium de Playwright | Les tests `*.svelte.test.ts`, qui tournent dans un vrai navigateur | Facultatif ; `pnpm exec playwright install chromium`                                                                                                              |

Aucune dépendance npm n'est nécessaire pour faire tourner le robot.

## Installer

Trois façons, de la plus simple à la plus suivie :

1. **Copier les sources** : le dossier `src/lib/` dans le projet (par exemple dans
   `src/lib/robot-buddy/`), sans les fichiers `*.test.ts` si l'on ne garde pas les tests. On
   importe alors les fichiers directement (`./robot-buddy/engine.ts`,
   `./robot-buddy/RobotDock.svelte`).
2. **Dépendance git** : `pnpm add github:Gu1llaum-3/robot-buddy` (ou `npm install`). Le script
   `prepare` construit `dist/` à l'installation. Avec pnpm 10 ou plus, autoriser ce script :
   `pnpm approve-builds`, ou `onlyBuiltDependencies: [robot-buddy]` dans `pnpm-workspace.yaml`.
3. **Paquet npm** : pas encore publié (`"private": true` dans `package.json`).

Avec les façons 2 et 3, le paquet a deux points d'entrée :

```ts
import { createRobot, SHELLS, normalizeLook } from 'robot-buddy'; // tout projet, sans framework
import { RobotDock, RobotAnchor, Robot, RobotLookPicker } from 'robot-buddy/svelte'; // Svelte 5
```

`robot-buddy/svelte` réexporte aussi tout `robot-buddy`. Svelte n'est qu'une dépendance
facultative (`peerDependency`) : un projet sans Svelte utilise le premier point d'entrée seul.

Ensuite : brancher le robot (voir [Démarrage rapide](#démarrage-rapide)), puis écrire ce qui
dépend du projet (voir [Ce que le projet d'accueil doit écrire](#ce-que-le-projet-daccueil-doit-écrire)).

## Les fichiers

| Fichier                  | Rôle                                                                      | Dépend de                          |
| ------------------------ | ------------------------------------------------------------------------- | ---------------------------------- |
| `engine.ts`              | Moteur : `createRobot(canvas, options)`, dessin, animation, interactions  | `mood.ts`, `looks.ts`              |
| `mood.ts`                | Réactions (amour, antenne, sommeil) par-dessus l'expression demandée      | —                                  |
| `looks.ts`               | Coques, couleurs proposées, `normalizeLook`, tons tirés d'une couleur     | —                                  |
| `Robot.svelte`           | Le robot sur un canvas carré qui remplit son parent                       | `engine.ts`, `looks.ts`            |
| `RobotDock.svelte`       | Une seule instance pour toute l'app : sur l'emplacement ou dans le coin   | `Robot.svelte`, `anchor.svelte.ts` |
| `RobotAnchor.svelte`     | Emplacement réservé par une page, que le dock vient occuper               | `anchor.svelte.ts`                 |
| `anchor.svelte.ts`       | État partagé entre `RobotAnchor` et `RobotDock`                           | —                                  |
| `RobotLookPicker.svelte` | Choix de la coque et de la couleur, avec aperçu                           | `Robot.svelte`, `looks.ts`         |
| `index.ts`               | Point d'entrée `robot-buddy` : moteur et catalogue                        | `engine.ts`, `looks.ts`            |
| `svelte.ts`              | Point d'entrée `robot-buddy/svelte` : composants, plus tout `robot-buddy` | les composants                     |

Tous ces fichiers sont dans `src/lib/`. `engine.ts`, `mood.ts` et `looks.ts` ne dépendent ni de Svelte ni du DOM au chargement : on peut
les utiliser seuls.

## Démarrage rapide

**1. Une seule instance, dans un layout qui reste monté d'une page à l'autre.** Le robot garde
ainsi son état (expression, ressorts, sommeil) pendant la navigation.

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { RobotDock } from 'robot-buddy/svelte';

	let { children } = $props();
	const where = $derived(page.url.pathname === '/assistant' ? 'anchor' : 'corner');
</script>

{@render children()}
<RobotDock {where} label="Ouvrir l'assistant" onactivate={() => goto('/assistant')} />
```

**2. Dans la page où il doit se poser, réserver sa place.** La taille vient de la classe.

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

**3. Le faire réagir à l'application** (facultatif) : `emotion`, `look`, et `celebrate()` à la
fin d'une tâche.

```svelte
<RobotDock bind:this={dock} {where} emotion={busy ? 'focus' : 'neutral'} look={myLook} />
<!-- plus tard : dock.celebrate() -->
```

Sans emplacement à occuper (pas de `RobotAnchor`), on peut aussi poser un robot simple n'importe
où avec `<Robot />` : il remplit son parent.

## Composants

### `RobotDock`

Le robot unique de l'application : position `fixed`, au-dessus du `RobotAnchor` de la page ou
dans le coin bas droit, avec une téléportation à chaque changement de place.

| Prop         | Type                               | Défaut       | Rôle                                                                |
| ------------ | ---------------------------------- | ------------ | ------------------------------------------------------------------- |
| `where`      | `'anchor' \| 'corner' \| 'hidden'` | obligatoire  | Sur l'emplacement de la page, dans le coin, ou caché                |
| `emotion`    | `Emotion`                          | `'neutral'`  | Expression demandée (voir [Expressions](#expressions-et-réactions)) |
| `look`       | `RobotLook`                        | galet menthe | Coque et couleur                                                    |
| `label`      | `string`                           | `'Ouvrir'`   | Nom accessible du bouton du coin                                    |
| `onactivate` | `() => void`                       | —            | Clic ou touche Entrée sur le robot du coin                          |

Méthode, via `bind:this` : `celebrate()`.

- Tant que `where` vaut `'anchor'` mais que la page n'a pas encore monté son `RobotAnchor`, le
  robot reste où il est.
- Sur l'emplacement, il suit sa position et sa taille à chaque image, pour accompagner une page
  qui se réorganise (un champ qui grandit, un redimensionnement).
- Entre deux emplacements de taille différente, il glisse au lieu de se téléporter.
- Dans le coin, le robot est un bouton : on le survole, il cligne et suit le regard, et un clic
  appelle `onactivate`. Sur l'emplacement, il réagit aux tapes.

### `RobotAnchor`

| Prop    | Type     | Rôle                                                         |
| ------- | -------- | ------------------------------------------------------------ |
| `class` | `string` | Classe qui donne la taille (et la position) de l'emplacement |

Un seul `RobotAnchor` affiché à la fois : le dernier monté l'emporte.

### `Robot`

Le robot seul, sur un canvas carré qui remplit son parent (donner une taille au parent).

| Prop          | Type          | Défaut                | Rôle                                                                   |
| ------------- | ------------- | --------------------- | ---------------------------------------------------------------------- |
| `emotion`     | `Emotion`     | `'neutral'`           | Expression demandée                                                    |
| `look`        | `RobotLook`   | galet menthe          | Coque et couleur ; change en direct                                    |
| `interactive` | `boolean`     | `true`                | Réagit aux tapes (chatouille, tête qui tourne, antenne)                |
| `sleepAfter`  | `number` (ms) | `60000`               | Inactivité avant le sommeil ; `Infinity` le garde éveillé              |
| `label`       | `string`      | `'Petit robot animé'` | Texte alternatif de l'image                                            |
| `decorative`  | `boolean`     | `false`               | Masqué aux lecteurs d'écran (quand un bouton par-dessus le nomme déjà) |
| `children`    | snippet       | —                     | Contenu posé par-dessus, qui partage le survol (par exemple un bouton) |

Méthode, via `bind:this` : `celebrate()`.

### `RobotLookPicker`

Le choix de la coque et de la couleur : un aperçu animé, les huit coques en vignettes (chacune
dans sa couleur), les neuf teintes et une couleur libre. Choisir une coque la prend dans sa
couleur, puis on la recolore.

```svelte
<script lang="ts">
	import { DEFAULT_LOOK, RobotLookPicker, sameLook } from 'robot-buddy/svelte';

	let { saved } = $props(); // l'apparence enregistrée
	let look = $state({ ...saved });
</script>

<form method="post" action="?/robot">
	<RobotLookPicker bind:look />
	<input type="hidden" name="shell" value={look.shell} />
	<input type="hidden" name="color" value={look.color} />
	<button disabled={sameLook(look, saved)}>Enregistrer</button>
	<button type="button" onclick={() => (look = { ...DEFAULT_LOOK })}>Par défaut</button>
</form>
```

Le sélecteur ne sauvegarde rien : c'est au projet de le faire (voir
[Enregistrer l'apparence](#enregistrer-lapparence-de-chacun)). L'aperçu et les vignettes ne
s'endorment pas.

## Le moteur sans Svelte

```ts
import { createRobot } from 'robot-buddy';

const canvas = document.querySelector('canvas')!; // carré, taillé en CSS
const robot = createRobot(canvas, {
	look: { shell: 'crt', color: '#f2d47e' },
	onemotion: (e) => console.log('expression', e)
});
robot.set('focus');
robot.celebrate();
robot.destroy(); // arrête l'animation et retire tous les écouteurs
```

**Options de `createRobot(canvas, options)`**

| Option        | Type                   | Défaut       | Rôle                                                                                        |
| ------------- | ---------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `look`        | `RobotLook`            | galet menthe | Coque et couleur de départ                                                                  |
| `interactive` | `boolean`              | `true`       | Réagit aux tapes                                                                            |
| `target`      | `HTMLElement`          | le canvas    | Élément dont le survol et les tapes comptent (utile si un bouton recouvre le canvas)        |
| `sleepAfter`  | `number` (ms)          | `60000`      | Inactivité avant le sommeil ; `Infinity` le garde éveillé                                   |
| `sleepZs`     | `boolean`              | `true`       | Dessiner les « z » du sommeil sur le canvas (`Robot.svelte` les affiche en HTML à la place) |
| `onemotion`   | `(e: Emotion) => void` | —            | Appelée à chaque changement d'expression, réactions comprises                               |

**Méthodes du robot renvoyé**

| Méthode              | Rôle                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `set(emotion)`       | Change l'expression demandée                                                               |
| `celebrate()`        | Saut de joie, étincelles, puis expression `happy`                                          |
| `blink(side?)`       | Cligne (`'both'`, `'left'` ou `'right'`)                                                   |
| `setLook(look)`      | Change la coque et la couleur en direct                                                    |
| `setInteractive(on)` | Active ou coupe les réactions aux tapes                                                    |
| `emotion`            | Expression affichée (lecture seule)                                                        |
| `destroy()`          | Arrête la boucle d'animation et retire les écouteurs ; à appeler quand le canvas disparaît |

La taille de dessin suit la taille CSS du canvas et la densité de l'écran (jusqu'à 2,5×).

## Expressions et réactions

**Expressions** (`Emotion`) : `neutral`, `happy`, `love`, `curious`, `surprised`, `worried`, `sad`,
`angry`, `suspicious`, `tired`, `sleep`, `focus`. `focus` fait défiler une pluie de chiffres dans
les yeux : c'est l'expression « je réfléchis ».

**Réactions du robot lui-même** (`mood.ts`). Elles passent par-dessus l'expression demandée, puis
la rendent :

| Geste                                                            | Réaction                                           |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| Survol prolongé (1,2 s)                                          | Amoureux (yeux en cœur) tant que le curseur reste  |
| Clic sur le haut de la coque (antenne, oreilles, haut du nuage…) | Surpris ou curieux, au hasard, pendant 1,8 s       |
| Tape sur le robot (`interactive`)                                | Chatouille ; trois tapes rapides : tête qui tourne |
| Une minute sans clic ni touche sur la page                       | Il s'endort, même si la souris bouge               |
| Clic ou touche pendant qu'il dort                                | Réveil, surpris, pendant 1,5 s                     |

Une nouvelle expression demandée (`set`, prop `emotion`) met fin à toute réaction, sommeil
compris. Il ne s'endort pas et ne devient pas amoureux pendant `focus`, `angry`, `suspicious` ou
`sleep`.

## Coques et couleurs

| Identifiant  | Nom                | Couleur conseillée | Le haut cliquable                 |
| ------------ | ------------------ | ------------------ | --------------------------------- |
| `pebble`     | Galet (par défaut) | Menthe `#a3d6c1`   | L'antenne à boule                 |
| `crt`        | Télé rétro         | Beurre `#f2d47e`   | Les antennes en oreilles de lapin |
| `egg`        | Pocket             | Orange `#ff9447`   | L'anneau de porte-clés            |
| `helmet`     | Astronaute         | Nacre `#dfe4ea`    | La balise                         |
| `cat`        | Chaton             | Rose `#f5b0cc`     | Les oreilles                      |
| `headphones` | Casque audio       | Lavande `#c4b5f2`  | L'antenne à boule                 |
| `cloud`      | Nuage              | Ciel `#9ccbf0`     | Le haut du nuage                  |
| `pixel`      | Pixel              | Corail `#f4a593`   | L'antenne en blocs                |

Les yeux, les expressions, le sommeil et la téléportation sont les mêmes pour toutes les coques.

**Couleurs.** `ROBOT_COLORS` propose neuf teintes : Menthe, Ciel, Lavande, Rose, Corail, Orange,
Beurre, Nacre, Graphite. N'importe quelle couleur `#rrggbb` convient : le clair, l'ombre et le
contour en sont tirés (`shellPalette`). Les teintes douces gardent les yeux lisibles ; une couleur
très sombre fonctionne, mais l'écran se distingue moins de la coque.

**`looks.ts` exporte**

| Export                     | Rôle                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| `SHELLS`                   | Les coques : `{ id, name, color }`                                          |
| `ROBOT_COLORS`             | Les teintes proposées : `{ name, hex }`                                     |
| `ShellId`, `RobotLook`     | Types : `RobotLook = { shell: ShellId; color: string }`                     |
| `DEFAULT_LOOK`             | Le galet menthe                                                             |
| `normalizeLook(valeur)`    | Apparence sûre à partir d'une valeur enregistrée ou reçue (voir ci-dessous) |
| `suggestedColor(shell)`    | Couleur conseillée d'une coque                                              |
| `sameLook(a, b)`           | Même coque et même couleur, sans tenir compte de la casse                   |
| `isShell(v)`, `isColor(v)` | Gardes : coque connue, couleur `#rrggbb`                                    |
| `shellPalette(color)`      | Tons `light`, `mid`, `edge`, `deep` tirés d'une couleur                     |

`normalizeLook` garde ce qui est valable : une coque inconnue devient le galet, une couleur
invalide devient la couleur conseillée de la coque, et `null` donne le galet menthe.

## Enregistrer l'apparence de chacun

Le module ne stocke rien. Il suffit de garder deux chaînes, la coque et la couleur, où l'on veut
(base de données, préférences, `localStorage`).

- **En lisant**, passer la valeur par `normalizeLook()` avant de la donner au robot : une valeur
  ancienne, vide ou trafiquée devient une apparence valide.
- **En écrivant**, refuser ce qui n'est pas valable avec `isShell()` et `isColor()`, côté serveur.
- **« Par défaut »** : on peut enregistrer « aucun choix » (valeurs vides) plutôt que le galet
  menthe. Ces comptes suivront ainsi le défaut s'il change un jour.
- **Ne jamais renommer** un identifiant de coque : il est enregistré tel quel.

Dans Comptoir, par exemple : deux colonnes facultatives `robot_shell` et `robot_color` sur `user`,
`src/lib/server/robot-look.ts` (`robotLookOf`, `saveRobotLook`), et la carte « Apparence du
robot » de `src/routes/(app)/profile/`.

## Personnaliser l'affichage (CSS)

Variables CSS facultatives, à poser sur `:root` ou sur un parent du dock :

| Variable                     | Défaut         | Rôle                                                                 |
| ---------------------------- | -------------- | -------------------------------------------------------------------- |
| `--robot-corner-size`        | `72px`         | Taille du robot dans le coin                                         |
| `--robot-corner-size-narrow` | `48px`         | Taille dans le coin sous 760 px de large                             |
| `--robot-z`                  | `15`           | `z-index` du dock : au-dessus de la page, sous ses menus et panneaux |
| `--robot-focus`              | `currentColor` | Anneau de focus du bouton du coin                                    |
| `--robot-glow`               | vert menthe    | Lueur de la téléportation                                            |

Le composant utilise aussi, s'ils existent, les jetons `--text`, `--text-2`, `--border`,
`--panel`, `--hover` et `--accent` du projet (sélecteur), avec des valeurs de repli.

## Accessibilité et mouvement réduit

- Le robot est une image nommée (`label`). Dans le coin, c'est un vrai bouton nommé (`label`),
  atteignable au clavier, avec un anneau de focus.
- Avec `prefers-reduced-motion`, il ne se téléporte pas (il change simplement de place), ne
  respire plus, ne cligne plus et ne regarde plus autour de lui de lui-même, ne sautille plus
  quand il est content, n'émet ni étincelles ni cœurs, la pluie de chiffres de `focus` s'arrête,
  et ses « z » restent immobiles. Les petits sursauts (surprise, fête) et le suivi du curseur
  restent.
- Le sélecteur utilise de vrais boutons radio (coques, teintes) et un champ couleur natif.

## Ce que le projet d'accueil doit écrire

Le module ne connaît ni les routes, ni l'application, ni la base. Ces parties s'écrivent dans
chaque projet. Pour exemple, voici où elles sont dans le projet d'origine (Comptoir,
`toryo-agent`) :

| Quoi                  | Dans Comptoir                                                  | Rôle                                                                                |
| --------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Placement             | `src/lib/ui/robot.ts` (`robotPlacement`)                       | Pour chaque page : sur l'emplacement (grand ou réduit), dans le coin, ou caché      |
| Humeur                | `src/lib/ui/robot.ts` (`robotMood`)                            | L'état de l'application devient une expression (réfléchit, content, surpris)        |
| Fête                  | `src/routes/(app)/+layout.svelte`                              | Appel de `celebrate()` quand une tâche aboutit                                      |
| Emplacements          | `src/routes/(app)/agent/+page.svelte`, `src/routes/layout.css` | `RobotAnchor` de l'accueil (150 px) et de la conversation (124 px, à côté du champ) |
| Apparence enregistrée | `src/lib/server/robot-look.ts`, `src/routes/(app)/profile/`    | Lecture, écriture et écran de choix                                                 |

## Tests

| Fichier                          | Où il tourne | Ce qu'il vérifie                                                                         |
| -------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `looks.test.ts`                  | Node         | Catalogue, `normalizeLook`, `sameLook`, tons                                             |
| `mood.test.ts`                   | Node         | Amour, antenne, sommeil, réveil                                                          |
| `engine.svelte.test.ts`          | Navigateur   | Pour chaque coque : yeux entiers (même « surpris »), couleur appliquée, clic sur le haut |
| `Robot.svelte.test.ts`           | Navigateur   | Retour au galet menthe quand `look` disparaît                                            |
| `RobotLookPicker.svelte.test.ts` | Navigateur   | Une coque se choisit dans sa couleur                                                     |

Les tests « navigateur » demandent le mode navigateur de Vitest (`vitest-browser-svelte`, provider
Playwright). Ici : `pnpm test` (voir [Développer le module](#développer-le-module)).

## Ajouter une coque

1. `src/lib/looks.ts` : ajouter `{ id, name, color }` à `SHELLS` (un identifiant nouveau, jamais
   réutilisé).
2. `src/lib/engine.ts` : ajouter son entrée à `SHELL_DRAWINGS`. Seuls `body`, `screen` et `top` sont
   obligatoires :
   - `body` : la silhouette ;
   - `screen` : le contour de l'écran, assez grand pour les yeux (environ x 62 à 238, y 110 à
     206 dans le dessin de 300 × 300) ;
   - `back`, `details`, `front` : ce qui va derrière la coque, dessus, et par-dessus l'écran ;
   - `antenna` : ce qui bouge avec le ressort ;
   - `top` : la zone de clic qui fait sursauter ;
   - `flat` : aplat avec contour épais au lieu du dégradé.
3. Les tests `engine.svelte.test.ts` couvrent automatiquement la nouvelle coque, sauf la zone de
   clic : ajouter un point dans `TOP`.

## Limites connues

- **Une seule instance de `RobotDock`** par application, et un seul `RobotAnchor` affiché à la
  fois (état partagé dans `anchor.svelte.ts`).
- **Textes en français** dans le module : noms des coques et des teintes (`looks.ts`), textes
  par défaut de `Robot.svelte` et du sélecteur. Pour une autre langue, les traduire à ces
  endroits.
- **Avertissement en développement** : au chargement d'une page qui contient le sélecteur, la
  console peut afficher « The specified value "" does not conform… valid CSS color ». Il vient de
  Svelte, qui vide un instant le champ couleur à l'hydratation ; la valeur est bien remise.
- **Rendu côté serveur** : le canvas ne se dessine que dans le navigateur. Au premier affichage
  rendu par le serveur, l'emplacement est vide jusqu'au chargement du script.

## Développer le module

```sh
pnpm install                          # outils de développement, et construit dist/
pnpm exec playwright install chromium # une fois, pour les tests navigateur
pnpm check                            # types (svelte-check)
pnpm test                             # tests Node et navigateur
pnpm build                            # paquet dans dist/ (svelte-package)
pnpm lint                             # mise en forme (Prettier)
```

- Sources dans `src/lib/`, paquet construit dans `dist/` (ignoré par git). Les imports en `.ts`
  des sources deviennent des `.js` dans `dist/`.
- Messages de commit en anglais (conventional commits), comme dans le projet d'origine.
- Pas encore de licence : en choisir une (par exemple MIT) avant de rendre le dépôt public ou de
  publier sur npm.
