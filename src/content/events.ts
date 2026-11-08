import type { z } from 'zod'
import { type eventSchema, type Source, wiki } from './types'

type E = z.input<typeof eventSchema>
type Era = E['era']
const e = (id: string, year: number, era: Era, label: string, detail: string, source: Source): E => ({ id: `ev-${id}`, year, era, label, detail, source })

/** Années négatives = avant notre ère. Dates retenues : celles qui font consensus dans les sources citées. */
export const EVENTS: E[] = [
  e('kheops', -2560, 'antiquite', 'Achèvement présumé de la pyramide de Khéops', "Datation habituelle, vers 2560 avant notre ère. Elle restera la plus haute construction humaine pendant près de 4 000 ans.", wiki('Pyramide_de_Khéops')),
  e('rome', -753, 'antiquite', 'Fondation légendaire de Rome', "Date transmise par la tradition antique (Varron), associée au mythe de Romulus et Rémus.", wiki('Fondation_de_Rome')),
  e('cesar', -44, 'antiquite', 'Assassinat de Jules César', "Poignardé aux ides de mars par des sénateurs, dont Brutus.", wiki('Assassinat_de_Jules_César')),
  e('romulus-augustule', 476, 'antiquite', "Fin de l'Empire romain d'Occident", "Le dernier empereur d'Occident, Romulus Augustule, est déposé par Odoacre.", wiki('Romulus_Augustule')),
  e('charlemagne', 800, 'moyen-age', 'Couronnement de Charlemagne', "Le pape Léon III le couronne empereur à Rome le jour de Noël.", wiki('Charlemagne')),
  e('hastings', 1066, 'moyen-age', "Bataille d'Hastings", "Guillaume, duc de Normandie, bat le roi anglais Harold et devient Guillaume le Conquérant.", wiki("Bataille_d'Hastings")),
  e('magna-carta', 1215, 'moyen-age', 'Signature de la Magna Carta', "Le roi Jean sans Terre accepte de limiter son pouvoir face aux barons anglais.", wiki('Magna_Carta')),
  e('peste', 1347, 'moyen-age', 'Arrivée de la peste noire en Europe', "L'épidémie atteint les ports méditerranéens fin 1347 et tue en quelques années entre un tiers et la moitié des Européens.", wiki('Peste_noire')),
  e('constantinople', 1453, 'moyen-age', 'Prise de Constantinople par les Ottomans', "Mehmed II s'empare de la ville le 29 mai : fin de l'Empire byzantin.", wiki('Chute_de_Constantinople')),
  e('colomb', 1492, 'moderne', 'Christophe Colomb atteint les Amériques', "Le 12 octobre, l'expédition débarque aux Bahamas.", wiki('Christophe_Colomb')),
  e('luther', 1517, 'moderne', 'Les 95 thèses de Martin Luther', "Point de départ traditionnel de la Réforme protestante.", wiki('Réforme_protestante')),
  e('galilee', 1610, 'moderne', 'Galilée publie ses observations des lunes de Jupiter', "Dans le Sidereus Nuncius, il décrit quatre satellites de Jupiter vus à la lunette.", wiki('Sidereus_nuncius')),
  e('principia', 1687, 'moderne', 'Newton publie les Principia', "La gravitation universelle explique à la fois la chute des pommes et l'orbite de la Lune.", wiki('Philosophiæ_Naturalis_Principia_Mathematica')),
  e('independance-us', 1776, 'moderne', "Déclaration d'indépendance des États-Unis", "Adoptée le 4 juillet par le Congrès continental.", wiki("Déclaration_d'indépendance_des_États-Unis")),
  e('bastille', 1789, 'moderne', 'Prise de la Bastille', "Le 14 juillet, la forteresse parisienne tombe : symbole du début de la Révolution française.", wiki('Prise_de_la_Bastille')),
  e('sacre-napoleon', 1804, 'xixe', 'Sacre de Napoléon Ier', "Le 2 décembre, à Notre-Dame de Paris.", wiki('Sacre_de_Napoléon_Ier')),
  e('waterloo', 1815, 'xixe', 'Bataille de Waterloo', "Défaite définitive de Napoléon, le 18 juin, en Belgique actuelle.", wiki('Bataille_de_Waterloo')),
  e('abolition', 1848, 'xixe', "Abolition de l'esclavage dans les colonies françaises", "Décret du 27 avril 1848, porté par Victor Schœlcher.", wiki("Abolition_de_l'esclavage_en_France")),
  e('origine-especes', 1859, 'xixe', "Darwin publie L'Origine des espèces", "La théorie de l'évolution par sélection naturelle est exposée au grand public.", wiki("L'Origine_des_espèces")),
  e('freres-wright', 1903, 'contemporain', 'Premier vol motorisé des frères Wright', "Le 17 décembre, à Kitty Hawk : 12 secondes et 37 mètres pour le premier vol.", wiki('Frères_Wright')),
  e('ww1', 1914, 'contemporain', 'Début de la Première Guerre mondiale', "L'Allemagne déclare la guerre à la France le 3 août.", wiki('Première_Guerre_mondiale')),
  e('revolution-octobre', 1917, 'contemporain', "Révolution d'Octobre en Russie", "Les bolcheviks prennent le pouvoir à Petrograd.", wiki("Révolution_d'Octobre")),
  e('armistice', 1918, 'contemporain', 'Armistice de la Première Guerre mondiale', "Signé à Rethondes, il entre en vigueur le 11 novembre à 11 heures.", wiki('Armistice_de_1918')),
  e('penicilline', 1928, 'contemporain', 'Découverte de la pénicilline', "Alexander Fleming observe l'effet antibactérien d'une moisissure.", wiki('Pénicilline')),
  e('ww2', 1939, 'contemporain', 'Début de la Seconde Guerre mondiale', "L'Allemagne envahit la Pologne le 1er septembre.", wiki('Seconde_Guerre_mondiale')),
  e('debarquement', 1944, 'contemporain', 'Débarquement en Normandie', "Le 6 juin, opération Overlord.", wiki('Débarquement_de_Normandie')),
  e('vote-femmes', 1945, 'contemporain', 'Premier vote des Françaises', "Aux élections municipales d'avril 1945.", wiki('Droit_de_vote_des_femmes_en_France')),
  e('ddh', 1948, 'contemporain', 'Déclaration universelle des droits de l’homme', "Adoptée par l'ONU à Paris le 10 décembre.", wiki("Déclaration_universelle_des_droits_de_l'homme")),
  e('adn', 1953, 'contemporain', "Publication de la structure en double hélice de l'ADN", "Article de Watson et Crick dans Nature, appuyé sur les travaux de Rosalind Franklin.", wiki('Acide_désoxyribonucléique')),
  e('spoutnik', 1957, 'contemporain', 'Lancement de Spoutnik 1', "Premier satellite artificiel, lancé par l'URSS le 4 octobre.", wiki('Spoutnik_1')),
  e('gagarine', 1961, 'contemporain', 'Iouri Gagarine, premier humain dans l’espace', "Le 12 avril, un tour de la Terre en 108 minutes environ.", wiki('Iouri_Gagarine')),
  e('apollo11', 1969, 'contemporain', 'Premiers pas sur la Lune', "Neil Armstrong et Buzz Aldrin, mission Apollo 11.", wiki('Apollo_11')),
  e('mur-berlin', 1989, 'contemporain', 'Chute du mur de Berlin', "Dans la nuit du 9 au 10 novembre.", wiki('Chute_du_mur_de_Berlin')),
  e('mandela', 1994, 'contemporain', 'Nelson Mandela élu président de l’Afrique du Sud', "Premières élections au suffrage universel sans distinction raciale.", wiki('Nelson_Mandela')),
  e('euro', 2002, 'contemporain', "Mise en circulation des pièces et billets en euros", "Le 1er janvier, dans douze pays dont la France.", wiki('Euro')),
  e('iphone', 2007, 'contemporain', 'Présentation du premier iPhone', "Annoncé par Steve Jobs en janvier, commercialisé en juin aux États-Unis.", wiki('IPhone_(1re_génération)')),
  e('higgs', 2012, 'contemporain', 'Annonce de la découverte du boson de Higgs', "Le 4 juillet, au CERN, par les expériences ATLAS et CMS.", wiki('Boson_de_Higgs')),
  e('trou-noir', 2019, 'contemporain', "Première image d'un trou noir", "Le télescope Event Horizon dévoile l'ombre du trou noir de la galaxie M87.", wiki('Event_Horizon_Telescope')),
]
