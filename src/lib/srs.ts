/**
 * Révision espacée minimale (système de Leitner à 5 boîtes).
 * - Erreur : retour en boîte 1, à revoir le lendemain.
 * - Bonne réponse : boîte suivante ; intervalle 1, 3, 7, 14, 30 jours.
 */
import type { SrsEntry } from './store'
import { dayKey } from './random'

export const INTERVALS = [1, 3, 7, 14, 30] as const

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function nextEntry(prev: SrsEntry | undefined, correct: boolean, now: Date = new Date()): SrsEntry {
  if (!correct) {
    return { box: 1, due: dayKey(addDays(now, 1)), wrong: (prev?.wrong ?? 0) + 1, seen: (prev?.seen ?? 0) + 1 }
  }
  if (!prev) {
    // Réussi du premier coup : on le revoit beaucoup plus tard.
    return { box: 3, due: dayKey(addDays(now, INTERVALS[2])), wrong: 0, seen: 1 }
  }
  const box = Math.min(5, prev.box + 1)
  return { box, due: dayKey(addDays(now, INTERVALS[box - 1] ?? 30)), wrong: prev.wrong, seen: prev.seen + 1 }
}

/** Identifiants à réviser aujourd'hui : déjà ratés au moins une fois, échéance passée. */
export function dueIds(srs: Record<string, SrsEntry>, now: Date = new Date()): string[] {
  const today = dayKey(now)
  return Object.entries(srs)
    .filter(([, e]) => e.wrong > 0 && e.due <= today)
    .sort((a, b) => a[1].box - b[1].box || a[1].due.localeCompare(b[1].due))
    .map(([id]) => id)
}
