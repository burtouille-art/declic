/** Logique pure des jeux (testée unitairement dans src/lib/gameLogic.test.ts). */
import { COUNTRIES, EVENTS, type Country, type HistoryEvent } from '../content'
import { mulberry32, seededShuffle } from './random'

/** Chronologie : n événements d'années distinctes, espacés d'au moins `gap` ans. */
export function drawChronology(seed: number, n = 5, gap = 8): HistoryEvent[] {
  const pool = seededShuffle(EVENTS, seed)
  const out: HistoryEvent[] = []
  for (const e of pool) {
    if (out.every((o) => Math.abs(o.year - e.year) >= gap)) out.push(e)
    if (out.length === n) break
  }
  return seededShuffle(out, seed + 1)
}

export function scoreOrder(order: HistoryEvent[]): number {
  const sorted = [...order].sort((a, b) => a.year - b.year)
  return order.filter((e, i) => sorted[i]?.id === e.id).length
}

export type VoyageMode = 'pays' | 'capitale' | 'trouver'
export type Region = 'monde' | Country['continent']

export type VoyageRound = {
  target: Country
  /** 4 propositions (pays), dont la cible */
  choices: Country[]
  mode: VoyageMode
}

/** Manches du Grand voyage : distracteurs pris dans la même région, sans doublon de cible. */
export function buildVoyageRounds(mode: VoyageMode, region: Region, seed: number, n = 10): VoyageRound[] {
  const rng = mulberry32(seed)
  const inRegion = COUNTRIES.filter((c) => region === 'monde' || c.continent === region || (region === 'asie' && c.continent === 'oceanie'))
  const eligible = mode === 'capitale' ? inRegion.filter((c) => c.capital) : inRegion
  const targets = seededShuffle(eligible, seed).slice(0, n)
  return targets.map((target) => {
    const sameRegion = eligible.filter((c) => c.id !== target.id && (region !== 'monde' || c.continent === target.continent))
    const others = seededShuffle(sameRegion.length >= 3 ? sameRegion : eligible.filter((c) => c.id !== target.id), Math.floor(rng() * 1e9)).slice(0, 3)
    return { target, mode, choices: seededShuffle([target, ...others], Math.floor(rng() * 1e9)) }
  })
}
