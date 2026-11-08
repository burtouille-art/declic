import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../content'
import { shuffleOptions } from '../components/ui/Choices'
import { dailyQuiz } from './daily'
import { buildVoyageRounds, drawChronology, scoreOrder } from './gameLogic'
import { countriesIn } from './geo'
import { parseNews, topStories, topicTerms } from './news'
import { dailySlice, dayKey, mulberry32, seededShuffle } from './random'
import { dueIds, nextEntry } from './srs'

describe('sélections quotidiennes', () => {
  it('sont reproductibles pour une même date', () => {
    const d = new Date(2026, 10, 8)
    expect(dailySlice(QUESTIONS, 10, d, 'quiz').map((q) => q.id)).toEqual(dailySlice(QUESTIONS, 10, new Date(2026, 10, 8, 23, 59), 'quiz').map((q) => q.id))
  })
  it('ne répètent aucune question avant d’avoir épuisé la banque', () => {
    const days = Math.floor(QUESTIONS.length / 10)
    const seen = new Set<string>()
    for (let k = 0; k < days; k++) {
      for (const q of dailySlice(QUESTIONS, 10, new Date(2026, 0, 1 + k), 'quiz')) {
        expect(seen.has(q.id)).toBe(false)
        seen.add(q.id)
      }
    }
  })
  it('le quiz du jour fait 10 questions et intègre l’éphéméride si disponible', () => {
    const otd = {
      generatedAt: '2026-11-08T00:00:00Z',
      days: { '11-08': { events: [], questions: [{ id: 'q-otd-x', prompt: 'En quelle année : test ?', options: ['1', '2', '3', '4'], answer: 1, explanation: 'x', source: { label: 'W', url: 'https://fr.wikipedia.org/wiki/X' } }] } },
    }
    const quiz = dailyQuiz(new Date(2026, 10, 8), otd)
    expect(quiz).toHaveLength(10)
    expect(quiz.filter((q) => q.origin === 'ephemeride')).toHaveLength(1)
    expect(dailyQuiz(new Date(2026, 10, 8), null)).toHaveLength(10)
  })
  it('dayKey utilise la date locale', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('mélange des options', () => {
  it('conserve la bonne réponse', () => {
    for (let k = 0; k < 50; k++) {
      const r = shuffleOptions(['a', 'b', 'c', 'd'], 2, mulberry32(k))
      expect(r.options[r.answer]).toBe('c')
      expect([...r.options].sort()).toEqual(['a', 'b', 'c', 'd'])
    }
  })
  it('seededShuffle est déterministe', () => {
    expect(seededShuffle([1, 2, 3, 4, 5], 'x')).toEqual(seededShuffle([1, 2, 3, 4, 5], 'x'))
  })
})

describe('révision espacée', () => {
  const now = new Date(2026, 10, 8)
  it('une erreur ramène en boîte 1 pour le lendemain', () => {
    const e = nextEntry({ box: 4, due: '2026-12-01', wrong: 0, seen: 3 }, false, now)
    expect(e).toMatchObject({ box: 1, due: '2026-11-09', wrong: 1 })
  })
  it('une bonne réponse espace la révision', () => {
    const e = nextEntry({ box: 1, due: '2026-11-08', wrong: 1, seen: 1 }, true, now)
    expect(e).toMatchObject({ box: 2, due: '2026-11-11' })
  })
  it('seules les questions déjà ratées et échues sont à réviser', () => {
    const due = dueIds(
      { a: { box: 1, due: '2026-11-08', wrong: 1, seen: 1 }, b: { box: 3, due: '2026-11-07', wrong: 0, seen: 1 }, c: { box: 2, due: '2026-11-20', wrong: 2, seen: 3 } },
      now,
    )
    expect(due).toEqual(['a'])
  })
})

describe('jeux', () => {
  it('chronologie : 5 événements espacés et score correct', () => {
    const evs = drawChronology(42, 5, 8)
    expect(evs).toHaveLength(5)
    const years = evs.map((e) => e.year).sort((a, b) => a - b)
    for (let k = 1; k < years.length; k++) expect(years[k]! - years[k - 1]!).toBeGreaterThanOrEqual(8)
    const sorted = [...evs].sort((a, b) => a.year - b.year)
    expect(scoreOrder(sorted)).toBe(5)
    expect(scoreOrder([...sorted].reverse())).toBeLessThan(5)
  })
  it('grand voyage : 4 choix distincts dont la cible, capitales seulement si connues', () => {
    for (const mode of ['pays', 'capitale', 'trouver'] as const) {
      for (const region of ['monde', 'europe', 'afrique', 'ameriques', 'asie'] as const) {
        const rounds = buildVoyageRounds(mode, region, 7)
        expect(rounds.length).toBeGreaterThan(0)
        expect(new Set(rounds.map((r) => r.target.id)).size).toBe(rounds.length)
        for (const r of rounds) {
          expect(new Set(r.choices.map((c) => c.id)).size).toBe(4)
          expect(r.choices.some((c) => c.id === r.target.id)).toBe(true)
          if (mode === 'capitale') expect(r.choices.every((c) => c.capital)).toBe(true)
        }
      }
    }
  })
})

describe('géographie des titres', () => {
  it('repère les pays nommés, sans faux positifs évidents', () => {
    expect(countriesIn('Ce que l’on sait de l’attentat en Pologne').map((c) => c.name)).toEqual(['Pologne'])
    expect(countriesIn('Trains collide in Egypt').map((c) => c.name)).toEqual(['Égypte'])
    expect(countriesIn('Le musée rouvre ses portes')).toEqual([])
    expect(countriesIn('Les US et la Chine').map((c) => c.name).sort()).toEqual(['Chine', 'États-Unis'])
  })
})

describe('données d’actualité', () => {
  const art = (id: string, extra: Record<string, unknown> = {}) => ({
    id, title: `Titre ${id}`, url: `https://ex.org/${id}`, sourceId: 's', sourceName: `Média ${id}`, lang: 'fr', kind: 'news',
    publishedAt: new Date().toISOString(), summary: null, categories: ['monde'], image: null, clusterId: null, ...extra,
  })
  it('écarte les articles invalides (URL dangereuse, rubrique inconnue)', () => {
    const d = parseNews({ version: 1, generatedAt: '2026-11-08T10:00:00Z', articles: [art('aaaa1'), art('aaaa2', { url: 'javascript:alert(1)' }), art('aaaa3', { categories: ['inconnue'] })], clusters: [] })
    expect(d.articles.map((a) => a.id)).toEqual(['aaaa1'])
    expect(d.rejected).toBe(2)
  })
  it('les titres principaux évitent un même événement deux fois', () => {
    const d = parseNews({
      version: 1, generatedAt: 'x',
      articles: [art('aaaa1', { clusterId: 'c1' }), art('aaaa2', { clusterId: 'c1' }), art('aaaa3'), art('aaaa4')],
      clusters: [{ id: 'c1', articleIds: ['aaaa1', 'aaaa2'], sourceCount: 2 }],
    })
    const top = topStories(d, 3)
    expect(top.filter((a) => a.clusterId === 'c1')).toHaveLength(1)
  })
  it('les sujets du moment sont des termes capitalisés récurrents', () => {
    const d = parseNews({ version: 1, generatedAt: 'x', articles: [art('aaaa1', { title: 'Élections en Israël : Gadi Eisenkot avance' }), art('aaaa2', { title: 'Gadi Eisenkot chargé de former un gouvernement' })] })
    expect(topicTerms(d.articles).map((t) => t.term)).toContain('Eisenkot')
  })
})
