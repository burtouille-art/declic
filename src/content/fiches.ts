/**
 * Mini-fiches « Apprendre » : une question intrigante, une explication en 2 à 4 étapes
 * courtes (révélées progressivement), une question de compréhension, des sources.
 */
import type { z } from 'zod'
import { type ficheSchema, wiki, wikiEn } from './types'

type F = z.input<typeof ficheSchema>

export const FICHES: F[] = [
  {
    id: 'f-lune-face', theme: 'univers', title: 'Pourquoi voit-on toujours la même face de la Lune ?',
    intro: "La Lune tourne bien sur elle-même. Mais elle le fait exactement au même rythme qu'elle tourne autour de nous.",
    steps: [
      { heading: 'Deux mouvements synchronisés', text: "La Lune met environ 27,3 jours à faire le tour de la Terre, et autant à faire un tour sur elle-même. Résultat : elle nous présente toujours le même hémisphère. On parle de rotation synchrone." },
      { heading: 'Le freinage des marées', text: "Ce n'est pas une coïncidence. La gravité de la Terre a déformé la Lune en un léger renflement ; au fil de centaines de millions d'années, ces forces de marée ont freiné sa rotation jusqu'à la verrouiller." },
      { heading: 'La « face cachée » n’est pas sombre', text: "Elle reçoit autant de lumière du Soleil que l'autre : simplement, on ne la voit jamais depuis la Terre. Elle a été photographiée pour la première fois en 1959 par la sonde soviétique Luna 3." },
    ],
    check: { prompt: 'Pourquoi la face cachée de la Lune est-elle invisible depuis la Terre ?', options: ["Elle n'est jamais éclairée", 'La rotation de la Lune est synchronisée avec son orbite', 'Elle est masquée par la Terre'], answer: 1, explanation: "Elle est éclairée comme l'autre face, mais tournée en permanence à l'opposé de la Terre." },
    rubriques: ['espace', 'sciences'], related: ['f-saisons', 'f-trou-noir'],
    sources: [wiki('Rotation_synchrone'), wiki('Luna_3')],
  },
  {
    id: 'f-saisons', theme: 'univers', title: "Pourquoi fait-il plus chaud en été, si la Terre n'est pas plus près du Soleil ?",
    intro: "C'est même l'inverse : la Terre passe au plus près du Soleil début janvier, en plein hiver de l'hémisphère nord.",
    steps: [
      { heading: 'Un axe penché', text: "L'axe de rotation de la Terre est incliné d'environ 23,4° par rapport à son orbite. Pendant une moitié de l'année, l'hémisphère nord est tourné vers le Soleil ; pendant l'autre, c'est l'hémisphère sud." },
      { heading: 'Des rayons plus directs', text: "En été, le Soleil monte plus haut dans le ciel : ses rayons frappent le sol plus verticalement et concentrent leur énergie sur une plus petite surface. Les journées sont aussi plus longues." },
      { heading: 'Saisons inversées', text: "Quand c'est l'été à Paris, c'est l'hiver à Sydney. Si les saisons venaient de la distance au Soleil, elles seraient les mêmes partout." },
    ],
    check: { prompt: "Qu'est-ce qui cause les saisons ?", options: ['La distance Terre-Soleil', "L'inclinaison de l'axe de la Terre", "L'activité du Soleil"], answer: 1, explanation: "L'inclinaison de l'axe change la hauteur du Soleil et la durée du jour au fil de l'année." },
    rubriques: ['sciences', 'environnement'], related: ['f-lune-face', 'f-fuseaux'],
    sources: [wiki('Saison'), wiki('Obliquité')],
  },
  {
    id: 'f-trou-noir', theme: 'univers', title: "Qu'est-ce qu'un trou noir, au juste ?",
    intro: "Une région où la matière est si concentrée que rien, pas même la lumière, ne peut en ressortir.",
    steps: [
      { heading: "L'horizon des événements", text: "Autour d'un trou noir se trouve une frontière : l'horizon. En deçà, la vitesse nécessaire pour s'échapper dépasserait celle de la lumière. Ce n'est pas une surface solide, mais un point de non-retour." },
      { heading: "D'où viennent-ils ?", text: "Les trous noirs stellaires naissent de l'effondrement d'étoiles très massives en fin de vie. Au centre des galaxies, on trouve des trous noirs supermassifs, de millions à milliards de masses solaires." },
      { heading: 'On en a vu l’ombre', text: "En 2019, le réseau de radiotélescopes Event Horizon Telescope a publié la première image de l'ombre d'un trou noir, au cœur de la galaxie M87. En 2022, il a fait de même pour Sagittarius A*, celui de notre galaxie." },
    ],
    check: { prompt: "Que se passe-t-il pour la lumière qui franchit l'horizon d'un trou noir ?", options: ['Elle ne peut plus en ressortir', 'Elle change de couleur', 'Elle accélère et ressort'], answer: 0, explanation: "Au-delà de l'horizon, aucune trajectoire ne mène vers l'extérieur, même à la vitesse de la lumière." },
    rubriques: ['espace', 'sciences'], related: ['f-lune-face'],
    sources: [wiki('Trou_noir'), wiki('Event_Horizon_Telescope')],
  },
  {
    id: 'f-souvenir', theme: 'corps-cerveau', title: 'Comment le cerveau fabrique-t-il un souvenir ?',
    intro: "Un souvenir n'est pas rangé dans un tiroir : c'est un réseau de neurones qui se renforce, puis se réorganise.",
    steps: [
      { heading: "L'hippocampe, porte d'entrée", text: "Les nouvelles expériences sont d'abord encodées grâce à l'hippocampe, une structure du lobe temporal. Sans lui, comme chez le célèbre patient H.M. opéré en 1953, on ne forme plus de nouveaux souvenirs durables." },
      { heading: 'La consolidation', text: "Au fil des heures et des jours, en particulier pendant le sommeil, ces traces sont rejouées et transférées vers le cortex, où elles deviennent plus stables." },
      { heading: 'Se souvenir, c’est reconstruire', text: "À chaque rappel, le souvenir est réactivé et peut être modifié. C'est pour cela que des souvenirs très vifs peuvent être inexacts. Se tester (plutôt que relire) renforce la mémoire : c'est l'effet de test, utilisé par les jeux de Déclic." },
    ],
    check: { prompt: 'Quelle méthode renforce le plus la mémorisation, selon la recherche ?', options: ['Relire plusieurs fois', 'Se tester en essayant de se rappeler', 'Surligner'], answer: 1, explanation: "L'effort de récupération (se poser des questions) consolide davantage que la simple relecture." },
    visual: 'none', rubriques: ['sante', 'sciences'], related: ['f-biais-confirmation'],
    sources: [wiki('Mémoire_(psychologie)'), wiki('Hippocampe_(cerveau)'), wikiEn('Testing_effect')],
  },
  {
    id: 'f-biais-confirmation', theme: 'corps-cerveau', title: 'Pourquoi a-t-on tendance à croire ce qui nous arrange ?',
    intro: "Notre cerveau cherche plus volontiers les informations qui confirment ce que nous pensons déjà.",
    steps: [
      { heading: 'Le biais de confirmation', text: "On remarque, retient et juge plus convaincantes les informations qui vont dans le sens de nos idées. Celles qui les contredisent sont plus facilement oubliées ou critiquées." },
      { heading: 'Une expérience classique', text: "Dans la tâche des quatre cartes de Wason (1966), la plupart des participants cherchent à confirmer une règle plutôt qu'à la mettre à l'épreuve, et se trompent." },
      { heading: 'Comment s’en protéger', text: "Chercher activement ce qui pourrait nous donner tort, comparer plusieurs sources et se demander « qu'est-ce qui me ferait changer d'avis ? ». C'est aussi pour cela que Déclic montre les titres de plusieurs médias sur un même événement." },
    ],
    check: { prompt: 'Quel réflexe aide à limiter le biais de confirmation ?', options: ['Ne lire qu’une source fiable', 'Chercher ce qui pourrait me donner tort', 'Faire confiance à sa première impression'], answer: 1, explanation: "Chercher des contre-exemples oblige à tester ses idées au lieu de les conforter." },
    rubriques: ['societe', 'sante'], related: ['f-souvenir', 'f-ia-texte'],
    sources: [wiki('Biais_de_confirmation'), wiki('Tâche_de_sélection_de_Wason')],
  },
  {
    id: 'f-vaccin', theme: 'corps-cerveau', title: 'Comment un vaccin apprend-il au corps à se défendre ?',
    intro: "Un vaccin montre au système immunitaire à quoi ressemble un microbe, sans lui faire courir le risque de la maladie.",
    steps: [
      { heading: 'Un portrait-robot', text: "Le vaccin contient un microbe affaibli ou inactivé, un morceau de microbe (une protéine), ou les instructions pour que nos cellules fabriquent ce morceau (ARN messager)." },
      { heading: 'La mémoire immunitaire', text: "Le système immunitaire produit des anticorps et des cellules mémoire contre ce portrait-robot. Si le vrai microbe se présente plus tard, la réponse est plus rapide et plus forte." },
      { heading: 'Une histoire ancienne', text: "En 1796, Edward Jenner protège un enfant contre la variole en lui inoculant la vaccine, une maladie bovine proche : c'est l'origine du mot « vaccin ». La variole a été déclarée éradiquée en 1980." },
    ],
    check: { prompt: "D'où vient le mot « vaccin » ?", options: ['Du latin vacca, la vache', 'Du nom de son inventeur', "D'un mot grec signifiant protéger"], answer: 0, explanation: "La vaccine, maladie de la vache (vacca en latin), a servi à protéger contre la variole." },
    rubriques: ['sante', 'sciences', 'histoire'], related: ['f-souvenir'],
    sources: [wiki('Vaccin'), wiki('Edward_Jenner'), wiki('Variole')],
  },
  {
    id: 'f-effet-serre', theme: 'terre-climat', title: "L'effet de serre, c'est bien ou c'est mal ?",
    intro: "Les deux : sans lui, la Terre serait gelée ; renforcé par nos émissions, il réchauffe le climat.",
    steps: [
      { heading: 'Une couverture naturelle', text: "La Terre renvoie vers l'espace une partie de l'énergie du Soleil sous forme d'infrarouges. Certains gaz (vapeur d'eau, CO₂, méthane…) en absorbent et en réémettent une partie vers le sol. Sans cet effet, la température moyenne serait d'environ −18 °C au lieu d'environ +15 °C." },
      { heading: 'Une couverture qui s’épaissit', text: "Depuis la révolution industrielle, la combustion du charbon, du pétrole et du gaz, ainsi que la déforestation, ont fait monter la concentration de CO₂ : la courbe ci-dessous montre les mesures de Mauna Loa depuis 1959." },
      { heading: 'Ce que dit le GIEC', text: "Le GIEC conclut qu'il est sans équivoque que l'influence humaine a réchauffé l'atmosphère, l'océan et les terres. La température mondiale de 2011-2020 dépasse d'environ 1,1 °C celle de 1850-1900." },
    ],
    check: { prompt: "Sans effet de serre naturel, quelle serait à peu près la température moyenne à la surface de la Terre ?", options: ['Environ +30 °C', 'Environ +15 °C', 'Environ −18 °C'], answer: 2, explanation: "L'effet de serre naturel apporte environ 33 °C : il rend la planète habitable." },
    visual: 'co2', rubriques: ['environnement', 'sciences'], related: ['f-saisons'],
    sources: [wiki('Effet_de_serre'), { label: 'GIEC — AR6, Résumé pour les décideurs (2023)', url: 'https://www.ipcc.ch/report/ar6/syr/' }, { label: 'NOAA GML — CO₂ à Mauna Loa', url: 'https://gml.noaa.gov/ccgg/trends/data.html' }],
  },
  {
    id: 'f-arc-en-ciel', theme: 'terre-climat', title: 'Pourquoi un arc-en-ciel est-il toujours rond ?',
    intro: "Chaque goutte de pluie fait office de petit prisme. L'arc dessine tous les points du ciel situés sous le même angle.",
    steps: [
      { heading: 'Réfraction et réflexion', text: "Un rayon de soleil entre dans une goutte, est dévié (réfracté), se réfléchit sur le fond de la goutte, puis ressort. Chaque couleur est déviée un peu différemment : la lumière blanche se décompose." },
      { heading: 'Un angle fixe', text: "La lumière ressort surtout autour de 42° par rapport à la direction opposée au Soleil. Toutes les gouttes situées à 42° de ce point forment un cercle : l'arc est une portion de ce cercle, coupée par l'horizon." },
      { heading: 'Le Soleil dans le dos', text: "On ne voit un arc-en-ciel qu'avec le Soleil derrière soi et la pluie devant. D'avion, on peut parfois l'observer en cercle complet." },
    ],
    check: { prompt: 'Où doit être le Soleil pour voir un arc-en-ciel ?', options: ['Devant soi', 'Derrière soi', 'Au-dessus de soi, au zénith'], answer: 1, explanation: "L'arc se forme autour du point opposé au Soleil, le point antisolaire." },
    rubriques: ['sciences', 'environnement'], related: ['f-saisons'],
    sources: [wiki('Arc-en-ciel')],
  },
  {
    id: 'f-avion', theme: 'technologie', title: 'Comment un avion de plusieurs centaines de tonnes tient-il en l’air ?',
    intro: "Grâce à la portance : l'aile dévie une grande masse d'air vers le bas, et l'air pousse l'aile vers le haut.",
    steps: [
      { heading: 'Une aile qui dévie l’air', text: "Le profil de l'aile et son angle d'attaque (son inclinaison par rapport au vent relatif) font que l'air passe plus vite au-dessus et moins vite en dessous. Il en résulte une pression plus faible au-dessus et une force vers le haut : la portance." },
      { heading: 'La vitesse compte beaucoup', text: "La portance augmente avec le carré de la vitesse : voler deux fois plus vite donne environ quatre fois plus de portance. C'est pourquoi les avions accélèrent longtemps sur la piste avant de décoller." },
      { heading: 'Le décrochage', text: "Si l'angle d'attaque devient trop grand, l'écoulement d'air décolle de l'aile et la portance chute brutalement : c'est le décrochage, que les pilotes apprennent à reconnaître et à récupérer." },
    ],
    check: { prompt: "Si un avion vole deux fois plus vite, sa portance est multipliée environ par…", options: ['2', '4', '8'], answer: 1, explanation: "La portance est proportionnelle au carré de la vitesse : 2² = 4." },
    rubriques: ['technologie', 'sciences'], related: ['f-pendule'],
    sources: [wiki('Portance_(aérodynamique)'), wiki('Décrochage_(aéronautique)')],
  },
  {
    id: 'f-ia-texte', theme: 'technologie', title: 'Comment une IA peut-elle écrire un texte ?',
    intro: "Les grands modèles de langage n'ont pas de dictionnaire de réponses : ils prédisent, morceau par morceau, la suite la plus probable d'un texte.",
    steps: [
      { heading: 'Prédire le mot suivant', text: "Un modèle de langage découpe le texte en petits morceaux (des « tokens ») et apprend, sur d'immenses quantités de textes, à estimer quel morceau a le plus de chances de venir ensuite. Il génère une réponse en répétant cette prédiction." },
      { heading: 'Un apprentissage en plusieurs temps', text: "Après cet entraînement initial, les modèles d'assistants sont ajustés avec des exemples et des retours humains pour mieux suivre des consignes et refuser certaines demandes." },
      { heading: 'Des limites à connaître', text: "Un modèle peut produire des affirmations fausses mais plausibles (on parle d'« hallucinations ») et ses connaissances s'arrêtent à ses données d'entraînement. D'où l'importance de vérifier les sources : c'est le choix fait par Déclic, qui n'invente aucun résumé d'actualité." },
    ],
    check: { prompt: 'Que fait fondamentalement un modèle de langage quand il écrit ?', options: ['Il recopie une page web', 'Il prédit la suite la plus probable du texte', 'Il consulte une base de réponses vérifiées'], answer: 1, explanation: "Il génère le texte token par token, en estimant la suite la plus probable ; d'où des erreurs possibles." },
    rubriques: ['ia', 'technologie'], related: ['f-biais-confirmation'],
    sources: [wiki('Grand_modèle_de_langage'), wiki('Hallucination_(intelligence_artificielle)')],
  },
  {
    id: 'f-pendule', theme: 'technologie', title: 'Pourquoi le pendule a-t-il révolutionné la mesure du temps ?',
    intro: "Parce que son rythme ne dépend presque que de sa longueur. Modifie la longueur, la pesanteur ou la masse, et observe.",
    steps: [
      { heading: 'Une période régulière', text: "Pour de petites oscillations, un pendule simple met toujours le même temps à faire un aller-retour : T = 2π√(L/g). La masse n'apparaît pas dans la formule." },
      { heading: 'L’horloge de Huygens', text: "En 1656, Christiaan Huygens construit la première horloge à pendule. La dérive des meilleures horloges passe d'une quinzaine de minutes par jour à une quinzaine de secondes environ." },
      { heading: 'Un pendule sur la Lune', text: "La pesanteur lunaire est environ six fois plus faible : le même pendule y oscillerait environ 2,5 fois plus lentement (√6 ≈ 2,45)." },
    ],
    check: { prompt: 'Que se passe-t-il si on quadruple la longueur du pendule ?', options: ['La période double', 'La période est multipliée par 4', 'Rien ne change'], answer: 0, explanation: "La période varie comme la racine carrée de la longueur : √4 = 2." },
    visual: 'pendulum', rubriques: ['sciences', 'histoire'], related: ['f-avion', 'f-fuseaux'],
    sources: [wiki('Pendule_simple'), wiki('Christiaan_Huygens')],
  },
  {
    id: 'f-fuseaux', theme: 'societe', title: "Pourquoi n'est-il pas la même heure partout ?",
    intro: "Parce que la Terre tourne : midi au soleil arrive plus tôt à l'est qu'à l'ouest.",
    steps: [
      { heading: '15° par heure', text: "La Terre fait un tour (360°) en 24 heures environ, soit 15° de longitude par heure. Le monde a été découpé en fuseaux horaires d'environ 15° de large." },
      { heading: 'Une invention du chemin de fer', text: "Au XIXe siècle, chaque ville vivait à son heure solaire locale. Les horaires de train rendaient cela ingérable. En 1884, la conférence internationale de Washington adopte le méridien de Greenwich comme référence." },
      { heading: 'Des choix politiques', text: "Les frontières des fuseaux suivent souvent celles des pays. La France métropolitaine vit à l'heure d'Europe centrale (UTC+1 en hiver), alors que Greenwich est presque à la même longitude." },
    ],
    check: { prompt: 'Combien de degrés de longitude la Terre parcourt-elle en une heure ?', options: ['1°', '15°', '24°'], answer: 1, explanation: "360° en 24 heures, soit 15° par heure." },
    rubriques: ['societe', 'histoire'], related: ['f-saisons', 'f-pendule'],
    sources: [wiki('Fuseau_horaire'), wiki('Conférence_internationale_du_méridien')],
  },
  {
    id: 'f-inflation', theme: 'societe', title: "Qu'est-ce que l'inflation, concrètement ?",
    intro: "C'est la hausse générale et durable des prix : avec le même billet, on achète un peu moins qu'avant.",
    steps: [
      { heading: 'Comment on la mesure', text: "En France, l'Insee suit chaque mois les prix d'un « panier » représentatif de la consommation des ménages : l'indice des prix à la consommation. L'inflation est sa variation sur un an." },
      { heading: 'D’où elle vient', text: "Les prix peuvent monter parce que la demande dépasse l'offre, parce que les coûts de production augmentent (énergie, matières premières), ou parce que les anticipations de hausse s'auto-entretiennent." },
      { heading: 'Le rôle des banques centrales', text: "La Banque centrale européenne vise une inflation de 2 % à moyen terme. Pour freiner la hausse des prix, elle relève ses taux d'intérêt, ce qui renchérit le crédit et ralentit la demande." },
    ],
    check: { prompt: "Quel objectif d'inflation la Banque centrale européenne vise-t-elle à moyen terme ?", options: ['0 %', '2 %', '5 %'], answer: 1, explanation: "2 % : un niveau jugé suffisamment bas pour préserver le pouvoir d'achat, mais assez éloigné d'une baisse des prix." },
    rubriques: ['economie'], related: ['f-biais-confirmation'],
    sources: [wiki('Inflation'), { label: 'BCE — Stratégie de politique monétaire', url: 'https://www.ecb.europa.eu/mopo/strategy/html/index.fr.html' }],
  },
  {
    id: 'f-mur-berlin', theme: 'histoire', title: 'Pourquoi le mur de Berlin est-il tombé si soudainement ?',
    intro: "Une conférence de presse confuse, le soir du 9 novembre 1989, a précipité un mouvement qui couvait depuis des mois.",
    steps: [
      { heading: 'Un régime sous pression', text: "À l'été 1989, des milliers d'Allemands de l'Est fuient vers l'Ouest via la Hongrie, qui a ouvert sa frontière avec l'Autriche. À Leipzig, les manifestations du lundi rassemblent des dizaines de milliers de personnes." },
      { heading: 'Une phrase de trop', text: "Le 9 novembre, le porte-parole Günter Schabowski annonce de nouvelles règles de voyage. Interrogé sur leur entrée en vigueur, il répond qu'elles s'appliquent « immédiatement, sans délai »." },
      { heading: 'La foule aux points de passage', text: "Des milliers de Berlinois de l'Est se pressent aux postes-frontières. Débordés et sans ordres clairs, les gardes finissent par ouvrir. Moins d'un an plus tard, le 3 octobre 1990, l'Allemagne est réunifiée." },
    ],
    check: { prompt: "Quel événement a déclenché l'ouverture du mur le 9 novembre 1989 ?", options: ['Une décision de l’ONU', 'Une conférence de presse confuse', 'Une offensive militaire'], answer: 1, explanation: "L'annonce de Günter Schabowski, mal préparée, a poussé la foule vers les points de passage." },
    visual: 'timeline', rubriques: ['histoire', 'monde'], related: ['f-fuseaux'],
    sources: [wiki('Chute_du_mur_de_Berlin'), wiki('Günter_Schabowski')],
  },
]

/** Parcours : des fiches enchaînées dans un ordre pensé pour progresser. */
export const PATHS = [
  { id: 'p-univers', title: "Le ciel au-dessus de nous", fiches: ['f-saisons', 'f-lune-face', 'f-trou-noir'] },
  { id: 'p-cerveau', title: 'Ton cerveau, mode d’emploi', fiches: ['f-souvenir', 'f-biais-confirmation', 'f-vaccin'] },
  { id: 'p-planete', title: 'Comprendre le climat', fiches: ['f-arc-en-ciel', 'f-effet-serre', 'f-saisons'] },
  { id: 'p-machines', title: 'Machines et inventions', fiches: ['f-pendule', 'f-avion', 'f-ia-texte'] },
  { id: 'p-monde', title: 'Le monde qui nous entoure', fiches: ['f-fuseaux', 'f-inflation', 'f-mur-berlin'] },
] as const
