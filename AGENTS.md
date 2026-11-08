# AGENTS.md — contexte pour les IA et les développeurs

> Lis ce fichier en entier avant de modifier le dépôt. Il dit **ce qu'est DÉCLIC, ce qu'il ne faut jamais casser, où se trouve chaque chose, comment vérifier son travail et ce qui a déjà été fait**. Le `README.md` est destiné aux humains (installation, déploiement) ; ce fichier-ci est le guide de travail.
> Tiens la section [Journal des modifications](#journal-des-modifications) à jour à chaque changement notable.

---

## 1. En une minute

DÉCLIC est un **média numérique francophone gratuit** : actualité réelle (flux RSS), découvertes, mini-fiches, cinq jeux de culture générale et un parcours quotidien de 5 minutes, le **« Déclic du jour »** (signature du produit).

- **Site 100 % statique** : React 19 + TypeScript strict + Vite + Tailwind 4, hébergé sur **GitHub Pages**.
- **Aucun serveur, aucune API payante, aucun compte** : la progression des visiteurs vit dans leur `localStorage`.
- **L'actualité est collectée par un script Python** (`pipeline/`) **dans GitHub Actions toutes les 6 h, avant le build** : le navigateur ne contacte jamais les médias.
- Public : grand public francophone, **smartphone d'abord**. Ton : tutoiement, phrases simples, chaleureux sans être infantile.
- Propriétaire : Quentin (compte GitHub `burtouille-art`), docteur en sciences cognitives : la rigueur des sources et la pédagogie active (question **avant** explication, effet de test, révision espacée) sont au cœur du projet.

---

## 2. Règles d'or (non négociables)

Ces règles priment sur toute demande d'« amélioration ». En cas de conflit, demande au propriétaire.

1. **Aucune actualité inventée, aucun résumé généré.** On affiche le titre et le chapô *tels que fournis par le flux du média*, nettoyés (`pipeline/declic/normalize.py`). Si le chapô manque ou répète le titre → rien. Pas de réécriture, pas de traduction automatique, pas d'IA générative dans la chaîne d'actualité.
2. **Chaque article affiche la source, la date et un lien vers l'original** (`target="_blank" rel="noopener noreferrer"`).
3. **Aucune image sans droit de réutilisation identifié.** Seules les sources marquées `images.allowed: true` dans `pipeline/sources.json` (NASA, NASA/JPL) peuvent fournir une photo, et uniquement depuis les hôtes listés. Pas de photo de presse, pas d'image Wikimedia non vérifiée. À la place : typographie, couleur, pictogrammes maison (`ThemeGlyph`), cartes (`LocatorMap`).
4. **Ne pas contourner les paywalls.**
5. **Aucune étiquette politique attribuée à un média**, ni par algorithme ni à la main. La vue « plusieurs médias » ne montre que les titres originaux.
6. **Tout contenu pédagogique est sourcé** (question, affirmation, événement, découverte, fiche) avec une URL `https://` réelle. Ne pas ajouter de fait non vérifié. Les questions d'actualité ne sont générées **que** depuis des données structurées (année de l'éphéméride Wikipédia, nom du média d'un titre).
7. **Ne pas ajouter de flux RSS non testé** (réponse 200, XML valide, articles récents). Noter la date de vérification.
8. **Gratuit pour tous** : pas de dépendance payante, pas de backend, pas de limite quotidienne artificielle.
9. **Accessibilité WCAG 2.2 AA** : tout se fait au clavier et au doigt, contrastes AA, `prefers-reduced-motion` respecté, états annoncés (`aria-live`). Les tests axe doivent rester verts.
10. **Pas de secret dans le dépôt ni dans le navigateur** (il n'y en a aucun aujourd'hui ; garde-le ainsi).

---

## 3. Carte du dépôt : « je veux modifier X, je vais où ? »

| Je veux… | Fichier(s) |
|---|---|
| Ajouter / retirer un flux RSS | `pipeline/sources.json` (+ tester le flux, + README §Sources) |
| Changer le nettoyage, la fraîcheur, la déduplication | `pipeline/declic/normalize.py`, `sanitize.py`, `build.py` (`MAX_AGE_DAYS`, `MIN_ARTICLES`…) |
| Changer le classement par rubrique | `pipeline/declic/classify.py` (rubrique du flux > chemin d'URL > mots-clés) |
| Régler le rapprochement inter-médias | `pipeline/declic/cluster.py` (seuils volontairement stricts) |
| Ajouter des questions / vrai-faux / événements / pays | `src/content/questions.ts`, `statements.ts`, `events.ts`, `countries.ts` |
| Ajouter une découverte, une fiche, un parcours | `src/content/discoveries.ts`, `fiches.ts` (`PATHS` en bas) |
| Ajouter une « question qui fait réfléchir » (Déclic écran 3) | `src/content/reflections.ts` |
| Ajouter un jeu de données pour un graphique | `src/content/datasets.ts` + `components/viz/Interaction.tsx` |
| Rubriques (libellés, couleurs) | `src/content/categories.ts` + `CATEGORY_IDS` dans `src/lib/store.ts` + `pipeline/declic/classify.py` |
| Couleurs, polices, échelle typographique | `src/styles/index.css` (jetons `:root`, mode sombre, utilitaires `t-*`) |
| Logique de sélection du jour (quiz, découverte…) | `src/lib/daily.ts`, `src/lib/random.ts` |
| Mise en avant des titres (« à la une ») | `importance()` et `topStories()` dans `src/lib/news.ts` |
| Données sauvegardées du visiteur | `src/lib/store.ts` (schéma zod versionné, clé `declic:v1`) |
| Badges | `src/lib/badges.ts` |
| Révision espacée | `src/lib/srs.ts` |
| Pages / routes | `src/App.tsx` (HashRouter) + `src/pages/*` |
| Jeux | `src/games/*` (logique pure dans `src/lib/gameLogic.ts`) |
| PWA, cache hors ligne, CSP | `vite.config.ts` |
| Collecte + déploiement automatique | `.github/workflows/deploy.yml` ; vérifications PR : `ci.yml` |

### Flux de données

```
GitHub Actions (cron 17 */6 * * *, push main, manuel)
  └─ télécharge les JSON déjà en ligne → previous/   (filet de sécurité)
  └─ python pipeline/run.py --out public/data --previous previous
        → public/data/news.json       articles + clusters + médias
        → public/data/status.json     diagnostic par source (page /#/diagnostic)
        → public/data/onthisday.json  éphéméride Wikipédia (aujourd'hui + demain)
  └─ npm test && npm run build → dist/ → GitHub Pages
Navigateur : fetch('./data/news.json') → validation zod (src/lib/news.ts) → UI
```

**Contrat de données** : la forme d'un article est définie **deux fois** et doit rester synchronisée :
`validate_article()` + `normalize_entry()` (Python) ⇄ `articleSchema` (zod, `src/lib/news.ts`).
Champs : `id, title, url, sourceId, sourceName, sourceHome, lang ('fr'|'en'), kind ('news'|'analysis'|'institution'), publishedAt (ISO UTC), summary|null, categories[] (la 1re = principale), image {url, credit, license}|null, clusterId|null`.
Un article invalide est **écarté** côté site (jamais affiché à moitié).

---

## 4. Commandes et définition de « terminé »

```bash
npm install && pip install -r pipeline/requirements.txt
npm run dev                 # http://localhost:5173
npm run news                # collecte réelle (Internet requis)
python3 pipeline/run.py --out public/data --seed pipeline/seed/snapshot.json --now 2026-11-08T19:00:00+00:00   # hors ligne
```

Un changement est **terminé** quand tout ceci passe :

```bash
npm run typecheck                    # 0 erreur (TS strict, noUncheckedIndexedAccess)
npm test                             # Vitest : contenus, logique, composants (30 tests)
python3 -m pytest pipeline/tests -q  # pipeline (23 tests)
npm run build
npm run test:e2e                     # Playwright mobile + desktop, hors ligne, axe (32 tests)
```

Pour l'e2e : `npx playwright install chromium` une fois. Les tests e2e tournent contre `vite preview` (le build doit exister).
Pour un changement visuel : faire des captures (mobile 390 px **et** desktop 1440 px, clair **et** sombre) et les regarder.

---

## 5. Conventions de design

- **Signature : l'anneau Déclic** (`components/ui/DeclicRing.tsx`), 5 segments = 5 écrans du parcours. Logo, bouton central de la nav mobile, progression, calendrier, jauges. Ne pas le remplacer par une barre générique.
- **Règle de forme** : *éditorial = angles vifs et filets* (on lit) ; *interactif = arrondi* (`rounded-full` pour les boutons, `rounded-[18–28px]` pour les surfaces de jeu) (on touche).
- **Typo** : Newsreader (serif, axe `opsz` exploité) pour l'éditorial, DM Sans pour l'interface. Utilitaires : `t-display` (titre de une), `t-lead` (article principal), `t-h1`, `t-h2`, `t-h3`, `t-lede`, `t-body`, `t-meta`, `t-label`. Ne pas inventer de tailles ad hoc sans raison.
- **Couleurs** : uniquement via les jetons (`bg-paper`, `text-ink-2`, `bg-petrol`, `text-vermilion-ink`…). Le vermillon `#EF6448` ne passe pas le contraste en texte sur ivoire : pour du texte, utiliser `text-vermilion-ink`. Sur fond pétrole, texte `text-on-petrol` à 90 % minimum.
- **Rythme** : chaque section a sa composition propre ; éviter les grilles de cartes identiques.
- **Mouvement** : rare, fonctionnel, toujours compatible `reduced-motion` (Motion est chargé seulement dans les pages qui l'utilisent).
- **Textes** : français, tutoiement, casse de phrase, pas de libellés en MAJUSCULES, pas de « → » ajouté au texte des liens (icône Lucide à la place).
- **Composants à réutiliser** : `Button/ButtonLink`, `Choices` (QCM accessible + raccourcis 1-4), `FlipCard`, `DiscoveryCard`, `GameFrame/GameResult/Feedback`, `ProgressBar`, `SourceLine`, `ErrorState`, `EmptyState`, `Skeleton`, `CategoryTag`, `FavoriteButton`, `WorldMap`, `LocatorMap`, `LineChart`, `ThemeGlyph`.

---

## 6. Pièges connus (déjà rencontrés, déjà corrigés)

- **`useAppState(selector)`** repose sur `useSyncExternalStore` : le sélecteur doit renvoyer une **référence stable** (un champ du state), jamais un nouveau tableau/objet (`s => s.favorites.filter(...)` = boucle infinie). Dériver avec `useMemo`.
- **Mélange des options** : la graine doit être stable (`useState(() => …)`), sinon les réponses changent de place à chaque rendu.
- **Quiz du jour** : attendre `onthisday.json` avant de figer les 10 questions, sinon la partie se réinitialise quand l'éphéméride arrive.
- **Raccourcis clavier de `Choices`** : enregistrés en `useLayoutEffect` (sinon une touche pressée très tôt est perdue).
- **Carte** : cadrer une région avec `fitBox` (boîte en degrés), jamais avec l'emprise des pays (la Russie traverse l'antiméridien → la carte dézoome sur le monde entier). Centre d'un pays = centre de son **plus grand polygone** (sinon la France tombe en Guyane). Les repères trop proches sont écartés (`spread()`), sinon un repère en masque un autre.
- **Classification** : « mars » est aussi un mois (on exige « planète Mars », « sur Mars »…) ; « IA » n'est reconnu qu'en majuscules.
- **CSP** : injectée seulement au build (`cspPlugin` dans `vite.config.ts`) car le serveur de dev de Vite utilise des scripts inline. Aucun script inline dans `index.html` (le thème est appliqué par `public/theme-init.js`).
- **Base relative + HashRouter** : ne pas passer à `BrowserRouter` (404 au rechargement sur GitHub Pages) ni à une `base` absolue (casse les sous-chemins).
- **Sources Wikipédia** : vérifier qu'un titre d'article existe via l'API (`https://fr.wikipedia.org/w/api.php?action=query&format=json&titles=A|B`) ; 5 titres inventés de bonne foi avaient dû être remplacés.
- **Sandbox sans réseau** : certains environnements d'IA bloquent les requêtes vers les médias. Utiliser l'instantané `pipeline/seed/snapshot.json` (`--seed`) ; ne jamais fabriquer de faux titres pour « remplir ».
- **GitHub Actions planifiées** : désactivées par GitHub après 60 jours sans commit sur un dépôt public. Réactiver dans l'onglet Actions.

---

## 7. Journal des modifications

Format : date — auteur — résumé. Ajoute tes entrées **en haut**.

### 2026-11-08 — Claude (Opus) — première collecte réelle (GitHub Actions)
- Résultat : **382 articles, 7 rapprochements, 27 sources sur 28 en ligne**. JPL répond HTTP 403 au robot → User-Agent passé au format standard `Mozilla/5.0 (compatible; DeclicBot/1.0; …)` (le robot reste identifié). franceinfo Environnement, Inserm et OMS : flux valides mais aucun article de moins de 7 jours ce jour-là (normal).
- Workflow : `configure-pages` en `continue-on-error` pour que la collecte et le build soient vérifiés même avant l'activation de Pages ; le job `deploy` échoue tant que Pages n'est pas activé (Settings → Pages → Source : GitHub Actions). **Pages exige un dépôt public sur un compte gratuit.**

### 2026-11-08 — Claude (Opus) — v1.1 : passe visuelle + dépôt GitHub
- Dépôt publié : `github.com/burtouille-art/declic`.
- **Accueil** : bandeau d'édition (« Dimanche 8 novembre 2026 · Édition n° 312 », n° = jour de l'année) ; nouvelle échelle `t-lead` pour l'article principal (le titre de une reste dominant) ; titre de une légèrement réduit ; carte Déclic repensée (anneau + les 5 étapes nommées avec leur segment, bouton plein) ; boutons d'action empilés proprement sur mobile.
- **Carte de situation** (`components/viz/LocatorMap.tsx`) sous l'article principal quand un pays est explicitement cité dans le titre ou le chapô : remplace la photo de presse (droits non acquis) par une information utile. Chargée à la demande.
- **Apprendre** : mise en page asymétrique par thème (pictogramme + titre à gauche, liste à droite) avec pictogrammes maison `ThemeGlyph` (aussi en tête des fiches).
- Ajout de ce fichier `AGENTS.md` (+ `CLAUDE.md` qui l'importe).
- Tests : typecheck OK, Vitest 30/30, pytest 23/23, Playwright 32/32.

### 2026-11-08 — Claude (Opus) — v1.0 : construction initiale
- Pipeline Python complet (collecte, nettoyage, dédup, classification, rapprochements, fraîcheur, secours par source, conservation des dernières données valides, diagnostic, éphéméride). 28 flux vérifiés le 2026-11-08 ; écartés : ESA Space Science (404), franceinfo Santé (vide), France 24 Europe, MIT Tech Review IA, Futura (non vérifiables).
- Site : accueil, actualités (14 rubriques, recherche, filtres, sujets, carte des pays cités, comparaison multi-médias), Déclic du jour (5 écrans), Découvrir (« Surprends-moi »), 5 jeux + révisions, Apprendre (14 fiches, 5 parcours, frise), Mon espace (progression, badges, préférences, favoris, historique), mode 2 minutes, diagnostic, 404.
- Contenus : 70 questions, 36 vrai/faux, 38 événements, 87 pays, 18 découvertes, 14 fiches, 8 réflexions, 2 jeux de données (NOAA, ONU).
- PWA hors ligne, mode sombre, CSP, polices auto-hébergées, tests unitaires + e2e + axe, workflows GitHub Actions.
- Données de démarrage : 41 titres réels relevés le 2026-11-08 (franceinfo, France 24, BBC, NASA) dans `pipeline/seed/`, passés par le vrai pipeline.

---

## 8. Pistes ouvertes (non faites)

- Vérifier en conditions réelles la première collecte GitHub Actions (le développement s'est fait sans accès réseau aux médias) et ajuster les seuils si une source renvoie 0 article récent.
- Enrichir les banques (objectif : 150 questions, 60 vrai/faux) en gardant une source par entrée.
- Rapprochement inter-langues (FR/EN) : seulement avec une méthode fiable ; sinon s'abstenir.
- Images libres supplémentaires (Wikimedia Commons) : uniquement avec licence vérifiée et crédit affiché.
- Export / import de la progression (fichier JSON) pour changer d'appareil sans compte.
