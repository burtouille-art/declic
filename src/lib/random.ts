/** Générateurs déterministes : la même date donne la même sélection pour tout le monde. */

export function hashString(input: string): number {
  // FNV-1a 32 bits
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], seed: number | string): T[] {
  const rng = mulberry32(typeof seed === 'string' ? hashString(seed) : seed)
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

export function shuffle<T>(items: readonly T[]): T[] {
  return seededShuffle(items, Math.floor(Math.random() * 2 ** 32))
}

export function pickRandom<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)]
}

/** Date locale au format AAAA-MM-JJ (le « jour » du lecteur, pas l'UTC). */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Nombre de jours depuis une époque fixe (2026-01-01), pour les rotations. */
export function dayIndex(date: Date = new Date()): number {
  const epoch = Date.UTC(2026, 0, 1)
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((today - epoch) / 86_400_000)
}

/**
 * Rotation sans répétition : la banque est mélangée une fois (graine fixe), puis
 * chaque jour prend la tranche suivante. Aucun élément ne revient avant que
 * toute la banque ait été parcourue.
 */
export function dailySlice<T>(bank: readonly T[], size: number, date: Date = new Date(), salt = 'declic'): T[] {
  if (bank.length === 0) return []
  const order = seededShuffle(bank, `${salt}:order`)
  const n = Math.min(size, order.length)
  const start = (((dayIndex(date) * n) % order.length) + order.length) % order.length
  const out: T[] = []
  for (let i = 0; i < n; i++) out.push(order[(start + i) % order.length] as T)
  return out
}

export function dailyPick<T>(bank: readonly T[], date: Date = new Date(), salt = 'pick'): T | undefined {
  return dailySlice(bank, 1, date, salt)[0]
}
