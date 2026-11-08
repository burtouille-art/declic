/**
 * « Une question qui fait réfléchir » : problèmes classiques de psychologie cognitive
 * et de raisonnement, où l'intuition se trompe souvent. On répond AVANT l'explication.
 */
import type { z } from 'zod'
import { type reflectionSchema, wiki, wikiEn } from './types'

type R = z.input<typeof reflectionSchema>

export const REFLECTIONS: R[] = [
  {
    id: 'r-batte', prompt: "Une batte et une balle coûtent 1,10 € au total. La batte coûte 1 € de plus que la balle. Combien coûte la balle ?",
    options: ['10 centimes', '5 centimes', '1 centime'], answer: 1,
    explanation: "La réponse intuitive, 10 centimes, est fausse : la batte coûterait alors 1,10 € et le total 1,20 €. Avec une balle à 5 centimes, la batte coûte 1,05 € et le total fait bien 1,10 €. Ce problème vient du « test de réflexion cognitive » de Shane Frederick (2005) : il mesure notre capacité à nous méfier d'une première réponse trop rapide.",
    recall: { prompt: 'Dans le problème de la batte et de la balle, combien coûtait la balle ?', options: ['10 centimes', '5 centimes', '1 €'], answer: 1 },
    source: wikiEn('Cognitive_reflection_test'),
  },
  {
    id: 'r-nenuphars', prompt: "Un nénuphar double de surface chaque jour. Il lui faut 48 jours pour couvrir tout un lac. En combien de jours couvre-t-il la moitié du lac ?",
    options: ['24 jours', '47 jours', '36 jours'], answer: 1,
    explanation: "47 jours : puisqu'il double chaque jour, la veille du jour où le lac est couvert, il en occupait la moitié. Les croissances exponentielles déroutent notre intuition, qui raisonne volontiers de façon proportionnelle.",
    recall: { prompt: 'Le nénuphar couvre la moitié du lac…', options: ['à mi-parcours', 'la veille de couvrir tout le lac', 'au premier jour'], answer: 1 },
    source: wikiEn('Cognitive_reflection_test'),
  },
  {
    id: 'r-monty-hall', prompt: "Un jeu télévisé : trois portes, une voiture derrière l'une d'elles. Tu choisis la porte 1. L'animateur, qui sait où est la voiture, ouvre la porte 3 : une chèvre. Vaut-il mieux changer pour la porte 2 ?",
    options: ['Oui, changer augmente mes chances', 'Non, c’est du 50/50', 'Non, il vaut mieux garder'], answer: 0,
    explanation: "Changer fait gagner 2 fois sur 3. Ton premier choix avait 1 chance sur 3 d'être bon ; l'animateur ne choisit pas au hasard (il évite toujours la voiture), donc les 2 chances sur 3 restantes se reportent sur l'autre porte fermée. C'est le problème de Monty Hall, qui a piégé jusqu'à des mathématiciens.",
    recall: { prompt: 'Au problème de Monty Hall, changer de porte fait gagner…', options: ['1 fois sur 2', '2 fois sur 3', '1 fois sur 3'], answer: 1 },
    source: wiki('Problème_de_Monty_Hall'),
  },
  {
    id: 'r-anniversaires', prompt: "Dans une classe de 23 élèves, quelle est la probabilité qu'au moins deux d'entre eux aient le même jour d'anniversaire ?",
    options: ['Environ 6 %', 'Environ 25 %', 'Environ 50 %'], answer: 2,
    explanation: "Environ 50 %. On pense spontanément à sa propre date, mais ce qui compte, c'est le nombre de paires possibles : avec 23 personnes, il y en a 253. Avec 57 personnes, la probabilité dépasse 99 %. C'est le paradoxe des anniversaires.",
    recall: { prompt: "À partir de combien de personnes a-t-on environ une chance sur deux d'avoir deux anniversaires identiques ?", options: ['23', '183', '365'], answer: 0 },
    source: wiki('Paradoxe_des_anniversaires'),
  },
  {
    id: 'r-machines', prompt: "Si 5 machines fabriquent 5 objets en 5 minutes, combien de temps faut-il à 100 machines pour fabriquer 100 objets ?",
    options: ['100 minutes', '5 minutes', '20 minutes'], answer: 1,
    explanation: "5 minutes : chaque machine fabrique un objet en 5 minutes. 100 machines en fabriquent donc 100 dans le même temps. La symétrie des chiffres pousse à répondre 100.",
    recall: { prompt: '100 machines pour 100 objets : combien de minutes ?', options: ['5', '20', '100'], answer: 0 },
    source: wikiEn('Cognitive_reflection_test'),
  },
  {
    id: 'r-faux-positifs', prompt: "Une maladie touche 1 personne sur 1 000. Un test la détecte toujours, mais se trompe chez 5 % des personnes saines. Ton test est positif. Quelle est la probabilité que tu sois malade ?",
    options: ['Environ 95 %', 'Environ 50 %', 'Environ 2 %'], answer: 2,
    explanation: "Environ 2 %. Sur 1 000 personnes, 1 est malade (test positif) et environ 50 personnes saines ont aussi un test positif (5 % de 999). Parmi environ 51 positifs, un seul est malade. Oublier la rareté de la maladie, c'est l'« oubli de la fréquence de base ».",
    recall: { prompt: "Comment s'appelle l'erreur qui consiste à oublier la rareté d'un phénomène ?", options: ["L'oubli de la fréquence de base", "L'effet Stroop", 'Le biais du survivant'], answer: 0 },
    source: wiki('Oubli_de_la_fréquence_de_base'),
  },
  {
    id: 'r-avions', prompt: "Pendant la Seconde Guerre mondiale, on étudie les impacts de balles sur les bombardiers qui rentrent de mission. Où faut-il ajouter du blindage ?",
    options: ['Là où il y a le plus d’impacts', 'Là où il n’y a presque pas d’impacts', 'Partout de manière égale'], answer: 1,
    explanation: "Là où il n'y a pas d'impacts. Le statisticien Abraham Wald fait remarquer que les avions étudiés sont ceux qui sont revenus : ceux touchés aux zones intactes (moteurs, par exemple) ne sont pas rentrés. C'est le « biais du survivant » : on ne voit que ce qui a passé le filtre.",
    recall: { prompt: 'Le raisonnement d’Abraham Wald sur les avions illustre…', options: ['le biais du survivant', 'la loi des grands nombres', "l'effet placebo"], answer: 0 },
    source: wiki('Biais_du_survivant'),
  },
  {
    id: 'r-papier', prompt: "Une feuille de papier fait 0,1 mm d'épaisseur. Si l'on pouvait la plier en deux 42 fois, quelle serait l'épaisseur du paquet ?",
    options: ['Environ 4 mètres', 'Environ 400 km', 'Environ 400 000 km'], answer: 2,
    explanation: "Environ 440 000 km, plus que la distance Terre-Lune (environ 384 000 km). Chaque pliage double l'épaisseur : 0,1 mm × 2⁴² ≈ 440 000 km. En pratique, on ne peut pas plier une feuille plus d'une douzaine de fois, mais le calcul montre la puissance des doublements.",
    recall: { prompt: "Une feuille pliée 42 fois atteindrait environ…", options: ['la hauteur de la tour Eiffel', 'la distance Terre-Lune', "l'épaisseur d'un livre"], answer: 1 },
    source: wiki('Fonction_exponentielle'),
  },
]
