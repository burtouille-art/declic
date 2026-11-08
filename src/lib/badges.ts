import type { AppState } from './store'
import { dayKey } from './random'

/** Jours consécutifs de Déclic terminé, en comptant aujourd'hui ou, à défaut, hier. */
export function streak(declic: AppState['declic'], now = new Date()): number {
  const d = new Date(now)
  if (!declic[dayKey(d)]?.completed) d.setDate(d.getDate() - 1)
  let n = 0
  while (declic[dayKey(d)]?.completed) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export type Badge = { id: string; title: string; hint: string; test: (s: AppState) => boolean }

/** Des repères de progression, pas une compétition : aucun classement, aucune comparaison. */
export const BADGES: Badge[] = [
  { id: 'premier-declic', title: 'Premier déclic', hint: 'Terminer un Déclic du jour.', test: (s) => Object.values(s.declic).some((d) => d.completed) },
  { id: 'trois-jours', title: 'Trois jours de suite', hint: 'Faire le Déclic trois jours consécutifs.', test: (s) => streak(s.declic) >= 3 },
  { id: 'une-semaine', title: 'Une semaine de curiosité', hint: 'Sept Déclic d’affilée.', test: (s) => streak(s.declic) >= 7 },
  { id: 'curieux', title: 'Esprit curieux', hint: 'Révéler 10 découvertes.', test: (s) => s.discovered.length >= 10 },
  { id: 'encyclopediste', title: 'Encyclopédiste', hint: 'Terminer 5 fiches.', test: (s) => s.learned.length >= 5 },
  { id: 'sans-faute', title: 'Sans faute', hint: 'Obtenir 10/10 au quiz.', test: (s) => (s.scores['quiz-du-jour']?.best ?? 0) >= 10 || (s.scores['quiz-libre']?.best ?? 0) >= 10 },
  { id: 'chronologiste', title: 'Maître du temps', hint: 'Une chronologie parfaite.', test: (s) => (s.scores['chronologie']?.best ?? 0) >= 5 },
  { id: 'globe-trotter', title: 'Globe-trotter', hint: 'Trouver 20 pays différents dans le Grand voyage.', test: (s) => s.countriesFound.length >= 20 },
  { id: 'lecteur', title: 'Lecteur assidu', hint: 'Ouvrir 20 articles.', test: (s) => s.history.filter((h) => h.type === 'article').length >= 20 },
  { id: 'rapide', title: 'Réflexes', hint: '15 bonnes réponses au défi des 60 secondes.', test: (s) => (s.scores['60-secondes']?.best ?? 0) >= 15 },
]

export function earnedBadgeIds(s: AppState): string[] {
  return BADGES.filter((b) => b.test(s)).map((b) => b.id)
}
