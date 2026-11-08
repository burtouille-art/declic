/**
 * Stockage local (aucun compte, aucune donnée envoyée).
 * Un seul objet versionné dans localStorage, lu/écrit avec try/catch :
 * en navigation privée ou si le stockage est bloqué, le site fonctionne en mémoire.
 */
import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { dayKey } from './random'

const KEY = 'declic:v1'

export const CATEGORY_IDS = [
  'monde', 'france', 'societe', 'sciences', 'technologie', 'ia', 'espace', 'histoire',
  'economie', 'environnement', 'sante', 'culture', 'sport', 'insolite',
] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

const savedItem = z.object({
  id: z.string(),
  type: z.enum(['article', 'decouverte', 'fiche']),
  title: z.string(),
  url: z.string().optional(),
  meta: z.string().optional(),
  at: z.string(),
})
export type SavedItem = z.infer<typeof savedItem>

const srsEntry = z.object({ box: z.number().int().min(1).max(5), due: z.string(), wrong: z.number().int(), seen: z.number().int() })
export type SrsEntry = z.infer<typeof srsEntry>

const gameScore = z.object({ best: z.number(), last: z.number(), plays: z.number().int(), total: z.number().optional() })

const declicDay = z.object({
  step: z.number().int().min(0).max(5),
  completed: z.boolean(),
  score: z.number().int().min(0).max(4),
  answers: z.record(z.string(), z.number()),
})
export type DeclicDay = z.infer<typeof declicDay>

export const stateSchema = z.object({
  version: z.literal(1),
  prefs: z.object({
    categories: z.array(z.enum(CATEGORY_IDS)),
    lang: z.enum(['fr', 'all']),
    theme: z.enum(['system', 'light', 'dark']),
    /** vrai quand le visiteur a choisi lui-même son apparence (sinon : clair par défaut) */
    themeChosen: z.boolean().optional(),
    onboarded: z.boolean(),
  }),
  favorites: z.array(savedItem),
  history: z.array(savedItem),
  scores: z.record(z.string(), gameScore),
  badges: z.record(z.string(), z.string()),
  discovered: z.array(z.string()),
  learned: z.array(z.string()),
  srs: z.record(z.string(), srsEntry),
  declic: z.record(z.string(), declicDay),
  countriesFound: z.array(z.string()),
})
export type AppState = z.infer<typeof stateSchema>

export const defaultState = (): AppState => ({
  version: 1,
  prefs: { categories: ['sciences', 'espace', 'histoire'], lang: 'all', theme: 'light', onboarded: false },
  favorites: [],
  history: [],
  scores: {},
  badges: {},
  discovered: [],
  learned: [],
  srs: {},
  declic: {},
  countriesFound: [],
})

/** Depuis la v1.2, le site est clair par défaut : l'ancien réglage implicite « Automatique » devient « Clair ». */
function migrate(s: AppState): AppState {
  if (s.prefs.theme === 'system' && !s.prefs.themeChosen) return { ...s, prefs: { ...s.prefs, theme: 'light' } }
  return s
}

function read(): AppState {
  return migrate(readRaw())
}

function readRaw(): AppState {
  try {
    const raw = globalThis.localStorage?.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = stateSchema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
    // Données partiellement invalides : on garde ce qui est récupérable.
    const base = defaultState()
    const obj = JSON.parse(raw) as Record<string, unknown>
    for (const key of Object.keys(base) as (keyof AppState)[]) {
      const field = stateSchema.shape[key].safeParse(obj[key])
      if (field.success) (base as Record<string, unknown>)[key] = field.data
    }
    return base
  } catch {
    return defaultState()
  }
}

let state: AppState = read()
const listeners = new Set<() => void>()

function persist() {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state))
  } catch {
    /* stockage plein ou bloqué : on reste en mémoire */
  }
}

export function getState(): AppState {
  return state
}

export function setState(updater: (s: AppState) => AppState) {
  state = updater(state)
  persist()
  listeners.forEach((l) => l())
}

export function resetState() {
  state = defaultState()
  persist()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  // Synchronisation entre onglets
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = read()
      listeners.forEach((l) => l())
    }
  })
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}

/* ---------- actions ---------- */

export const actions = {
  toggleFavorite(item: Omit<SavedItem, 'at'>) {
    setState((s) => {
      const exists = s.favorites.some((f) => f.id === item.id)
      return {
        ...s,
        favorites: exists ? s.favorites.filter((f) => f.id !== item.id) : [{ ...item, at: new Date().toISOString() }, ...s.favorites].slice(0, 300),
      }
    })
  },
  addHistory(item: Omit<SavedItem, 'at'>) {
    setState((s) => ({
      ...s,
      history: [{ ...item, at: new Date().toISOString() }, ...s.history.filter((h) => h.id !== item.id)].slice(0, 200),
    }))
  },
  clearHistory() {
    setState((s) => ({ ...s, history: [] }))
  },
  markDiscovered(id: string) {
    setState((s) => (s.discovered.includes(id) ? s : { ...s, discovered: [...s.discovered, id] }))
  },
  markLearned(id: string) {
    setState((s) => (s.learned.includes(id) ? s : { ...s, learned: [...s.learned, id] }))
  },
  recordScore(game: string, score: number, total?: number) {
    setState((s) => {
      const prev = s.scores[game]
      return {
        ...s,
        scores: {
          ...s.scores,
          [game]: { best: Math.max(prev?.best ?? 0, score), last: score, plays: (prev?.plays ?? 0) + 1, total },
        },
      }
    })
  },
  setPrefs(patch: Partial<AppState['prefs']>) {
    setState((s) => ({ ...s, prefs: { ...s.prefs, ...patch, ...(patch.theme ? { themeChosen: true } : {}) } }))
    if (patch.theme) applyTheme(patch.theme)
  },
  setDeclic(key: string, patch: Partial<DeclicDay>) {
    setState((s) => {
      const prev = s.declic[key] ?? { step: 0, completed: false, score: 0, answers: {} }
      return { ...s, declic: { ...s.declic, [key]: { ...prev, ...patch } } }
    })
  },
  addCountryFound(id: string) {
    setState((s) => (s.countriesFound.includes(id) ? s : { ...s, countriesFound: [...s.countriesFound, id] }))
  },
  grantBadges(ids: string[]) {
    setState((s) => {
      const fresh = ids.filter((id) => !s.badges[id])
      if (!fresh.length) return s
      const badges = { ...s.badges }
      for (const id of fresh) badges[id] = dayKey()
      return { ...s, badges }
    })
  },
  updateSrs(id: string, entry: SrsEntry) {
    setState((s) => ({ ...s, srs: { ...s.srs, [id]: entry } }))
  },
}

export function applyTheme(theme: AppState['prefs']['theme']) {
  if (typeof document === 'undefined') return
  // « Automatique » suit le réglage du téléphone ; sinon, thème explicite (clair par défaut).
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
}
