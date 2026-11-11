# DÉCLIC — spécification de design (v2)

> Rédigée par l'agent **directeur-artistique** le 2026-11-11, à la demande de Quentin : « Il manque des photos liées au site… Applique-toi. Sois un pro. Aussi le design du site n'est pas bon. »
> Destinataire : l'agent **dev-design**. Chaque valeur est à appliquer telle quelle. En cas de doute, les **règles d'or d'AGENTS.md priment** sur ce document.
> Captures d'audit : `design/audit/` (voir §1). Les photos qu'on y voit sont des **images de test synthétiques** (« IMAGE DE TEST · portrait / lieu / photo NASA ») injectées pour juger la mise en page : les données locales n'ont presque pas de photos.

---

## 0. En bref

**Diagnostic (5 points)**
1. **La une n'est pas l'actualité.** Le plus grand texte du site est un slogan (« Aujourd'hui, le monde a encore des choses à t'apprendre. ») ; sur ordinateur, le titre principal arrive sous la ligne de flottaison, sur mobile après 560 px. Un média se juge à sa une : ici elle est vide.
2. **Les photos sont posées, pas mises en page.** Un seul gabarit (3:2 en haut de carte) pour tout : une photo d'illustration de personne devient une image de 800 px de large comme si c'était la photo de l'événement, la même illustration revient 3 à 4 fois sur une page, la grille avec ou sans photo est en dents de scie, les légendes sont trop longues (licence NASA en entier) ou absentes (Sciences : crédit incrusté sur l'image).
3. **Un patchwork de blocs de couleur sans système.** Pétrole (Déclic) + pétrole (quiz) + gris (rubriques) + jaune plein écran (découverte) + noir (frise) + 5 couleurs pour 5 cartes de jeux : la couleur ne veut rien dire et écrase les titres. En sombre, l'aplat jaune éblouit et l'anneau Déclic disparaît sur le pétrole.
4. **Typographie sans hiérarchie franche.** Titres de liste, titres de cartes et titres de section ont presque la même taille ; la ligne de métadonnées (pastille + rubrique + média + pays + heure + EN + cœur) déborde et renvoie le cœur à la ligne ; l'ensemble « fond crème + serif + accent corail » fait gabarit.
5. **Finitions et cohérence.** « Surprends-moi » déborde de son disque, la déco du quiz chevauche le texte (Jouer), en-têtes du tableau collés (« RecordDernierParties », Mon espace), index des rubriques avec des « 0 », mêmes articles répétés d'une section à l'autre, carte du quiz « culture générale » alors que le quiz par défaut est celui de l'actu.

**Direction (3 phrases)**
DÉCLIC assume d'être un **quotidien** : papier blanc, encre noire, filets, et **le titre de une en très grand corps**, là où trône aujourd'hui le slogan — c'est la seule audace, tout le reste est discipliné. Les photos suivent un **système à trois formats** (grande photo pour un lieu ou une image NASA, médaillon pour un portrait, vignette carrée dans les listes), toujours légendées « Illustration : … » avec auteur et licence, jamais deux fois la même sur un écran, et la page reste belle sans aucune photo. La couleur prend un rôle : **vermillon = marque** (anneau, logo, une action principale), **pétrole = le parcours Déclic et le quiz**, jaune = surlignage des réponses ; les autres aplats disparaissent.

**Tâches P1** : voir §9 (P1-1 à P1-9).

---

## 1. Audit (captures `design/audit/`)

Capturé le 2026-11-11 sur le build courant (y compris le `PhotoCredit` déjà ajouté par l'orchestrateur), horloge fixée au 2026-11-08 20 h 30 UTC, données de démonstration + 11 photos de test injectées (Playwright, sans toucher `public/` ni `dist/`).

| Fichier | Ce qu'il montre |
|---|---|
| `01-accueil-mobile-premier-ecran.png` | 1er écran mobile : date, slogan géant, puis une illustration de portrait recadrée 3:2 ; le titre de une est à moitié sous la barre de navigation. |
| `02-accueil-desktop-premier-ecran.png` | 1er écran desktop : slogan + carte Déclic occupent tout l'écran, aucune actualité visible. |
| `03-accueil-mobile-blocs-de-couleur.png` | Succession pétrole / pétrole / gris / jaune / crème ; index des rubriques avec « 0 » ; Sciences sans légende sous la photo. |
| `04-accueil-mobile-sombre.png` | Mode sombre : anneau Déclic invisible sur pétrole, boutons « Commencer » devenus noirs, aplat jaune éblouissant. |
| `05-accueil-desktop-sciences-rubriques.png` | Crédit incrusté sur la photo NASA, mini-expérience, mêmes articles NASA répétés dans « Selon tes centres d'intérêt ». |
| `06-actus-desktop-portrait-geant.png` | Une illustration de portrait affichée à 800 px de large en tête d'Actualités : elle prend la place d'une photo d'événement. |
| `07-actus-desktop-grille-photos.png` | Grille de cartes en dents de scie, même portrait répété, légende NASA de trois lignes, cœur renvoyé à la ligne par le badge EN. |
| `08-actus-mobile.png` | ~620 px de filtres avant le premier titre ; illustrations pleine largeur répétées dans la liste. |
| `09-declic-jouer-quiz-mobile.png` | Déclic écran 1 (cartes arrondies + gros chiffres décoratifs), Jouer (5 couleurs, déco qui chevauche le texte), correction du quiz (sans photo). |
| `10-decouvrir-moi-mobile.png` | « Surprends-moi » qui déborde du disque ; en-têtes de tableau collés dans Mon espace. |
| `11-declic-desktop-sombre.png` | Déclic en sombre : anneau à peine visible dans l'en-tête, cartes à bordure. |

---

## 2. Principes (à garder en tête pour chaque écran)

1. **L'actualité d'abord.** Sur l'accueil, le premier titre d'article doit être visible sans défiler : mobile 390×844 → bas du titre de une à ≤ 640 px du haut (avec une photo large, au moins la 1re ligne du titre à ≤ 700 px) ; desktop 1440×900 → titre de une entièrement visible.
2. **Une image montre ce qu'elle montre.** Une illustration Commons montre une personne ou un lieu, **pas l'événement** : elle n'est jamais présentée comme une photo de reportage (pas de pleine largeur pour un portrait, toujours « Illustration : sujet »).
3. **Sans photo, c'est un choix typographique, pas un trou.** Aucun cadre gris vide, aucune image de remplacement, aucune icône décorative à la place d'une photo.
4. **Éditorial = angles vifs et filets ; interactif = arrondi** (règle existante, confirmée). Les photos sont à angles vifs.
5. **Une couleur = un rôle** (§3). Pas de nouvel aplat de couleur sans rôle.
6. **Pas de répétition** : une même photo, et un même article, une seule fois par page.

---

## 3. Jetons de couleur (`src/styles/index.css`)

Remplacer les trois blocs de variables par ceci (les noms existants sont conservés, deux jetons sont ajoutés : `--line-ui`, `--ink-fixed`, `--photo-edge`).

```css
:root {
  --paper: #ffffff;          /* fond de page : papier blanc (fin du crème) */
  --paper-2: #f4f3f0;        /* surfaces : bandeaux, champs, puces */
  --paper-3: #e9e7e2;        /* surfaces appuyées, survol */
  --ink: #121416;            /* texte, filets forts, boutons primaires — 18,5:1 */
  --ink-2: #3f4549;          /* texte secondaire — 9,7:1 */
  --ink-3: #5f666b;          /* métadonnées, légendes — 5,8:1 sur blanc, 4,7:1 sur paper-3 */
  --rule: #e3e0da;           /* filets fins (décoratifs) */
  --line-ui: #7a8186;        /* bordures des contrôles (choix, champs) — 3,9:1 blanc, 3,2:1 paper-3 */
  --vermilion: #ef6448;      /* MARQUE : anneau, logo, une action principale (texte ink-fixed dessus, 5,8:1) */
  --vermilion-ink: #b23e25;  /* texte/lien vermillon — 5,8:1 */
  --petrol: #176b65;         /* PARCOURS : Déclic du jour, quiz */
  --petrol-ink: #145d58;
  --on-petrol: #f5f3ee;      /* texte sur pétrole — 5,7:1 */
  --sun: #f2d978;            /* SURLIGNAGE : réponse dans un titre, sélection */
  --sun-ink: #6b5400;
  --ok: #1d7a4a;  --ok-bg: #dcefe3;
  --ko: #b23e25;  --ko-bg: #f8dfd8;
  --focus: #176b65;
  --ink-fixed: #121416;      /* texte posé sur un aplat clair constant (vermillon, jaune, bouton blanc sur pétrole) */
  --photo-edge: rgb(18 20 22 / 0.06);
  --shadow: 0 1px 2px rgb(18 20 22 / 0.06), 0 8px 24px -14px rgb(18 20 22 / 0.28);
  color-scheme: light;
}

/* Sombre : à dupliquer à l'identique dans
   @media (prefers-color-scheme: dark) { :root:not([data-theme='light']) {…} } et :root[data-theme='dark'] {…} */
{
  --paper: #0e1113;
  --paper-2: #171b1e;
  --paper-3: #22272b;
  --ink: #edebe6;            /* 15,9:1 */
  --ink-2: #c3c6c4;          /* 11:1 */
  --ink-3: #9aa09d;          /* 7,1:1 sur paper, 6,5:1 sur paper-2 */
  --rule: #2b3134;
  --line-ui: #737b80;        /* 4,4:1 */
  --vermilion: #ff7a5e;
  --vermilion-ink: #ff9a82;
  --petrol: #1b6f69;         /* le pétrole reste pétrole ; texte on-petrol 5,4:1 */
  --petrol-ink: #6cc6bc;
  --on-petrol: #f5f3ee;
  --sun: #f2d978;  --sun-ink: #f2d978;
  --ok: #7fd3a1;  --ok-bg: #173628;
  --ko: #ff9a82;  --ko-bg: #3d211b;
  --focus: #6cc6bc;
  --ink-fixed: #121416;
  --photo-edge: rgb(255 255 255 / 0.08);
  --shadow: 0 1px 0 rgb(0 0 0 / 0.3), 0 10px 30px -12px rgb(0 0 0 / 0.6);
  color-scheme: dark;
}
```

Dans `@theme inline`, ajouter : `--color-line-ui: var(--line-ui); --color-ink-fixed: var(--ink-fixed);`.
Remplacer partout `text-[#171b1d]` par `text-ink-fixed`.
`index.html` : `<meta name="theme-color" content="#FFFFFF" />` (+ une 2e balise `media="(prefers-color-scheme: dark)" content="#0E1113"`). `vite.config.ts` (manifest) : `background_color: '#FFFFFF'` (garder `theme_color: '#176B65'`).

**Rôles (à respecter strictement)**

| Couleur | Autorisée pour | Interdite pour |
|---|---|---|
| ink | texte, filets forts (1–2 px), bouton primaire, puce active | grands aplats de section (sauf pied de la frise, voir §8) |
| vermilion | anneau/logo, **une** action principale par écran (« Commencer » du Déclic, « Surprends-moi »), trou du texte à trous, pastille de rubrique | texte (→ `vermilion-ink`), fonds de section |
| petrol | bandeau/carte Déclic, bloc du quiz de l'actu, accents « Pour prendre du recul » | cartes de jeux autres que le quiz, Mon espace (→ voir §8.7) |
| sun | `<mark>` de la réponse, `::selection`, pastille des rubriques Histoire/Culture/Sport/Insolite | **aplat de section** (le bandeau jaune de la découverte disparaît) |
| paper-2 | bandeau « Prendre du recul », champs, puces, carte « Pour comprendre » | — |

**Boutons sur pétrole** (Déclic, quiz, Mon espace) : créer la variante `onPetrol` dans `Button.tsx` : `'bg-white text-ink-fixed hover:bg-white/90'` — blanc constant dans les deux thèmes (exception assumée à « jetons uniquement » : aujourd'hui `bg-paper` devient noir en sombre). Les `<Link>` stylés à la main (`QuizTeaser`, `DeclicCard`) passent par `buttonClass('onPetrol', …)`.

---

## 4. Typographie

Familles inchangées (auto-hébergées) : **Newsreader Variable** (titres, chapôs, corps éditorial) et **DM Sans Variable** (interface, métadonnées). Ce qui change : graisse des titres plus franche, échelle plus contrastée, deux utilitaires ajoutés (`t-h4`, `t-caption`).

Remplacer les utilitaires dans `index.css` :

```css
@utility t-display {   /* titre de une SANS grande photo ; titres de pages */
  font-family: var(--font-serif);
  font-variation-settings: 'opsz' 72;
  font-weight: 580;
  font-size: clamp(2.125rem, 1.35rem + 3.4vw, 4rem);   /* 34 px @390 → 64 px @1440 */
  line-height: 1.03;
  letter-spacing: -0.022em;
}
@utility t-lead {      /* titre de une AVEC grande photo (la photo porte déjà le poids) */
  font-family: var(--font-serif);
  font-variation-settings: 'opsz' 60;
  font-weight: 570;
  font-size: clamp(1.75rem, 1.3rem + 1.8vw, 2.75rem);  /* 28 → 44 px */
  line-height: 1.07;
  letter-spacing: -0.018em;
}
@utility t-h1 {        /* titres de pages secondaires */
  font-family: var(--font-serif);
  font-variation-settings: 'opsz' 60;
  font-weight: 540;
  font-size: clamp(1.875rem, 1.3rem + 2.4vw, 3.25rem);
  line-height: 1.04;
  letter-spacing: -0.02em;
}
@utility t-h2 {        /* titres de SECTION (tous, cf. SectionHeading) */
  font-family: var(--font-serif);
  font-variation-settings: 'opsz' 36;
  font-weight: 550;
  font-size: clamp(1.5rem, 1.25rem + 0.9vw, 2rem);      /* 24 → 32 px */
  line-height: 1.12;
  letter-spacing: -0.012em;
}
@utility t-h3 {        /* titres d'articles dans les listes */
  font-family: var(--font-serif);
  font-variation-settings: 'opsz' 24;
  font-weight: 560;
  font-size: 1.1875rem;                                  /* 19 px ; 20 px dès 1024 px */
  line-height: 1.24;
  letter-spacing: -0.006em;
  @media (min-width: 1024px) { font-size: 1.25rem; }
}
@utility t-h4 {        /* titres compacts : « Ailleurs, le même sujet », regards, correction */
  font-family: var(--font-serif);
  font-variation-settings: 'opsz' 18;
  font-weight: 540;
  font-size: 1.0625rem;                                  /* 17 px */
  line-height: 1.3;
}
@utility t-lede { font-family: var(--font-serif); font-variation-settings: 'opsz' 16; font-size: 1.125rem; line-height: 1.55; }
@utility t-body { font-family: var(--font-serif); font-variation-settings: 'opsz' 14; font-size: 1.0625rem; line-height: 1.65; }
@utility t-meta { font-family: var(--font-sans); font-size: 0.8125rem; line-height: 1.35; color: var(--ink-3); font-variant-numeric: tabular-nums; }
@utility t-caption {   /* légendes photo */
  font-family: var(--font-sans);
  font-size: 0.75rem;                                    /* 12 px — ink-3 sur blanc 5,8:1 */
  line-height: 1.4;
  color: var(--ink-3);
}
@utility t-label { font-family: var(--font-sans); font-size: 0.875rem; font-weight: 600; line-height: 1.3; }
```

Règles :
- Remplacer les tailles ad hoc repérées : `PerspectiveList` (`text-[1rem]` / `text-[1.08rem]`) → `t-h4` ; `ActuCorrection` titre (`text-[1.15rem]`) → `t-h4` + `text-[1.125rem]` ; `QuizTeaser` question (`text-[1.5rem]`) → `t-h2` ; Jouer titre de carte (`text-[2.6rem]`) → `t-h1` ; menu mobile `text-[1.2rem]` → `t-h3`.
- Casse de phrase partout, pas de capitales espacées, pas de « → » ajouté au texte.
- `text-balance` sur les titres de une et de section ; `text-pretty` sur les titres de liste.

---

## 5. Grille, espacements, formes

- Conteneur `wrap` inchangé (max 82rem, gouttières 16 / 24 / 40 px).
- Grille desktop : 12 colonnes, `gap-x-10` (40 px).
- Espacement vertical entre **sections** de l'accueil : `mt-14 lg:mt-24` (56 / 96 px), partout le même. Entre un titre de section et son contenu : `mt-5 lg:mt-6`.
- Lignes d'articles : `py-4` (16 px), séparées par `divide-rule`.
- **En-tête de section unique** (`SectionHeading`, `components/ui/bits.tsx`) : filet `border-t-2 border-ink pt-3`, titre `t-h2`, lien d'action optionnel à droite (`t-label` + icône `ArrowRight` 16 px), description optionnelle `t-meta mt-1 measure`. À utiliser pour : Un sujet, plusieurs regards · Prendre du recul · Sciences & espace · Une découverte inattendue · Ce jour-là · Selon tes centres d'intérêt · (Actus) Vu par plusieurs médias, Où se passe l'actualité ?, Les plus récents.
- Rayons : surfaces interactives `rounded-[20px]` (mobile) / `rounded-[28px]` (≥ 1024) ; boutons `rounded-full` ; **photos, cartes éditoriales, listes : 0**.
- Ombres : aucune sur les cartes éditoriales. `shadow-lift` réservé au bouton central de la barre mobile et aux popovers.

---

## 6. Système photo (cœur de la demande)

### 6.1 Données reçues
`article.image = { url, credit, license?, licenseUrl?, sourceUrl?, width?, height?, illustration?, subject? } | null`
- `illustration: true` → Wikimedia Commons (montre la personne ou le lieu cité).
- sinon → photo NASA (montre réellement le sujet de l'article).

### 6.2 Forme de l'image
```ts
// src/components/news/photo.ts
export type PhotoShape = 'portrait' | 'wide'
export function photoShape(img: NonNullable<Article['image']>): PhotoShape {
  // si l'orchestrateur ajoute subjectKind ('person' | 'place'), il prime (voir §11)
  if (img.width && img.height) return img.height / img.width >= 1.05 ? 'portrait' : 'wide'
  return img.illustration ? 'portrait' : 'wide'   // par défaut prudent : une illustration sans dimensions = médaillon
}
```

### 6.3 Quatre variantes d'affichage — composant `ArticlePhoto`
Nouveau fichier `src/components/news/ArticlePhoto.tsx` ; il remplace `Photo` dans `Story.tsx` et l'`<img>` en ligne de `ScienceDesk.tsx`. `PhotoCredit` (déjà créé par l'orchestrateur) y est déplacé et étendu (§6.4).

```ts
type Variant = 'hero' | 'medallion' | 'thumb'
export function ArticlePhoto(props: {
  image: NonNullable<Article['image']>
  variant: Variant
  priority?: boolean          // true pour le titre de une : loading="eager" fetchpriority="high"
  onFail?: () => void         // le parent bascule sur la mise en page sans photo
  className?: string
}): JSX.Element | null
```

| Variante | Quand | Cadre | Dimensions | Cadrage | Légende |
|---|---|---|---|---|---|
| `hero` | photo `wide` (lieu, NASA) en tête d'un article principal, de Sciences, d'un écran du Déclic | 3:2 mobile, 16:9 dès 1024 px | 100 % de la colonne ; **mobile : pleine largeur bord à bord** (`-mx-4 sm:mx-0`) | `object-cover`, centre | visible dessous, `t-caption mt-2` (en mobile, `px-4 sm:px-0` pour rester dans la gouttière) |
| `medallion` | photo `portrait` d'un article principal / d'un écran du Déclic | **4:5** | 112 px mobile, 168 px ≥ 640, 200 px ≥ 1024 | `object-cover object-[50%_22%]` | visible, sous le bloc chapô+médaillon, pleine largeur |
| `thumb` | toutes les lignes de liste (`StoryRow`), sujets « plusieurs regards », correction de quiz | **1:1** | 80 px mobile, 96 px ≥ 1024 | portrait `object-[50%_22%]`, large : centre | **bouton crédit** (§6.4), pas de légende visible |
| — | `portrait` en `hero` | **interdit** : toujours rétrogradé en `medallion` | | | |

Règles communes à `<img>` :
- `width`/`height` depuis les données (évite le décalage de mise en page), `decoding="async"`, `loading="lazy"` sauf `priority`.
- Fond pendant le chargement : `bg-paper-2`, sans animation.
- Bord : `outline: 1px solid var(--photo-edge); outline-offset: -1px` (sépare une photo claire du blanc, une photo sombre du fond sombre). Aucun filtre, aucune retouche, aucun dégradé posé dessus, pas d'effet de zoom au survol.
- Angles vifs (`rounded-none`).
- `onError` → le composant renvoie `null` **et** appelle `onFail` : le parent repasse en mise en page « sans photo » (pas de cadre vide).
- `alt` : `hero` et `medallion` → `Illustration : ${subject}` (illustration) ou `""` pour une photo NASA dont le titre dit déjà tout ; `thumb` → `""` (le titre voisin et le bouton crédit suffisent).

### 6.4 Légende et crédit — `PhotoCredit`
`PhotoCredit({ image, mode: 'caption' | 'button' })`

**Mode `caption`** (hero, medallion) — une ligne `t-caption`, qui peut passer à la ligne :
- Illustration : `<span class="font-semibold text-ink-2">Illustration : {subject}</span>` · `{credit}`, `<a href={licenseUrl}>{license}</a>` · `<a href={sourceUrl}>Wikimedia Commons</a>`
  Exemple : **Illustration : Gadi Eisenkot** · Jean Dupont, CC BY-SA 4.0 · Wikimedia Commons
- NASA : **Photo : NASA**, puis la licence seulement si elle fait ≤ 32 caractères ; sinon elle va dans l'attribut `title` de la légende et dans le popover (fin de la licence NASA de trois lignes).
- Liens : `underline decoration-[color-mix(in_oklab,currentColor_35%,transparent)] underline-offset-2 hover:decoration-current`, `target="_blank" rel="noopener noreferrer"`, texte masqué « (nouvel onglet) ».
- La légende vit **sous** l'image, jamais incrustée dessus (fin du crédit sur la photo de Sciences).

**Mode `button`** (thumb) — crédit accessible en un geste :
- Bouton posé dans le coin bas-droit de la vignette : disque 24 px `bg-[rgb(18_20_22/0.62)] text-white`, icône Lucide `Info` 14 px ; zone tactile 44 px (`before:absolute before:-inset-[10px]`). `relative z-10` pour passer au-dessus du lien étiré de la ligne.
- `aria-label="Crédit de la photo : {subject ?? credit}"`, `aria-expanded`, `aria-controls`.
- Ouvre un panneau `absolute right-0 top-full mt-2 w-[min(18rem,80vw)] z-20 bg-paper border border-rule shadow-lift p-3 t-caption` contenant : la légende complète (mode caption) + pour une illustration la phrase « Photo d'illustration : elle montre la personne ou le lieu cité, pas l'événement. »
- Fermeture : `Échap`, clic extérieur, second appui ; focus rendu au bouton.

### 6.5 Une photo ne se répète pas — `pickPhotos`
Calcul **pur** (pas d'état mutable pendant le rendu : StrictMode rend deux fois) :
```ts
// src/components/news/photo.ts
/** Ids des articles autorisés à montrer leur photo, dans l'ordre d'affichage de la page.
 *  Écarte une photo déjà montrée (même url) ou un sujet déjà montré (même subject, insensible à la casse/accents). */
export function pickPhotos(ordered: Article[], max = Infinity): Set<string>
```
- Accueil (`HomePage`) : construire la liste ordonnée de tout ce qui est affiché (une, 4 titres, regards, recul, sciences, pour toi) → `allowed` → passer `showPhoto={allowed.has(a.id)}` aux composants.
- Actus (`NewsPage`) : idem sur l'article principal puis la liste.
- Déclic écran 1 : idem sur les 3 articles.
- **Articles répétés** : sur l'accueil, « Selon tes centres d'intérêt » et « Sciences & espace » excluent les ids déjà affichés plus haut (même passe).

### 6.6 Sans photo
- Titre de une : passe en `t-display` (le plus grand corps du site). Si un pays est cité, la `LocatorMap` existante reste en dessous (elle n'est **pas** affichée quand il y a une photo).
- Ligne de liste : le titre prend toute la largeur ; pas de vignette fantôme.
- Aucun pictogramme ni aplat « pour remplir ».

### 6.7 Où ne jamais mettre de photo
- **Avant une réponse** : question du quiz, texte à trous, Déclic écran 4. Une photo de Gadi Eisenkot ou de Cracovie donnerait la réponse. La photo n'apparaît que dans la **correction**.
- Tribunes (`kind: 'opinion'`) : pas de photo (un portrait à côté d'une tribune ressemble à une signature).
- Bandeau « Un sujet, plusieurs regards » de la boîte de dialogue de comparaison : titres seuls (la comparaison porte sur les mots).

---

## 7. Composants

### 7.1 `Meta` (`components/news/Story.tsx`)
```
■ Monde   franceinfo · il y a 4 h · EN
```
- Une seule ligne sur mobile : `flex items-center gap-x-2 min-w-0` ; le nom du média ne se coupe pas, le pays d'édition passe en `hidden sm:inline` dans les listes (gardé dans l'article principal).
- Pastille de rubrique : carré 8 px conservé, libellé `font-semibold` dans la couleur de ton.
- **Le cœur sort de la ligne** : `trailing` n'est plus rendu dans le flux. Dans `StoryRow`, `LeadStory` : bouton favori `absolute top-3 right-0` (lignes) / `top-0 right-0` (une), et le titre reçoit `pr-11`. Fini le cœur renvoyé à la ligne par le badge EN.
- Badge EN : `rounded-[3px] border border-line-ui px-1 text-[0.6875rem] font-semibold text-ink-2`.

### 7.2 `LeadStory` — article principal
Variantes selon la photo (calculées dans le composant ; `onFail` ramène à « sans photo »).

**Mobile (390 px)**
```
A. Photo large (lieu, NASA)          B. Portrait (illustration)          C. Sans photo
┌──────────────────────────────┐    ┌──────────────────────────────┐    ┌──────────────────────────────┐
│██████ photo 3:2 bord à bord ██│    │■ Monde  franceinfo · 4 h   ♡ │    │■ Monde  franceinfo · 4 h   ♡ │
│██████████████████████████████│    │En Israël, Gadi Eisenkot      │    │En Israël, Gadi               │
│Illustration : Cracovie · …   │    │affirme que le Likoud…        │    │Eisenkot affirme              │
│■ Monde  BBC News · 2 h     ♡ │    │(t-display 34 px)             │    │que le Likoud…                │
│Titre de une (t-lead 28 px)   │    │Le président      ┌────────┐  │    │(t-display 34 px)             │
│sur trois lignes              │    │israélien a…      │ 4:5    │  │    │Chapô du média (t-lede)       │
│Chapô du média (t-lede)       │    │…                 │ 112 px │  │    │Lire sur franceinfo ↗ [2 méd.]│
│Lire sur BBC News ↗  [3 méd.] │    │                  └────────┘  │    │┌ carte de situation ───────┐ │
│Ailleurs, le même sujet       │    │Illustration : Gadi Eisenkot ·│    ││        LocatorMap          │ │
│ France 24 — titre (t-h4)     │    │Jean Dupont, CC BY-SA 4.0 · … │    │└────────────────────────────┘ │
│ franceinfo — titre           │    │Lire sur franceinfo ↗ [2 méd.]│    │Ailleurs, le même sujet …     │
└──────────────────────────────┘    │Ailleurs, le même sujet …     │    └──────────────────────────────┘
                                    └──────────────────────────────┘
```
- A : ordre photo → légende → meta → titre. `ArticlePhoto variant="hero" priority`.
- B : meta → titre → `grid grid-cols-[1fr_112px] gap-4 sm:grid-cols-[1fr_168px] lg:grid-cols-[1fr_200px]` (chapô | médaillon, aligné en haut) → légende pleine largeur `mt-2` → actions. Sans chapô : le médaillon se place à droite du titre (`grid-cols-[1fr_112px]` sur le bloc titre).
- Titre : `t-lead` en A, `t-display` en B et C.
- Actions : « Lire sur {média} » (`t-label text-vermilion-ink`, icône `ArrowUpRight` 15 px) + bouton « N médias en parlent » (`rounded-full bg-paper-2 h-9 px-3.5 text-[0.8125rem] font-semibold hover:bg-paper-3`). Cible tactile ≥ 44 px : `before:absolute before:-inset-y-1` ou `h-11` sur mobile.
- « Ailleurs, le même sujet » : 2 titres max sur mobile, 3 sur desktop, en `t-h4`.

**Desktop (colonne de 8/12)**
```
A : photo 16:9 sur toute la colonne, légende, meta, titre t-lead, chapô (measure), actions.
B : meta, titre t-display sur 8 colonnes, puis [chapô 5 col | médaillon 200 px 4:5], légende, actions.
C : meta, titre t-display, chapô, actions, LocatorMap (hauteur 300).
```

### 7.3 `StoryRow` — ligne de liste
```
┌──────────────────────────────────────┐
│■ Sport  France 24 · 2 h            ♡ │
│Tennis : Carlos Alcaraz      ┌──────┐ │
│remporte pour la première    │ 1:1  │ │
│fois le Masters 1000 de      │ 80px │ │
│Paris                        └─────ⓘ┘ │
└──────────────────────────────────────┘
```
- Structure : meta pleine largeur (cœur en absolu), puis `grid grid-cols-[1fr_auto] gap-4 items-start` : titre `t-h3` | `ArticlePhoto variant="thumb"` quand `showPhoto`. Sans photo : pas de 2e colonne.
- Option `summary` (booléen) : chapô `mt-1.5 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-2` (utilisé dans Actus).
- Bouton « N médias » conservé sous le titre.

### 7.4 `StoryCard`
**Supprimé** au profit de `StoryRow summary` (fin de la grille de cartes en dents de scie). Mettre à jour les imports (`NewsPage`).

### 7.5 `DeclicStrip` (nouveau, `pages/HomePage.tsx` ou `components/ui/DeclicStrip.tsx`) — mobile et tablette
```
┌──────────────────────────────────────┐  bg-petrol text-on-petrol rounded-[20px] p-4
│ ◔  Ton Déclic du jour     [Commencer]│  anneau 44 px (tone="white" track="onDark")
│    5 minutes, 5 étapes               │  titre serif 1.25rem 550 ; sous-titre 0.875rem /90
│    Je n'ai que 2 minutes ⏱           │  lien t-label underline, text-on-petrol
└──────────────────────────────────────┘
```
- Bouton « Commencer / Continuer, étape N / Voir mon bilan » : variante `onPetrol`, `h-11 px-5`.
- Remplace sur mobile **à la fois** la grande carte Déclic et le gros bouton vermillon « Comprendre en 5 minutes » (doublon).
- Desktop : la `DeclicCard` actuelle reste dans la colonne de droite, resserrée (anneau 56 px, `p-5`, liste des 5 étapes en `text-[0.875rem] space-y-1.5`, bouton `onPetrol`), **au-dessus** des 4 titres secondaires.

### 7.6 `DeclicRing`
- Nouvelles valeurs : `tone: 'white'` (= `#ffffff`, constant) et `track: 'onDark'` (= `rgb(255 255 255 / 0.32)`, constant). À utiliser sur tout fond pétrole ou encre : `DeclicCard`, `DeclicStrip`, bouton « Déclic du jour » de l'en-tête, bouton central de la barre mobile, `QuizTeaser` si présent.
- Segments remplis sur pétrole : `tone="white"` ; sur encre (barre mobile, en-tête) : `tone="vermilion"`, `track="onDark"`.
- But : l'anneau reste lisible en clair **et** en sombre (aujourd'hui `paper` devient presque noir en sombre).

### 7.7 `Choices` (QCM)
- Bordure des options : `border-line-ui` (3:1 exigé pour les contrôles) au lieu de `ink/25`.
- États conservés (correct `bg-ok-bg border-ok`, faux `bg-ko-bg border-ko`, désactivé : opacité 0.6 **et** texte `ink-2`).

### 7.8 `PerspectiveList` / « Un sujet, plusieurs regards »
- Titres en `t-h4` ; nom du média `t-label` (0.8125rem) en `text-ink` ; pays d'édition en `CountryTag` (inchangé).
- `Topic` (`pages/home/Viewpoints.tsx`) : en-tête = `diversityLine` en `t-label` + **une** vignette `thumb` à droite si l'un des articles du sujet a une photo autorisée par `pickPhotos` (on prend la 1re). Le premier sujet (colonne large) peut utiliser `medallion` si portrait, `hero` 16:9 si lieu. Sans photo : rien.
- « Pour prendre du recul » : garder le fond `bg-petrol/8`, mais `rounded-none border-l-2 border-petrol pl-4 py-3` (c'est éditorial : angles vifs).

### 7.9 `ActuCorrection` — photo dans la correction
- Après la réponse seulement. Si l'article a une photo : `grid grid-cols-[1fr_72px] gap-3 items-start` (titre publié | vignette 1:1 72 px, bouton crédit). Sur fond coloré (`ko-bg`/`ok-bg`), la vignette garde son `outline` ; le bouton crédit reste blanc sur fond sombre translucide.
- `tone="onDark"` (accueil, bloc pétrole) : vignette autorisée aussi.
- Source de la photo : voir §11 (le `quiz.json` n'a pas d'image) ; repli possible via `useNews().data.byId.get(articleId)`.
- Titre publié en `t-h4` (`text-[1.125rem]`), le reste inchangé.

### 7.10 En-tête, barre mobile, pied de page (`components/layout/AppShell.tsx`)
- En-tête : fond `bg-paper/92` → avec le blanc, garder `backdrop-blur-md` ; filet bas `border-rule`. Rien d'autre.
- Bouton « Déclic du jour » (desktop) : anneau `tone="vermilion" track="onDark"`.
- Barre mobile : bouton central `bg-ink` + anneau `tone="vermilion" track="onDark"` ; libellés `text-[0.6875rem]` inchangés.
- Pied de page : ajouter une colonne **Rubriques** (liste des 14 rubriques en `link-ed`, sans compteurs) : `md:grid-cols-[1.4fr_1fr_1fr_1fr]`. Le slogan peut y figurer en italique sous le logo.

---

## 8. Pages

### 8.1 Accueil (`pages/HomePage.tsx`)

**Mobile**
```
┌──────────────────────────────┐
│ ◯ déclic           ☾   👤  ☰  │ en-tête 60 px
├──────────────────────────────┤
│ Dimanche 8 novembre · n° 312 │ t-label + t-meta « actualisé il y a 2 h »
│ Aujourd'hui, le monde a encore│ h1 : serif italique 1.0625rem, ink-2 (slogan rétrogradé)
│ des choses à t'apprendre.     │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ filet 2 px ink (mt-3)
│ LEAD STORY (§7.2, A/B/C)      │
├──────────────────────────────┤ mt-6
│ DeclicStrip (§7.5)            │
├──────────────────────────────┤ mt-6
│ StoryRow + vignette  × 4      │ border-t border-ink
│ Toute l'actualité  →          │ t-label, h-11
└──────────────────────────────┘
  Quiz de l'actu ............ bloc pétrole (inchangé dans l'esprit, §8.1-b)
  Un sujet, plusieurs regards  SectionHeading + Topics
  Prendre du recul ........... bande paper-2 pleine largeur (seule bande grise)
  Sciences & espace .......... SectionHeading, hero NASA + légende dessous, 4 lignes ; la mini-expérience reste
  Une découverte inattendue .. SectionHeading, carte bordée (plus d'aplat jaune)
  Ce jour-là ................. inchangé (filets)
  Selon tes centres d'intérêt  sans doublons
  pied de page (+ rubriques)
```

**Desktop (1440)**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Dimanche 8 novembre 2026 · Édition n° 312      Actualisé il y a 2 h · 41 art.  │
│ Aujourd'hui, le monde a encore des choses à t'apprendre. (italique, ink-2)     │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ LEAD (col 1–8)                                  │ COLONNE (col 9–12)          │
│ [photo 16:9 si large]                           │ ┌ DeclicCard resserrée ───┐ │
│ ■ Monde  franceinfo · 4 h                    ♡  │ │ ◔ Ton Déclic du jour    │ │
│ TITRE DE UNE t-display (64 px)                  │ │ 5 étapes  [Commencer]   │ │
│ sur deux ou trois lignes                        │ └─────────────────────────┘ │
│ chapô (5 col)                 │ médaillon 200px │ ■ Sport · 2 h          ♡    │
│                               │ 4:5             │ Titre secondaire   [vign.]  │
│ Illustration : … · auteur, licence · Commons    │ ─────────────────────────── │
│ Lire sur franceinfo ↗   [2 médias en parlent]   │ … × 4                        │
│ Ailleurs, le même sujet (3)                     │ Toute l'actualité →          │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Colonne : `lg:col-span-8 lg:border-r lg:border-rule lg:pr-10` | `lg:col-span-4`.
- Le titre de une doit être **entièrement visible** dans 1440×900 en variante B/C ; en variante A, la photo 16:9 de la colonne fait ~470 px : c'est accepté (la photo est l'info), mais le haut du titre doit apparaître dans l'écran.

Changements précis :
1. Supprimer la `section` « Couverture » actuelle (`t-display` du slogan + `aside` DeclicCard). Le slogan reste le `h1` (le test e2e `heading level 1 /le monde a encore des choses à t'apprendre/` doit rester vert) mais en `font-serif italic text-[1.0625rem] leading-snug text-ink-2 font-normal` (sur desktop `lg:text-[1.125rem]`) juste sous la ligne de date.
2. Ligne de date : `flex flex-wrap items-baseline justify-between gap-x-6`, puis filet `border-b-2 border-ink pb-3`.
3. Supprimer le gros bouton vermillon « Comprendre en 5 minutes » et le lien « Je n'ai que 2 minutes » sous la une (repris dans `DeclicStrip`).
4. `DeclicStrip` après la une sur mobile/tablette (`lg:hidden`) ; `DeclicCard` resserrée en tête de colonne droite (`hidden lg:block`). Supprimer la `section` `wrap mt-10 lg:hidden` actuelle.
5. **Index des rubriques** : retirer la section du corps de page (déplacé au pied de page, sans compteurs).
6. **Découverte inattendue** (`pages/home/DiscoveryOfTheDay.tsx`) : plus de bande `bg-sun` ; `SectionHeading` + description + bouton « La machine à curiosités » (`variant="outline"`), carte `DiscoveryCard` avec `border-l-4 border-sun` à gauche et fond `paper`. En sombre, idem (fini l'éblouissement).
7. **Sciences & espace** : `ArticlePhoto variant="hero"` + légende sous l'image ; l'en-tête via `SectionHeading` avec action « Toute la rubrique ».
8. **Selon tes centres d'intérêt** : exclure les ids déjà affichés ; si moins de 2 articles restent, masquer la colonne d'articles et ne garder que « Pour comprendre ». Les liens « Pour comprendre » passent en liste à filets (`divide-y divide-rule border-t border-ink`), plus de pavés gris arrondis.
9. Tous les titres de sections → `SectionHeading` (`t-h2`, filet 2 px). « Un sujet, plusieurs regards » et « Sciences & espace » ne sont plus en `t-h1`.

**8.1-b Quiz de l'actu (`pages/home/QuizTeaser.tsx`)** : conserver le bloc pétrole (c'est l'unique grand aplat de l'accueil, et c'est interactif). Ajustements : `rounded-[20px] lg:rounded-[28px]`, `p-5 sm:p-8 lg:p-10` ; question en `t-h2` ; bouton « Faire les N questions » en `onPetrol` ; trou du texte à trous inchangé (vermillon). Pas de photo avant réponse ; vignette dans la correction (§7.9).

### 8.2 Actualités (`pages/NewsPage.tsx`)

**Mobile : filtres compacts** (objectif : premier titre visible à ≤ 360 px du haut de la page)
```
Actualités (t-h1)                          ← la phrase d'intro passe en t-meta, 1 ligne
[🔍 Rechercher un sujet, un lieu, un média ]   h-11 rounded-full border-line-ui
[Toutes][Monde][France][Société][Écono… →    une seule ligne qui défile (no-scrollbar, overflow-x-auto, -mx-4 px-4)
[⚙ Filtres · 2]  Israël 4  Eisenkot 3  …  →  bouton qui ouvre un panneau ; sujets du moment à la suite, même ligne défilante
```
- Le panneau « Filtres » (période 24 h / 3 jours / 7 jours, « En français seulement », Type) s'ouvre sous le bouton (`aria-expanded`, `aria-controls`), en accordéon (pas de modale). Le compteur indique le nombre de filtres actifs différents des valeurs par défaut.
- Desktop : barre actuelle conservée (elle tient sur 3 lignes), mais rubriques sur **une** ligne avec défilement si besoin.

**Liste**
```
Desktop                                                   Mobile
┌ LeadStory (col 1–8) ───────────┬ Pour comprendre (9–12) ┐  LeadStory
│                                 │ liste à filets          │  Pour comprendre (filets)
└─────────────────────────────────┴─────────────────────────┘  Vu par plusieurs médias
Vu par plusieurs médias  (SectionHeading, 2 colonnes)         Où se passe l'actualité ?
Où se passe l'actualité ? (carte + puces)                      Les plus récents : StoryRow summary
Les plus récents (SectionHeading)                                 + vignettes, 1 colonne
┌ StoryRow summary + vignette ┐┌ StoryRow summary + vignette ┐
│ …                            ││ …                            │  ← 2 colonnes, chaque colonne
└──────────────────────────────┘└──────────────────────────────┘     est une liste à filets
```
- « Les plus récents » : `grid gap-x-10 lg:grid-cols-2` ; chaque colonne `divide-y divide-rule border-t border-ink` ; distribution en alternance (pair/impair) pour garder l'ordre chronologique en lecture en Z. Plus de `StoryCard`.
- « Pour comprendre » : `aside` sans pavé arrondi : `border-t-2 border-ink pt-3`, titres en `t-h4`, type (« Fiche », « Découverte ») en `t-meta`.
- Skeletons (`news.loading`) : refaire en lignes (meta 3 px × 120, titre 2 lignes, vignette 80 px) pour ressembler au rendu final.

### 8.3 Déclic du jour (`pages/DeclicPage.tsx`)
- Écran 1 « Le monde en trois informations » : **plus de cartes arrondies ni de gros chiffres vermillon** (tic décoratif). Liste éditoriale :
```
1 sur 3                                    ← t-label text-ink-3
[photo hero 3:2 si large / médaillon 112 px si portrait]
■ Monde  franceinfo · 4 h
Titre (t-h2)
Chapô (t-body text-ink-2)
Illustration : … (légende)
──────────────────────────── filet border-rule, py-6 entre les infos
```
  `pickPhotos` sur les 3 articles. La photo aide à mémoriser (double codage) : c'est cohérent avec l'écran 4, **à condition qu'elle ne réapparaisse pas dans la question de l'écran 4** (§6.7).
- Écran 2 : remplacer `rounded-[22px] bg-sun/35` par `border-l-4 border-sun pl-5` (même traitement que l'accueil).
- En-tête du parcours : anneau 34 px inchangé ; la barre de 5 segments reste vermillon.
- Barre du bas « Plus tard / Continuer » : inchangée.

### 8.4 Jouer et quiz (`pages/PlayPage.tsx`, `games/QuizGame.tsx`)
- Carte principale : **« Le quiz de l'actu »** quand `actuQuiz()` renvoie ≥ 5 questions (texte : « 10 vrais titres des dernières 48 heures, avec un mot qui manque. »), sinon « Le quiz du jour ». Fond pétrole conservé (c'est le quiz).
- Supprimer le SVG décoratif de rectangles (`absolute -right-6 -bottom-6`) : il chevauche le texte sur mobile (capture 09).
- Les 4 autres cartes : **même structure**, `rounded-[20px] lg:rounded-[28px] border border-rule bg-paper p-6 hover:border-ink`, pictogramme 56 px dans sa couleur (`sun` pour Vrai ou faux, `vermilion` pour Chronologie, `ink` pour 60 secondes, `petrol-ink` pour Le grand voyage), titre `t-h2`, description `text-ink-2`, ligne `t-meta` « Pas encore joué / Record : … », icône flèche à droite. Plus d'aplats jaune / noir / gris.
- Quiz : bordure gauche noire de la question → `border-l-4 border-vermilion` (relie au trou vermillon). Le reste inchangé.

### 8.5 Découvrir (`pages/DiscoverPage.tsx`)
- « Surprends-moi » déborde : disque `h-44 w-44 sm:h-52 sm:w-52`, libellé `font-serif text-[1.25rem] sm:text-[1.4rem] leading-tight px-5 text-center`, `text-ink-fixed`. Vérifier à 320 px de large.

### 8.6 Apprendre (`pages/LearnPage.tsx`)
- Parcours : la grille de 5 cartes identiques laisse un trou (2+3). Passer en **liste à filets** sur desktop : `grid lg:grid-cols-[16rem_1fr]` (titre du parcours | 3 étapes en ligne `lg:grid-cols-3`) — P3.
- Bandeau « La frise du temps » (noir) : conservé, c'est le seul aplat noir du site ; `rounded-[20px] lg:rounded-[28px]`.

### 8.7 Mon espace (`pages/MePage.tsx`)
- Tableau « Mes jeux » : en-têtes collés → `th` et `td` numériques `pl-4 sm:pl-6 text-right tabular-nums`, première colonne `w-full`.
- Calendrier « Mes 14 derniers jours » : garder le bloc pétrole (c'est le parcours Déclic) ; anneaux `tone="white" track="onDark"`.

---

## 9. Tâches pour dev-design (dans l'ordre)

Chaque tâche : faire, puis capturer (mobile 390 + desktop 1440, clair + sombre) la ou les pages touchées.

### P1 — à livrer d'abord
| # | Tâche | Fichiers | Terminé quand |
|---|---|---|---|
| P1-1 | **Jetons** : nouvelle palette claire/sombre, `--line-ui`, `--ink-fixed`, `--photo-edge`, theme-color, manifest ; remplacer `text-[#171b1d]` | `src/styles/index.css`, `index.html`, `vite.config.ts`, `Button.tsx` (+ variante `onPetrol`) | fond blanc partout ; axe vert ; aucun `#171b1d` restant (`grep`) |
| P1-2 | **Typographie** : utilitaires §4 (dont `t-h4`, `t-caption`), remplacement des tailles ad hoc listées | `index.css`, `Perspectives.tsx`, `ActuCorrection.tsx`, `QuizTeaser.tsx`, `PlayPage.tsx`, `AppShell.tsx` | pas de nouvelle taille en `text-[…rem]` pour un titre |
| P1-3 | **Système photo** : `photo.ts` (`photoShape`, `pickPhotos`), `ArticlePhoto` (hero/medallion/thumb), `PhotoCredit` (caption/button + popover), `onFail` | `components/news/ArticlePhoto.tsx`, `components/news/photo.ts`, `Story.tsx` | test Vitest de `pickPhotos` (url et sujet dupliqués écartés) et de `photoShape` ; popover au clavier (Tab, Entrée, Échap) |
| P1-4 | **`LeadStory`** variantes A/B/C (§7.2), carte de situation seulement sans photo | `Story.tsx` | captures avec photo large, portrait, sans photo, photo en erreur (URL cassée → variante C sans trou) |
| P1-5 | **`Meta` + `StoryRow`** (cœur en absolu, vignette, option `summary`) ; **supprimer `StoryCard`** | `Story.tsx`, `NewsPage.tsx` | aucune ligne où le cœur passe à la ligne à 390 px |
| P1-6 | **Accueil** §8.1 points 1 à 9 (slogan rétrogradé, une en grand, `DeclicStrip`/`DeclicCard` resserrée, dédoublonnage photos **et** articles, rubriques au pied, découverte sans aplat, `SectionHeading` partout) | `HomePage.tsx`, `home/*.tsx`, `bits.tsx`, `AppShell.tsx` | critère « l'actualité d'abord » (§2.1) mesuré sur capture ; e2e verts |
| P1-7 | **Actus** §8.2 : liste « Les plus récents » en 2 colonnes de `StoryRow`, filtres mobiles compacts, `Pour comprendre` à filets | `NewsPage.tsx` | 1er titre ≤ 360 px du haut à 390×844 ; e2e verts |
| P1-8 | **Anneau lisible partout** : `tone="white"`, `track="onDark"` et usages | `DeclicRing.tsx`, `AppShell.tsx`, `HomePage.tsx`, `MePage.tsx` | anneau visible en sombre sur pétrole et sur encre (capture) |
| P1-9 | **Finitions visibles** : « Surprends-moi » (§8.5), SVG décoratif + intitulé de la carte quiz (§8.4), en-têtes du tableau (§8.7) | `DiscoverPage.tsx`, `PlayPage.tsx`, `MePage.tsx` | captures 320 et 390 px propres |

### P2
| # | Tâche | Fichiers |
|---|---|---|
| P2-1 | Déclic écran 1 éditorial + photos ; écran 2 sans aplat (§8.3) | `DeclicPage.tsx` |
| P2-2 | Photo dans la correction du quiz (accueil + page quiz), jamais avant la réponse (§7.9) | `ActuCorrection.tsx`, `lib/daily.ts` (passer `articleId`/`image`) |
| P2-3 | « Un sujet, plusieurs regards » : vignette/médaillon par sujet, encadré « Pour prendre du recul » à angles vifs (§7.8) | `Viewpoints.tsx`, `Perspectives.tsx` |
| P2-4 | Sciences & espace avec `ArticlePhoto` + légende sous l'image (§8.1.7) | `ScienceDesk.tsx` |
| P2-5 | Cartes de jeux unifiées (§8.4) | `PlayPage.tsx` |
| P2-6 | `Choices` : bordures `line-ui` (§7.7) | `Choices.tsx` |
| P2-7 | Pied de page avec colonne Rubriques (§7.10) | `AppShell.tsx` |

### P3
- Parcours d'Apprendre en liste (§8.6) ; skeletons d'Actus refaits (§8.2) ; séparateurs « Aujourd'hui / Hier » dans « Les plus récents ».

### Tests à adapter (ne pas les affaiblir)
- `e2e/site.spec.ts` l. 13 : le `h1` du slogan reste — rien à changer si §8.1.1 est respecté.
- Tests Vitest qui rendent `StoryCard` ou `Photo` (chercher `StoryCard`, `Photo :`) : les adapter au nouveau composant.
- Ajouter un test e2e : bouton crédit d'une vignette → popover visible → `Escape` le ferme (avec une donnée de test contenant une image).

---

## 10. Vérification visuelle (pour dev-design)

- `npm run build && (npx vite preview --port 4180 &)` puis `python3 tools/screenshot.py http://localhost:4180/#/ out.png 390 844 1 light` (et `1440 900`, et `dark`). Arrêter : `pkill -f "vite preview --port 4180"`.
- Mode sombre : le thème est clair par défaut ; pour capturer en sombre, poser `document.documentElement.dataset.theme = 'dark'` après chargement (ou `localStorage['declic:v1']` avec `prefs.theme = 'dark'`).
- Pour juger les photos sans réseau : intercepter `**/data/news.json` avec une copie enrichie d'`image` et `**/data/img/**` avec des fichiers locaux (Playwright `page.route`), ou copier temporairement dans `dist/` — **jamais** dans `public/` ni `src/`. Tester les trois formes (portrait 960×1125, lieu 960×640, NASA 16:9) et une URL cassée.
- Regarder chaque capture : premier écran, répétitions de photos, cœurs à la ligne, légendes, contrastes en sombre.

---

## 11. Demandes à l'orchestrateur (pipeline / données)

1. **`image.subjectKind: 'person' | 'place'`** dans `news.json` (le pipeline le sait déjà via Wikidata Q5 / coordonnées). Il prime sur le ratio dans `photoShape` : un lieu photographié en hauteur (tour, cathédrale) ne doit pas devenir un médaillon de portrait.
2. **Image dans `quiz.json`** : ajouter `article.image` (même forme) aux questions, pour la correction (§7.9) sans attendre `news.json`. À défaut, exposer `articleId` dans `QuizItem.actu` côté site.
3. Ne pas attribuer de photo aux articles `kind: 'opinion'` (§6.7) — ou le site les ignorera.
4. Taille servie ~960 px : suffisante pour `hero` jusqu'à 830 px de colonne en 1×. Si possible, une 2e taille 480 px pour les vignettes (`srcset`) — non bloquant.

---

## 12. Décisions qui méritent l'avis de Quentin

1. **Fin du fond crème → papier blanc.** C'est le changement le plus visible. Il rapproche DÉCLIC des grands médias numériques et met les photos en valeur ; l'ivoire actuel fait « gabarit ». Alternative si Quentin tient au crème : garder `#f7f5ef` uniquement pour les bandes (`paper-2`).
2. **Le slogan quitte la une** : il reste le titre de la page (`h1`, lecteurs d'écran, test e2e) mais en petit italique sous la date, et peut figurer au pied de page. Si Quentin y tient en grand, on peut le garder en grand **uniquement** sur l'écran de premier lancement (sans données).
3. **Portrait = médaillon, jamais pleine largeur.** Choix éthique et éditorial : une photo d'archive d'une personnalité, affichée en grand au-dessus d'un titre d'actualité, ressemble à une photo de l'événement. Conséquence : peu de « grandes photos » sur l'accueil hors NASA et lieux.
4. **Crédit des vignettes derrière un bouton ⓘ** (un geste) plutôt qu'une légende visible sous chaque petite image : conforme à l'esprit des licences CC (« raisonnable selon le support ») et lisible sur mobile. Si Quentin préfère une légende toujours visible, prévoir une ligne `t-caption` sous chaque vignette (plus chargé).
5. **Photos dans le Déclic écran 1** : utiles pour retenir (double codage), à condition qu'elles ne réapparaissent pas comme indice à l'écran 4. À valider par Quentin (expertise sciences cognitives).
6. **Cartes de jeux unifiées** (fin du jaune, du noir et du gris pleins) : moins « ludique » en apparence, plus pro. Réversible.

---

## 13. Écarts d'implémentation (dev-design, 2026-11-11)

État livré : **P1-1 à P1-9 faits**, plus quelques P2 voisins faits en passant (P2-3 partiel, P2-4, P2-5, P2-6, P2-7). Captures finales : `design/after/` (images de test synthétiques, comme l'audit).

**Écarts**
1. **theme-color** : une seule balise `#FFFFFF` (pas de 2e balise `media="(prefers-color-scheme: dark)"`) : le site est clair par défaut même quand le téléphone est en sombre ; une barre d'adresse noire au-dessus d'une page blanche serait fausse.
2. **Anneau sur encre** (bouton « Déclic du jour » de l'en-tête, bouton central de la barre mobile) : `tone="vermilion"` mais piste `track="paper"` (et non `onDark`). En sombre, `bg-ink` devient clair : une piste blanche translucide y serait invisible ; la piste `paper` s'inverse avec le thème et reste lisible dans les deux. `tone="white" track="onDark"` est bien utilisé sur pétrole (DeclicStrip, DeclicCard, calendrier de Mon espace).
3. **Cœur (favori)** : hors du flux, centré verticalement sur la ligne de métadonnées (`MetaRow`, `pr-10` sur la ligne), plutôt que `top-3 right-0` + `pr-11` sur le titre : le titre garde toute sa largeur et le cœur ne chevauche jamais la vignette.
4. **Pastille de rubrique** : `min-h-6` (24 px) ajouté à `CategoryTag` pour la règle axe `target-size` (WCAG 2.2) maintenant que la ligne de métadonnées est sur une seule ligne.
5. **« Un sujet, plusieurs regards »**, 1er sujet avec un portrait : vignette carrée 112 px avec bouton ⓘ, pas un médaillon 4:5 avec légende visible (pas la place pour la légende à côté de la ligne de diversité). Lieu → grande photo 16:9 comme prévu.
6. **Actus mobile** : la phrase d'introduction est raccourcie (« Les titres tels que publiés, avec la source et l'heure. ») et le fil d'Ariane est masqué sur mobile pour « Actualités » (gardé pour une rubrique), afin de tenir l'objectif « 1er titre ≤ 360 px » (mesuré : 351 px). Le panneau « Filtres » est le même bloc que la barre desktop (un seul jeu de contrôles dans le DOM).
7. **« Les plus récents »** : une seule grille `lg:grid-cols-2` dont les cellules suivent l'ordre chronologique (lecture en Z, une colonne dans l'ordre sur mobile) au lieu de deux colonnes pair/impair séparées (qui auraient cassé l'ordre sur mobile).
8. **Médaillon (variante B)** : la légende est sous le bloc chapô + médaillon, pleine largeur, comme prévu ; le composant `ArticlePhoto` ne rend la légende que pour `hero` (le parent la place pour `medallion`).
9. **Mesures « l'actualité d'abord »** (horloge 2026-11-08, données de démonstration) : mobile variante B, bas du titre de une à 523 px (≤ 640) ; variante A, 1re ligne à 530 px (≤ 700) ; desktop variante B, titre entier visible (bas à 618 px sur 900).

**Reste à faire (P2 / P3)**
- **P2-1** Déclic écran 1 éditorial avec photos, écran 2 sans aplat : **non fait** (cartes arrondies + gros chiffres encore présents).
- **P2-2** Photo dans la correction du quiz (`ActuCorrection`, `article.image` déjà dans `quiz.json`) : **non fait**.
- **P2-3** fait pour la vignette par sujet et l'encadré « Pour prendre du recul » (angles vifs, filet pétrole) ; le médaillon du 1er sujet suit l'écart 5.
- P2-4 (Sciences : `ArticlePhoto` + légende sous l'image), P2-5 (cartes de jeux unifiées, carte « Le quiz de l'actu », SVG décoratif supprimé), P2-6 (`Choices` en `line-ui`), P2-7 (pied de page + Rubriques) : **faits**.
- **P3** : skeletons d'Actus refaits en lignes **faits** ; parcours d'Apprendre en liste et séparateurs « Aujourd'hui / Hier » **non faits**.
- Non vérifié en capture : variante « photo en erreur » de l'article principal (le code repasse en variante C via `onFail`, testé seulement pour les vignettes : rien ne reste à l'écran).
