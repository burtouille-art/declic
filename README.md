# DÉCLIC

**Cinq minutes par jour pour comprendre le monde, apprendre quelque chose et se faire plaisir.**

> Tu es une IA ou tu reprends le code ? Commence par **[AGENTS.md](AGENTS.md)** : règles à respecter, carte du dépôt, pièges connus et journal des modifications.

Média numérique francophone : actualité sourcée (flux RSS réels), découvertes, mini-fiches, cinq jeux de culture générale et un parcours quotidien, le *Déclic du jour*. Site statique, gratuit à héberger (GitHub Pages), sans compte, sans serveur, sans API payante.

---

## Sommaire

1. [Ce que contient le projet](#ce-que-contient-le-projet)
2. [Démarrage local](#démarrage-local)
3. [Mise en ligne gratuite sur GitHub Pages](#mise-en-ligne-gratuite-sur-github-pages)
4. [Le pipeline d'actualité](#le-pipeline-dactualité)
5. [Fiabilité, droits et choix éditoriaux](#fiabilité-droits-et-choix-éditoriaux)
6. [Direction artistique et design system](#direction-artistique-et-design-system)
7. [Architecture du code](#architecture-du-code)
8. [Tests et vérifications](#tests-et-vérifications)
9. [Ajouter des contenus ou des sources](#ajouter-des-contenus-ou-des-sources)
10. [Limites connues](#limites-connues)

---

## Ce que contient le projet

| Espace | Route | Ce qu'on y fait |
|---|---|---|
| Accueil | `#/` | Une couverture de magazine : la une (1 + 4 titres), le Déclic du jour, l'index des rubriques, une découverte, le quiz du jour jouable sur place, la section Sciences & espace (photo NASA + mini-expérience du pendule), « Ce jour-là » (devine l'année), les sujets selon tes préférences. |
| Actualités | `#/actus`, `#/actus/:rubrique` | 14 rubriques, recherche plein texte, filtres (période, langue, type de source), « sujets du moment », carte des pays cités, comparaison des titres quand plusieurs médias couvrent le même événement, contenus explicatifs associés. |
| Déclic du jour | `#/declic` | 5 écrans : trois infos, une découverte, une question qui fait réfléchir, un défi de mémoire, un bilan. Progression sauvegardée, on peut quitter et reprendre, ou recommencer. |
| Découvrir | `#/decouvrir` | La machine à curiosités : bouton « Surprends-moi », 18 découvertes sourcées, question d'intuition avant l'explication, mini-expériences (Stroop, tache aveugle, pendule, graphiques). |
| Jouer | `#/jouer` | Quiz du jour (10 questions, sélection quotidienne reproductible), Vrai ou faux, Chronologie (glisser-déposer + clavier), Défi des 60 secondes (mode temps étendu), Grand voyage (carte du monde, 3 modes, 5 régions), Révisions (répétition espacée). |
| Apprendre | `#/apprendre`, `#/apprendre/:id`, `#/apprendre/frise` | 14 mini-fiches en 3 étapes révélées progressivement, 5 parcours, frise du temps interactive (38 repères). |
| Mon espace | `#/moi` | Calendrier des 14 derniers Déclic, compteurs, parcours, scores, badges, préférences, favoris, historique, effacement des données. |
| 2 minutes | `#/2-minutes` | Trois titres, une découverte courte, un vrai/faux. |
| Diagnostic | `#/diagnostic` | État de chaque source à la dernière collecte : succès, erreurs, articles retenus, secours utilisé. |

Contenus éditoriaux embarqués (tous sourcés) : 70 questions, 36 affirmations vrai/faux, 38 événements, 87 pays, 18 découvertes, 14 fiches, 8 problèmes de raisonnement, 2 jeux de données (CO₂ Mauna Loa – NOAA, population mondiale – ONU).

---

## Démarrage local

Prérequis : **Node.js 20+** (testé avec 22) et **Python 3.10+** (testé avec 3.13).

```bash
npm install
pip install -r pipeline/requirements.txt

npm run news      # collecte réelle des flux -> public/data/*.json (nécessite Internet)
npm run dev       # http://localhost:5173
```

Sans connexion, le dépôt contient déjà des données de démarrage dans `public/data/` (voir plus bas). Pour les régénérer depuis l'instantané :

```bash
python3 pipeline/run.py --out public/data --seed pipeline/seed/snapshot.json --now 2026-11-08T19:00:00+00:00
```

Autres commandes :

```bash
npm run build       # build de production dans dist/
npm run preview     # sert dist/ sur http://localhost:4173
npm run typecheck   # TypeScript strict
npm test            # tests unitaires et de composants (Vitest)
npm run test:e2e    # tests de navigation Playwright (mobile + ordinateur, axe)
python3 -m pytest pipeline/tests   # tests du pipeline
```

Pour les tests de navigation, installer une fois le navigateur : `npx playwright install chromium`.

---

## Mise en ligne gratuite sur GitHub Pages

1. **Créer un dépôt** sur GitHub (public : Pages et Actions sont gratuits et illimités pour les dépôts publics).
2. **Pousser le projet** sur la branche `main` :
   ```bash
   git init && git add . && git commit -m "DÉCLIC"
   git branch -M main
   git remote add origin https://github.com/<compte>/<depot>.git
   git push -u origin main
   ```
3. **Activer Pages** : *Settings → Pages → Build and deployment → Source : **GitHub Actions***. (Ne pas choisir « Deploy from a branch ».)
4. **Vérifier Actions** : *Settings → Actions → General* : « Allow all actions » et, dans *Workflow permissions*, la valeur par défaut suffit (le workflow déclare lui-même `pages: write` et `id-token: write`).
5. Le push déclenche le workflow **« Collecte et déploiement »** (onglet *Actions*). Au bout de 2 à 3 minutes, le site est en ligne à `https://<compte>.github.io/<depot>/`.
6. **Déclenchement manuel** : *Actions → Collecte et déploiement → Run workflow*.

Aucune configuration de chemin n'est nécessaire : le build utilise des chemins relatifs et un routage par ancre (`#/…`), compatibles avec n'importe quel sous-chemin GitHub Pages et avec un domaine personnalisé.

### Les tâches planifiées : limites et réactivation

- Le workflow tourne **toutes les 6 heures** (`17 */6 * * *`, en UTC). GitHub peut retarder une exécution planifiée de quelques minutes à une heure en période de charge, voire en sauter une exceptionnellement : le site affiche toujours la date réelle de dernière actualisation.
- **Dans un dépôt public, GitHub désactive automatiquement les workflows planifiés après 60 jours sans activité sur le dépôt** (aucun commit). Le workflow s'en protège tout seul : son job `keepalive` fait un commit vide dès que le dernier commit a plus de 45 jours. Si jamais le cron était quand même suspendu : *Actions → Collecte et déploiement → « Enable workflow »*, puis *Run workflow*.
- Une exécution échouée ne casse pas le site : la version précédemment déployée reste en ligne. GitHub envoie un e-mail en cas d'échec.

---

## Le pipeline d'actualité

```
sources.json ─▶ fetch.py ─▶ normalize.py ─▶ classify.py ─▶ build.py ─▶ cluster.py ─▶ public/data/
 (flux vérifiés)  (délai 20 s,   (texte brut,      (rubrique du    (fraîcheur 7 j,   (rapprochement   news.json
                   5 Mo max)      URL sûres,        flux > chemin   dédup., secours   prudent entre    status.json
                                  dates UTC)        URL > mots-clés) par source)      médias)          onthisday.json
```

La collecte a lieu **dans GitHub Actions, avant le build** : le navigateur ne fait jamais de requête vers les médias (pas de problème de CORS, pas de traceur tiers).

| Étape | Mise en œuvre |
|---|---|
| 1. Flux réellement accessibles | 28 flux listés dans `pipeline/sources.json`, chacun vérifié le 8 novembre 2026 (réponse 200, XML valide, articles du jour ou de la semaine). |
| 2. Validation et normalisation | `normalize.py` : HTML retiré (scripts et iframes compris), caractères de contrôle supprimés, URL `http(s)` uniquement, dates converties en UTC, titres tronqués proprement. Chaque article est revalidé (`validate_article`) puis, côté site, par un schéma zod. |
| 3. Déduplication | URL canonique (sans paramètres de suivi ni fragment), puis titre identique chez un même média. Les rubriques des doublons sont fusionnées. |
| 4. Classification | Rubrique du flux thématique en priorité, puis rubrique lisible dans le chemin de l'URL (franceinfo, France 24, Le Monde), puis mots-clés qui ajoutent des rubriques secondaires (IA, Espace, Santé…). Cas pièges testés : « mars » (le mois), « IA » en minuscules. |
| 5. Langues | Chaque source déclare sa langue ; badge « EN » à l'affichage, filtre « En français seulement ». Pas de traduction automatique. |
| 6. Fraîcheur | Articles de plus de 7 jours écartés ; dates futures ramenées à l'heure de collecte. |
| 7. JSON | `news.json` (articles, rapprochements, médias), `status.json` (diagnostic), `onthisday.json` (éphéméride Wikipédia du jour et du lendemain). Écriture atomique. |
| 8. Publication | Workflow GitHub Actions → GitHub Pages. |
| 9. Dernières données valides | Avant chaque collecte, le workflow télécharge les JSON actuellement en ligne. Une source en panne garde ses articles récents de la collecte précédente (marqués « Secours » dans le diagnostic). Si la collecte entière rapporte moins de 15 articles, les données précédentes sont republiées telles quelles. |
| 10. Date d'actualisation | Affichée en tête de l'accueil, des rubriques et du diagnostic. |

**Rapprochement entre médias** (`cluster.py`) : deux articles sont rapprochés seulement s'ils viennent de médias différents, sont dans la même langue, ont été publiés à moins de 36 h d'écart et partagent au moins 3 racines de mots significatifs couvrant au moins la moitié du titre le plus court. Les seuils sont volontairement stricts : mieux vaut rater un rapprochement que d'en inventer un. La vue comparative n'affiche que les titres originaux et les liens, sans étiquette de « bord politique ».

### Sources retenues

Francophones : franceinfo (titres, Monde, Politique, Société, Éco, Sciences, Tech, Culture, Sports, Environnement), France 24 (titres, Éco-Tech), Le Monde (une, Histoire), Numerama, Reporterre, Inserm (salle de presse), 20 Minutes (Insolite), The Conversation France.
Internationales : BBC News (World, Science & Environment, Technology, Health), NASA (communiqués et flux général), NASA JPL, ESA, OMS.
Données structurées : API Wikimedia « onthisday » (Wikipédia en français, CC BY-SA).

Écartés à la vérification : ESA « Space Science » (404), franceinfo Santé (réponse sans articles exploitables), France 24 Europe et MIT Technology Review IA (contenu non vérifiable au moment du test), Futura Sciences (idem). Ils peuvent être réintégrés après un nouveau test.

### Données de démarrage

`public/data/` contient un instantané produit **par le même pipeline** à partir de 41 titres relevés le 8 novembre 2026 vers 20 h dans cinq des flux (franceinfo, France 24, BBC, NASA) et de l'éphéméride Wikipédia des 8 et 9 novembre (`pipeline/seed/`). Il sert au développement local et de filet de sécurité avant la première collecte. Le site l'indique explicitement (« Données de démarrage… ») tant qu'une collecte réelle ne l'a pas remplacé. Le premier passage du workflow le remplace.

---

## Fiabilité, droits et choix éditoriaux

- **Aucune actualité inventée, aucun résumé généré.** Le titre et le chapô affichés sont ceux du flux du média, nettoyés et éventuellement tronqués ; s'il n'y a pas de chapô ou qu'il répète le titre, rien n'est affiché. Chaque article montre le média, l'heure de publication (au survol : date complète) et renvoie vers l'article original dans un nouvel onglet (`rel="noopener noreferrer"`).
- **Paywalls** : aucun contournement ; seuls les éléments publiés dans les flux RSS publics sont repris.
- **Images** : uniquement quand le droit de réutilisation est identifié dans `sources.json`, et seulement depuis les hôtes attendus. Aujourd'hui : NASA et NASA/JPL (crédit affiché). Aucune image de presse n'est reprise. Les autres sections misent sur la typographie, la couleur et des illustrations vectorielles maison.
- **Carte** : Natural Earth 1:110m (domaine public) via le paquet `world-atlas`.
- **Jeux d'actualité** : le site ne génère de questions qu'à partir de données structurées vérifiables. Deux cas : les questions « En quelle année… ? » issues de l'éphéméride Wikipédia (l'année vient de la donnée), et la question de mémoire du Déclic « Quel média a publié ce titre ? ». Aucune question n'est fabriquée à partir de titres seuls.
- **Mise en avant** : le score d'importance est transparent (`importance()` dans `src/lib/news.ts`) : couverture par plusieurs médias, fraîcheur, présence d'un chapô, langue. Aucune pondération par média ni jugement politique.
- **Données personnelles** : aucune. Pas de compte, pas de cookie, pas de statistiques, polices auto-hébergées (pas de Google Fonts). La progression vit dans le `localStorage` du navigateur. Une politique de sécurité du contenu (CSP) stricte est injectée au build.
- **Contenus pédagogiques** : chaque question, affirmation, événement, découverte et fiche cite une source consultable. Les titres d'articles Wikipédia cités ont été vérifiés via l'API MediaWiki (5 titres introuvables ont été remplacés). Les questions à capitale ambiguë (Pays-Bas, Bolivie, Afrique du Sud…) sont exclues.

---

## Direction artistique et design system

**Synthèse des références.** Les sites de référence n'ont pas pu être inspectés visuellement depuis l'environnement de développement (pas de navigateur avec accès à ces sites) ; la synthèse s'appuie sur leurs principes connus, sans reprise d'interface, de logo ni d'élément graphique :

- *The Pudding, Our World in Data* → une donnée se manipule (graphiques à curseur, comparaison d'années, tableau accessible) et chaque chiffre a sa source.
- *New York Times, ARTE* → hiérarchie typographique forte, grands titres serif, compositions asymétriques, aplats de couleur expressifs.
- *Ground News, Semafor* → séparer le fait (titre et chapô du média) de la comparaison (vue multi-médias), sans attribuer d'orientation politique.
- *Brilliant* → question **avant** explication, retour immédiat, explications progressives.
- *Duolingo* → un rituel quotidien court avec progression, mais sans couleurs vives enfantines ni compétition.
- *Google Arts & Culture* → jeux de découverte légers (« devine l'année »).

**Décisions retenues.**

- **Signature : l'anneau Déclic.** Cinq segments, comme les cinq écrans du parcours quotidien. Il sert de logo, de bouton central de la navigation mobile, de barre de progression du Déclic, de calendrier dans « Mon espace » et de jauge de score.
- **Une règle de forme lisible** : l'éditorial est à angles vifs et filets (on lit), l'interactif est arrondi (on touche). On sait sans réfléchir ce qui se manipule.
- **Rythme éditorial** : chaque section a sa composition et sa couleur dominante (une asymétrique 7/5, index typographique des rubriques, bandeau jaune de la découverte, bloc pétrole du quiz, photo spatiale pleine largeur, bande « Ce jour-là »), plutôt qu'une grille de cartes identiques.
- **Palette** (base fournie, contrastes ajustés pour le WCAG AA) :

  | Jeton | Clair | Sombre | Usage |
  |---|---|---|---|
  | `paper` | `#F7F5EF` | `#111615` | fond |
  | `paper-2` | `#ECEAE4` | `#1A201F` | surfaces |
  | `ink` | `#171B1D` | `#ECE9E1` | texte |
  | `vermilion` | `#EF6448` | `#FF7A5E` | aplats, boutons, anneau |
  | `vermilion-ink` | `#B23E25` | `#FF9A82` | texte d'accent (le vermillon d'origine n'atteint pas 4,5:1 sur ivoire) |
  | `petrol` | `#176B65` | `#1F7D76` | quiz, Déclic, sciences |
  | `sun` | `#F2D978` | `#F2D978` | découvertes, badges |

- **Typographies** : Newsreader (variable, axe optique `opsz` exploité : grands titres serrés, texte courant plus ouvert) pour l'éditorial ; DM Sans pour l'interface. Auto-hébergées via Fontsource. Échelle : display `clamp(2.15rem → 5.4rem)`, h1 `clamp(1.85 → 3.4rem)`, h2 `clamp(1.45 → 2.1rem)`, h3 1.22rem, corps serif 1.09rem / 1.65.
- **Grille** : conteneur 82rem, gouttières 16 / 24 / 40 px ; grille 12 colonnes asymétrique sur ordinateur (7/5, 8/4, 4/8), une colonne sur mobile.
- **Mouvement** : rares et fonctionnels (transition entre écrans du Déclic, retournement, apparition du bilan). `prefers-reduced-motion` respecté partout.
- **Composants** (`src/components/`) : boutons à 6 variantes, étiquettes de rubrique, barres de progression, temps de lecture, questions à choix multiples (`Choices`), carte retournable (`FlipCard`), carte de découverte à révélation, graphique manipulable, carte du monde, frise, navigation mobile fixe, squelettes de chargement, états d'erreur et états vides.

---

## Architecture du code

**Pile** : React 19, TypeScript strict, Vite, Tailwind CSS 4, Motion, Lucide, zod, d3-geo + topojson, vite-plugin-pwa (Workbox). Pipeline : Python + feedparser. CI/CD : GitHub Actions + GitHub Pages.

```
pipeline/
  sources.json            flux vérifiés + droits d'image
  run.py                  point d'entrée (--out, --previous, --seed, --now)
  declic/                 fetch, sanitize, normalize, classify, cluster, onthisday, build
  seed/                   instantané de démarrage
  tests/                  pytest (23 tests)
src/
  content/                banques éditoriales typées + schémas zod (validées au chargement)
  lib/                    store (localStorage), news (chargement + validation), daily (sélections
                          du jour), random (graines), srs (révision espacée), gameLogic, geo, badges
  components/             ui/, layout/, news/, discover/, game/, viz/
  pages/                  une page par route ; home/ pour les sections de l'accueil
  games/                  les cinq jeux
e2e/                      tests Playwright
.github/workflows/        deploy.yml (collecte + déploiement), ci.yml (vérifications sur PR)
```

Points notables :

- **Routage** `HashRouter` + `base: './'` : aucune erreur 404 au rechargement sur GitHub Pages.
- **Chargement différé** : jeux, carte (108 Ko de géométrie), frise, mini-expériences et diagnostic sont dans des fichiers séparés. Bundle initial : environ 123 Ko gzip.
- **Hors ligne (PWA)** : application installable ; code, polices, fiches et banques de questions pré-cachés ; données d'actualité en « réseau d'abord, cache en secours » ; images NASA en cache. Testé : fiches et jeux fonctionnent hors ligne.
- **Sélection quotidienne reproductible** : une banque mélangée une fois avec une graine fixe, puis une tranche par jour (`dailySlice`) : pas de répétition avant d'avoir parcouru toute la banque, et le même quiz pour tout le monde le même jour.
- **Révision espacée** : Leitner à 5 boîtes (1, 3, 7, 14, 30 jours) ; une erreur ramène la question au lendemain.
- **Sécurité** : aucun HTML venu des flux n'est injecté (pas de `dangerouslySetInnerHTML`) ; double nettoyage (Python puis schéma zod) ; CSP ; aucun secret (il n'en existe aucun).

---

## Tests et vérifications

Réellement exécutés pendant le développement :

| Suite | Résultat |
|---|---|
| `pytest pipeline/tests` : nettoyage HTML, URL dangereuses, dates, images, classification, déduplication, rapprochements, éphéméride, secours par source, conservation des données en cas de panne totale, fraîcheur | 23/23 |
| `npm test` (Vitest) : validité de toutes les banques, sélection quotidienne sans répétition, mélange des options, répétition espacée, logique de la chronologie et du grand voyage, détection des pays, validation des données d'actualité, récupération d'un `localStorage` corrompu, parties complètes de quiz / vrai-faux / chronologie | 30/30 |
| `npm run test:e2e` (Playwright, Pixel 7 + ordinateur) : accueil, navigation, rubriques + recherche + filtre, Déclic complet avec persistance et recommencement, quiz au clavier, partie complète du grand voyage, découvertes, fiche, favoris, thème sombre, diagnostic, **hors ligne**, **axe-core WCAG 2.2 AA sur 6 pages (aucune violation sérieuse ou critique)** | 32/32 |
| `npm run typecheck` | sans erreur |

Ce qui n'a pas pu être testé dans l'environnement de développement : la collecte en direct (le réseau sortant vers les médias y était bloqué ; les flux ont été vérifiés par un outil externe et le pipeline par des tests sur flux simulés et sur l'instantané réel), l'affichage des photos NASA (même raison), et le déploiement GitHub Pages lui-même.

---

## Ajouter des contenus ou des sources

**Une source RSS** : la tester d'abord (`python3 -c "import feedparser; d=feedparser.parse('URL'); print(len(d.entries), d.entries[0].published)"`), puis ajouter une entrée dans `pipeline/sources.json` (`category: null` si le flux mélange les rubriques). N'ajouter `images.allowed: true` que si la licence des images est connue et autorise la réutilisation.

**Une question** : dans `src/content/questions.ts`, une ligne `q(id, thème, niveau, question, [4 options], index de la bonne réponse, explication, source)`. Les tests vérifient l'unicité, les options et la source. Même principe pour `statements.ts`, `events.ts`, `discoveries.ts`, `fiches.ts`, `reflections.ts`.

---

## Limites connues

- Pas de traduction des articles en anglais (choix assumé : pas de contenu généré).
- Le rapprochement inter-médias ne fonctionne qu'à l'intérieur d'une même langue, et rate volontairement des cas pour éviter les faux rapprochements.
- La carte au 1:110m ne contient pas les micro-États (Luxembourg, Malte, Singapour…).
- Le diagnostic est public (il ne contient que des informations publiques). Pour le masquer, retirer le lien du pied de page : la route reste accessible par son adresse.
- Le `localStorage` est propre à chaque navigateur : la progression ne se synchronise pas entre appareils.
