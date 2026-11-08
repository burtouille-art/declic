/**
 * Banque de questions vérifiées.
 * Règle : une seule bonne réponse, des distracteurs plausibles mais faux,
 * une explication courte et une source consultable.
 */
import type { z } from 'zod'
import { type questionSchema, type Theme, type Source, wiki } from './types'

type Q = z.input<typeof questionSchema>
const q = (id: string, theme: Theme, level: 1 | 2 | 3, prompt: string, options: [string, string, string, string], answer: 0 | 1 | 2 | 3, explanation: string, source: Source): Q => ({
  id: `q-${id}`, theme, level, prompt, options, answer, explanation, source,
})

export const QUESTIONS: Q[] = [
  // --- Espace
  q('mercure', 'espace', 1, 'Quelle planète est la plus proche du Soleil ?', ['Vénus', 'Mercure', 'Mars', 'La Terre'], 1, "Mercure orbite à environ 58 millions de km du Soleil en moyenne, deux fois et demie plus près que la Terre.", wiki('Mercure_(planète)')),
  q('jupiter', 'espace', 1, 'Quelle est la plus grande planète du Système solaire ?', ['Saturne', 'Neptune', 'Jupiter', 'Uranus'], 2, "Jupiter est si massive qu'elle pèse plus de deux fois toutes les autres planètes réunies.", wiki('Jupiter_(planète)')),
  q('apollo11', 'espace', 1, "En quelle année un humain a-t-il marché sur la Lune pour la première fois ?", ['1965', '1969', '1972', '1957'], 1, "Neil Armstrong pose le pied sur la Lune le 21 juillet 1969 (heure de Paris), lors de la mission Apollo 11.", wiki('Apollo_11')),
  q('spoutnik', 'espace', 2, 'Comment s’appelait le premier satellite artificiel, lancé en 1957 ?', ['Vostok 1', 'Explorer 1', 'Spoutnik 1', 'Telstar'], 2, "Spoutnik 1, lancé par l'URSS le 4 octobre 1957, ouvre l'ère spatiale. Explorer 1 sera le premier satellite américain, en 1958.", wiki('Spoutnik_1')),
  q('lumiere-soleil', 'espace', 2, 'Combien de temps la lumière du Soleil met-elle pour atteindre la Terre ?', ['8 secondes', 'Environ 8 minutes', 'Environ 1 heure', 'Environ 1 jour'], 1, "La lumière parcourt les quelque 150 millions de km qui nous séparent du Soleil en 8 minutes et 20 secondes environ.", wiki('Unité_astronomique')),
  q('webb', 'espace', 2, 'Quel télescope spatial a été lancé le 25 décembre 2021 ?', ['Hubble', 'Kepler', 'James-Webb', 'Gaia'], 2, "Le télescope James-Webb, fruit de la NASA, de l'ESA et de l'Agence spatiale canadienne, observe principalement dans l'infrarouge.", wiki('Télescope_spatial_James-Webb')),
  q('planete-rouge', 'espace', 1, 'Quelle planète est surnommée la « planète rouge » ?', ['Mars', 'Vénus', 'Mercure', 'Saturne'], 0, "Sa couleur vient des oxydes de fer (une sorte de rouille) qui recouvrent sa surface.", wiki('Mars_(planète)')),
  q('gagarine', 'espace', 2, 'Qui fut le premier humain à voyager dans l’espace, en 1961 ?', ['Neil Armstrong', 'Iouri Gagarine', 'Valentina Terechkova', 'Alexeï Leonov'], 1, "Le 12 avril 1961, Iouri Gagarine boucle un tour de la Terre à bord de Vostok 1, en 108 minutes environ.", wiki('Iouri_Gagarine')),

  // --- Sciences
  q('or', 'sciences', 1, "Quel est le symbole chimique de l'or ?", ['Or', 'Ag', 'Au', 'Go'], 2, "Au vient du latin aurum. Ag (argentum) est le symbole de l'argent.", wiki('Or')),
  q('fer', 'sciences', 1, 'Quel élément chimique a pour symbole Fe ?', ['Le fluor', 'Le fer', 'Le francium', 'Le fermium'], 1, "Fe vient du latin ferrum. Le fluor s'écrit F, le francium Fr et le fermium Fm.", wiki('Fer')),
  q('lumiere', 'sciences', 2, 'Quelle est, environ, la vitesse de la lumière dans le vide ?', ['300 km/s', '30 000 km/s', '300 000 km/s', '3 millions de km/s'], 2, "Elle vaut exactement 299 792,458 km/s : cette valeur sert aujourd'hui à définir le mètre.", wiki('Vitesse_de_la_lumière')),
  q('relativite', 'sciences', 1, 'Qui a publié la théorie de la relativité restreinte en 1905 ?', ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Max Planck'], 2, "Einstein la publie en 1905, son « année miraculeuse », avant la relativité générale en 1915.", wiki('Relativité_restreinte')),
  q('photosynthese', 'sciences', 1, 'Quel gaz les plantes absorbent-elles pour réaliser la photosynthèse ?', ["L'oxygène", "L'azote", 'Le dioxyde de carbone', "L'hélium"], 2, "Grâce à la lumière, les plantes transforment le CO₂ et l'eau en sucres, et rejettent du dioxygène.", wiki('Photosynthèse')),
  q('hydrogene', 'sciences', 2, "Quel est l'élément chimique le plus abondant dans l'Univers ?", ["L'oxygène", "L'hydrogène", 'Le carbone', "L'hélium"], 1, "L'hydrogène représente environ les trois quarts de la masse de matière ordinaire de l'Univers ; l'hélium vient ensuite.", wiki('Hydrogène')),
  q('azote', 'sciences', 2, "Quel gaz est le plus abondant dans l'air que nous respirons ?", ["L'oxygène", 'Le dioxyde de carbone', "L'azote", "L'argon"], 2, "L'atmosphère terrestre contient environ 78 % de diazote et 21 % de dioxygène.", wiki('Atmosphère_terrestre')),
  q('penicilline', 'sciences', 2, 'Qui a découvert la pénicilline en 1928 ?', ['Louis Pasteur', 'Alexander Fleming', 'Robert Koch', 'Marie Curie'], 1, "Fleming remarque qu'une moisissure, Penicillium, empêche la croissance de bactéries dans une boîte de culture oubliée.", wiki('Pénicilline')),
  q('newton', 'sciences', 1, 'Qui a publié en 1687 les lois du mouvement et de la gravitation universelle ?', ['Galilée', 'Isaac Newton', 'Johannes Kepler', 'René Descartes'], 1, "Dans les Principia (1687), Newton unifie la chute des corps sur Terre et le mouvement des planètes.", wiki('Philosophiæ_Naturalis_Principia_Mathematica')),
  q('darwin', 'sciences', 1, "Quel naturaliste a publié « L'Origine des espèces » en 1859 ?", ['Charles Darwin', 'Jean-Baptiste de Lamarck', 'Gregor Mendel', 'Carl von Linné'], 0, "Darwin y expose la théorie de l'évolution par sélection naturelle.", wiki("L'Origine_des_espèces")),
  q('son', 'sciences', 3, "À quelle vitesse le son se propage-t-il dans l'air à 20 °C ?", ['Environ 34 m/s', 'Environ 343 m/s', 'Environ 3 430 m/s', 'Environ 1 235 m/s'], 1, "Environ 343 m/s, soit à peu près 1 235 km/h. Dans l'eau, il va plus de quatre fois plus vite.", wiki('Vitesse_du_son')),
  q('hertz', 'sciences', 2, 'Quelle unité mesure une fréquence ?', ['Le watt', 'Le hertz', 'Le pascal', 'Le joule'], 1, "Un hertz correspond à un cycle par seconde. Le watt mesure une puissance, le pascal une pression, le joule une énergie.", wiki('Hertz')),
  q('ohm', 'sciences', 2, 'Quelle unité mesure la résistance électrique ?', ["L'ampère", 'Le volt', "L'ohm", 'Le coulomb'], 2, "L'ohm (Ω) porte le nom du physicien allemand Georg Simon Ohm.", wiki('Ohm')),
  q('curie', 'sciences', 2, 'Qui fut la première personne à recevoir deux prix Nobel ?', ['Albert Einstein', 'Marie Curie', 'Linus Pauling', 'Niels Bohr'], 1, "Marie Curie reçoit le prix Nobel de physique en 1903 puis celui de chimie en 1911.", wiki('Marie_Curie')),

  // --- Corps et cerveau
  q('os', 'corps', 2, "Combien d'os compte en général le squelette d'un adulte ?", ['106', '206', '306', '406'], 1, "Un nouveau-né en a davantage (environ 300) : beaucoup fusionnent pendant la croissance.", wiki('Squelette_humain')),
  q('chromosomes', 'corps', 2, 'Combien de chromosomes contient une cellule humaine ordinaire ?', ['23', '46', '48', '64'], 1, "23 paires, soit 46 chromosomes. Les ovules et les spermatozoïdes n'en portent que 23.", wiki('Chromosome')),
  q('insuline', 'corps', 2, "Quel organe produit l'insuline ?", ['Le foie', 'Le pancréas', 'Les reins', 'La rate'], 1, "Les cellules bêta des îlots de Langerhans, dans le pancréas, sécrètent l'insuline qui régule le taux de sucre dans le sang.", wiki('Insuline')),
  q('peau', 'corps', 1, 'Quel est le plus grand organe du corps humain ?', ['Le foie', 'Les poumons', 'La peau', "L'intestin"], 2, "Chez l'adulte, la peau couvre environ 2 m² et pèse plusieurs kilos.", wiki('Peau')),
  q('femur', 'corps', 1, 'Quel est le plus long os du corps humain ?', ['Le tibia', "L'humérus", 'Le fémur', 'La colonne vertébrale'], 2, "Le fémur, l'os de la cuisse, mesure environ un quart de la taille d'une personne.", wiki('Fémur')),
  q('hippocampe', 'corps', 3, 'Quelle structure du cerveau joue un rôle clé dans la formation de nouveaux souvenirs ?', ["L'hippocampe", 'Le cervelet', "L'hypothalamus", 'Le bulbe rachidien'], 0, "Le cas célèbre du patient H.M., opéré en 1953, a montré que sans hippocampe on ne forme plus de nouveaux souvenirs durables.", wiki('Hippocampe_(cerveau)')),
  q('neurones', 'corps', 3, 'Combien de neurones compte environ un cerveau humain ?', ['86 millions', '86 milliards', '86 000 milliards', '8,6 millions'], 1, "Une estimation de 2009 par comptage cellulaire donne environ 86 milliards de neurones.", wiki('Cerveau_humain')),

  // --- Géographie
  q('canberra', 'geographie', 2, "Quelle est la capitale de l'Australie ?", ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2, "Canberra a été choisie au début du XXe siècle comme compromis entre les deux rivales, Sydney et Melbourne.", wiki('Canberra')),
  q('ottawa', 'geographie', 2, 'Quelle est la capitale du Canada ?', ['Toronto', 'Montréal', 'Vancouver', 'Ottawa'], 3, "Ottawa, en Ontario, est la capitale fédérale depuis 1866.", wiki('Ottawa')),
  q('loire', 'geographie', 1, 'Quel est le plus long fleuve de France ?', ['La Seine', 'Le Rhône', 'La Loire', 'La Garonne'], 2, "Avec environ 1 000 km, la Loire est le plus long fleuve coulant entièrement en France.", wiki('Loire_(fleuve)')),
  q('pacifique', 'geographie', 1, 'Quel est le plus vaste océan du monde ?', ['Atlantique', 'Indien', 'Arctique', 'Pacifique'], 3, "Le Pacifique couvre environ un tiers de la surface du globe, plus que toutes les terres émergées réunies.", wiki('Océan_Pacifique')),
  q('everest', 'geographie', 1, 'Quel est le plus haut sommet du monde au-dessus du niveau de la mer ?', ['Le K2', "L'Everest", 'Le Kilimandjaro', 'Le mont Blanc'], 1, "L'Everest culmine à 8 849 m selon la mesure sino-népalaise de 2020.", wiki('Everest')),
  q('russie', 'geographie', 1, 'Quel est le plus grand pays du monde par sa superficie ?', ['Le Canada', 'La Chine', 'Les États-Unis', 'La Russie'], 3, "La Russie s'étend sur plus de 17 millions de km², près du double du Canada, deuxième.", wiki('Russie')),
  q('sahara', 'geographie', 1, 'Quel est le plus grand désert chaud du monde ?', ['Le Gobi', 'Le Sahara', "L'Atacama", 'Le Kalahari'], 1, "Le Sahara couvre environ 9 millions de km². Les déserts froids de l'Antarctique et de l'Arctique sont plus vastes.", wiki('Sahara')),
  q('pyrenees', 'geographie', 1, "Quelle chaîne de montagnes marque la frontière entre la France et l'Espagne ?", ['Les Alpes', 'Le Jura', 'Les Pyrénées', 'Les Vosges'], 2, "Les Pyrénées s'étendent sur environ 430 km, de l'Atlantique à la Méditerranée.", wiki('Pyrénées')),
  q('victoria', 'geographie', 2, "Quel est le plus grand lac d'Afrique ?", ['Le lac Tanganyika', 'Le lac Victoria', 'Le lac Malawi', 'Le lac Tchad'], 1, "Le lac Victoria, partagé entre l'Ouganda, le Kenya et la Tanzanie, est l'une des sources du Nil.", wiki('Lac_Victoria')),
  q('afrique-pays', 'geographie', 2, 'Quel continent compte le plus de pays ?', ["L'Asie", "L'Europe", "L'Afrique", "L'Amérique"], 2, "L'Afrique compte 54 États membres de l'ONU.", wiki('Afrique')),
  q('yen', 'geographie', 1, 'Quelle est la monnaie du Japon ?', ['Le won', 'Le yuan', 'Le yen', 'Le baht'], 2, "Le yen (¥) est la monnaie japonaise depuis 1871. Le won est coréen, le yuan chinois, le baht thaïlandais.", wiki('Yen')),
  q('prado', 'geographie', 2, 'Dans quelle ville se trouve le musée du Prado ?', ['Barcelone', 'Madrid', 'Séville', 'Lisbonne'], 1, "Ouvert en 1819, le Prado conserve notamment Les Ménines de Velázquez.", wiki('Musée_du_Prado')),

  // --- Histoire
  q('bastille', 'histoire', 1, 'En quelle année a eu lieu la prise de la Bastille ?', ['1789', '1792', '1799', '1815'], 0, "Le 14 juillet 1789. Sa date a été choisie pour la fête nationale en 1880.", wiki('Prise_de_la_Bastille')),
  q('mur-berlin', 'histoire', 1, 'En quelle année le mur de Berlin est-il tombé ?', ['1979', '1985', '1989', '1991'], 2, "Dans la nuit du 9 au 10 novembre 1989, les Berlinois franchissent les points de passage ouverts après une annonce confuse.", wiki('Chute_du_mur_de_Berlin')),
  q('de-gaulle', 'histoire', 1, 'Qui fut le premier président de la Ve République ?', ['Georges Pompidou', 'René Coty', 'Charles de Gaulle', 'Vincent Auriol'], 2, "Charles de Gaulle est élu en décembre 1958 et prend ses fonctions en janvier 1959. René Coty était le dernier président de la IVe.", wiki('Cinquième_République')),
  q('vote-femmes', 'histoire', 2, 'En quelle année les femmes ont-elles voté pour la première fois en France ?', ['1918', '1936', '1945', '1968'], 2, "Le droit de vote est accordé par l'ordonnance du 21 avril 1944 ; les Françaises votent pour la première fois aux municipales d'avril 1945.", wiki('Droit_de_vote_des_femmes_en_France')),
  q('traite-rome', 'histoire', 2, 'Quel traité a fondé la Communauté économique européenne en 1957 ?', ['Le traité de Maastricht', 'Le traité de Rome', 'Le traité de Lisbonne', 'Le traité de Versailles'], 1, "Signé le 25 mars 1957 par six pays, dont la France. Maastricht (1992) créera l'Union européenne.", wiki('Traité_de_Rome')),
  q('magellan', 'histoire', 2, 'Quelle expédition, partie en 1519, a réalisé le premier tour du monde ?', ['Celle de Christophe Colomb', 'Celle de Vasco de Gama', 'Celle de Magellan', 'Celle de James Cook'], 2, "Magellan meurt aux Philippines en 1521 ; Juan Sebastián Elcano ramène le navire Victoria en Espagne en 1522.", wiki('Fernand_de_Magellan')),
  q('gutenberg', 'histoire', 2, "Qui a développé l'imprimerie à caractères mobiles en Europe vers 1450 ?", ['Johannes Gutenberg', 'Léonard de Vinci', 'Érasme', 'Martin Luther'], 0, "À Mayence, Gutenberg combine caractères métalliques mobiles, encre grasse et presse : sa Bible est imprimée vers 1455.", wiki('Johannes_Gutenberg')),
  q('statue-liberte', 'histoire', 1, 'Quel pays a offert la statue de la Liberté aux États-Unis ?', ['Le Royaume-Uni', "L'Espagne", 'La France', "L'Italie"], 2, "Œuvre du sculpteur Auguste Bartholdi, avec une structure conçue par Gustave Eiffel, elle est inaugurée à New York en 1886.", wiki('Statue_de_la_Liberté')),
  q('jo-2024', 'histoire', 1, "Quelle ville a accueilli les Jeux olympiques d'été de 2024 ?", ['Los Angeles', 'Tokyo', 'Paris', 'Londres'], 2, "Paris accueillait les Jeux d'été pour la troisième fois, après 1900 et 1924.", wiki("Jeux_olympiques_d'été_de_2024")),

  // --- Culture
  q('joconde', 'culture', 1, 'Qui a peint La Joconde ?', ['Michel-Ange', 'Raphaël', 'Léonard de Vinci', 'Titien'], 2, "Léonard de Vinci la peint au début du XVIe siècle ; elle est exposée au Louvre.", wiki('La_Joconde')),
  q('guernica', 'culture', 1, 'Qui a peint « Guernica » en 1937 ?', ['Salvador Dalí', 'Pablo Picasso', 'Joan Miró', 'Henri Matisse'], 1, "Picasso réagit au bombardement de la ville basque de Guernica pendant la guerre d'Espagne.", wiki('Guernica_(Picasso)')),
  q('hymne-europe', 'culture', 2, "De quel compositeur vient la musique de l'hymne européen ?", ['Mozart', 'Beethoven', 'Bach', 'Haendel'], 1, "C'est l'« Ode à la joie », dernier mouvement de la 9e symphonie de Beethoven.", wiki('Hymne_européen')),
  q('miserables', 'culture', 1, 'Qui a écrit « Les Misérables » ?', ['Émile Zola', 'Honoré de Balzac', 'Victor Hugo', 'Alexandre Dumas'], 2, "Le roman paraît en 1862, pendant l'exil de Victor Hugo à Guernesey.", wiki('Les_Misérables')),
  q('etranger', 'culture', 2, "Qui est l'auteur de « L'Étranger », paru en 1942 ?", ['Jean-Paul Sartre', 'Albert Camus', 'André Malraux', 'Boris Vian'], 1, "Premier roman publié d'Albert Camus, prix Nobel de littérature en 1957.", wiki("L'Étranger")),
  q('vivaldi', 'culture', 1, 'Qui a composé « Les Quatre Saisons » ?', ['Vivaldi', 'Chopin', 'Debussy', 'Verdi'], 0, "Antonio Vivaldi publie ces quatre concertos pour violon en 1725.", wiki('Les_Quatre_Saisons')),
  q('pyramide-louvre', 'culture', 3, 'Quel architecte a conçu la pyramide du Louvre ?', ['Jean Nouvel', 'Ieoh Ming Pei', 'Renzo Piano', 'Le Corbusier'], 1, "L'architecte sino-américain I. M. Pei ; la pyramide est inaugurée en 1989.", wiki('Pyramide_du_Louvre')),
  q('nemo', 'culture', 1, 'Quel écrivain a créé le capitaine Nemo ?', ['Jules Verne', 'Alexandre Dumas', 'H. G. Wells', 'Victor Hugo'], 0, "Nemo commande le Nautilus dans « Vingt Mille Lieues sous les mers » (1869-1870).", wiki('Capitaine_Nemo')),
  q('football', 'culture', 1, "Combien de joueurs une équipe de football aligne-t-elle sur le terrain ?", ['9', '10', '11', '12'], 2, "Onze joueurs par équipe, gardien compris, selon les lois du jeu.", wiki('Football')),

  // --- Nature
  q('pieuvre', 'nature', 2, "Combien de cœurs possède une pieuvre ?", ['Un', 'Deux', 'Trois', 'Huit'], 2, "Deux cœurs envoient le sang vers les branchies, un troisième vers le reste du corps.", wiki('Octopoda')),
  q('baleine-bleue', 'nature', 1, "Quel est le plus grand animal connu ayant jamais vécu ?", ['Le mégalodon', 'La baleine bleue', 'Le diplodocus', 'Le cachalot'], 1, "La baleine bleue peut dépasser 25 mètres et 100 tonnes.", wiki('Baleine_bleue')),
  q('araignee', 'nature', 1, "Combien de pattes a une araignée ?", ['Six', 'Huit', 'Dix', 'Douze'], 1, "Les araignées sont des arachnides : huit pattes, contre six pour les insectes.", wiki('Araignée')),
  q('cellule', 'nature', 1, "Quelle est l'unité de base de tout être vivant ?", ["L'atome", 'La cellule', 'Le gène', "L'organe"], 1, "Tout organisme vivant est composé d'une ou de plusieurs cellules.", wiki('Cellule_(biologie)')),
  q('annee', 'nature', 1, 'Combien de temps la Terre met-elle environ pour faire le tour du Soleil ?', ['24 heures', '30 jours', '365,25 jours', '1 000 jours'], 2, "Ce quart de jour en plus explique l'ajout d'un 29 février presque tous les quatre ans.", wiki('Année_bissextile')),

  // --- Technologie
  q('web', 'technologie', 2, 'Qui a proposé le World Wide Web au CERN en 1989 ?', ['Bill Gates', 'Tim Berners-Lee', 'Vinton Cerf', 'Steve Jobs'], 1, "Le chercheur britannique Tim Berners-Lee imagine un système de documents reliés par des liens hypertextes.", wiki('World_Wide_Web')),
  q('http', 'technologie', 3, 'Que signifie le sigle HTTP ?', ['High Transfer Text Process', 'HyperText Transfer Protocol', 'Host Terminal Transfer Program', 'HyperText Transmission Page'], 1, "C'est le protocole qui permet à un navigateur de demander des pages à un serveur web.", wiki('Hypertext_Transfer_Protocol')),
  q('javascript', 'technologie', 2, 'Quel langage de programmation, créé en 1995, est exécuté par tous les navigateurs web ?', ['Java', 'Python', 'JavaScript', 'C++'], 2, "Créé par Brendan Eich chez Netscape. Malgré son nom, il n'a presque rien à voir avec Java.", wiki('JavaScript')),
  q('octet', 'technologie', 1, "Combien de bits contient un octet ?", ['4', '8', '10', '16'], 1, "Un octet regroupe 8 bits, ce qui permet 256 valeurs différentes.", wiki('Octet')),

  // --- Langue
  q('robot', 'langue', 2, 'De quelle langue vient le mot « robot » ?', ["De l'anglais", 'Du tchèque', 'Du japonais', "De l'allemand"], 1, "Il apparaît en 1920 dans la pièce R.U.R. de Karel Čapek, à partir du tchèque robota, la corvée.", wiki('Robot')),
  q('mandarin', 'langue', 2, 'Quelle langue compte le plus de locuteurs natifs dans le monde ?', ["L'anglais", "L'espagnol", 'Le chinois mandarin', "L'hindi"], 2, "Le mandarin est la première langue maternelle mondiale ; l'anglais est la plus parlée si l'on compte les locuteurs non natifs.", wiki('Liste_de_langues_par_nombre_total_de_locuteurs')),
]
