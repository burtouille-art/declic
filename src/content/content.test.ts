import { describe, expect, it } from 'vitest'
import world from 'world-atlas/countries-110m.json'
import { COUNTRIES, DISCOVERIES, EVENTS, FICHE_BY_ID, FICHES, PATHS, QUESTIONS, REFLECTIONS, STATEMENTS } from '.'

const unique = (xs: string[]) => new Set(xs).size === xs.length

describe('banques de contenus', () => {
  it('ont des identifiants uniques', () => {
    for (const bank of [QUESTIONS, STATEMENTS, EVENTS, DISCOVERIES, FICHES, REFLECTIONS]) {
      expect(unique(bank.map((x) => x.id))).toBe(true)
    }
  })

  it('questions : 4 options distinctes, une bonne réponse, une source https', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(60)
    for (const q of QUESTIONS) {
      expect(unique(q.options), q.id).toBe(true)
      expect(q.options[q.answer], q.id).toBeTruthy()
      expect(q.source.url.startsWith('https://'), q.id).toBe(true)
    }
  })

  it('vrai/faux : équilibre raisonnable entre vrai et faux', () => {
    const trues = STATEMENTS.filter((s) => s.answer).length
    expect(trues / STATEMENTS.length).toBeGreaterThan(0.35)
    expect(trues / STATEMENTS.length).toBeLessThan(0.65)
  })

  it('chronologie : assez d’événements et pas deux fois la même année pour le même libellé', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(30)
    expect(unique(EVENTS.map((e) => `${e.year}-${e.label}`))).toBe(true)
  })

  it('découvertes : question d’intuition et rappel cohérents', () => {
    for (const d of DISCOVERIES) {
      if (d.teaser) expect(d.teaser.options[d.teaser.answer], d.id).toBeTruthy()
      expect(d.recall.options[d.recall.answer], d.id).toBeTruthy()
      expect(unique(d.recall.options), d.id).toBe(true)
    }
  })

  it('fiches : vérification valide, liens internes existants, parcours complets', () => {
    for (const f of FICHES) {
      expect(f.check.options[f.check.answer], f.id).toBeTruthy()
      for (const r of f.related) expect(FICHE_BY_ID.has(r), `${f.id} -> ${r}`).toBe(true)
    }
    for (const p of PATHS) for (const id of p.fiches) expect(FICHE_BY_ID.has(id), id).toBe(true)
  })

  it('réflexions : bonne réponse et rappel valides', () => {
    for (const r of REFLECTIONS) {
      expect(r.options[r.answer], r.id).toBeTruthy()
      expect(r.recall.options[r.recall.answer], r.id).toBeTruthy()
    }
  })

  it('pays : tous présents sur la carte, noms uniques', () => {
    const ids = new Set((world as { objects: { countries: { geometries: { id: string }[] } } }).objects.countries.geometries.map((g) => g.id))
    for (const c of COUNTRIES) expect(ids.has(c.id), c.name).toBe(true)
    expect(unique(COUNTRIES.map((c) => c.name))).toBe(true)
    expect(unique(COUNTRIES.map((c) => c.id))).toBe(true)
  })
})

describe('pays : site et pipeline synchronisés', () => {
  it('pipeline/data/countries.json reprend exactement src/content/countries.ts', async () => {
    const json = (await import('../../pipeline/data/countries.json')).default as { countries: { id: string; name: string; continent: string }[] }
    const pipeline = json.countries.map((c) => `${c.id}|${c.name}|${c.continent}`).sort()
    const site = COUNTRIES.map((c) => `${c.id}|${c.name}|${c.continent}`).sort()
    expect(pipeline).toEqual(site)
  })
})
