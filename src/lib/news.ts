/**
 * Accès aux données produites par le pipeline (public/data/*.json).
 * Validation stricte avec zod : un article mal formé est écarté, pas affiché.
 */
import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { CATEGORY_IDS, type CategoryId } from './store'

const httpsUrl = z.string().url().refine((u) => /^https?:\/\//.test(u), 'URL http(s) attendue')

export const articleSchema = z.object({
  id: z.string().min(4),
  title: z.string().min(1).max(400),
  url: httpsUrl,
  sourceId: z.string(),
  sourceName: z.string(),
  sourceHome: z.string().nullable().optional(),
  sourceCountry: z.string().nullable().optional(),
  lang: z.enum(['fr', 'en']),
  kind: z.enum(['news', 'analysis', 'opinion', 'institution']),
  publishedAt: z.string(),
  summary: z.string().nullable(),
  categories: z.array(z.string()).min(1),
  image: z.object({ url: httpsUrl, credit: z.string(), license: z.string().optional() }).nullable(),
  clusterId: z.string().nullable(),
})
export type Article = z.infer<typeof articleSchema> & { categories: CategoryId[] }

const clusterSchema = z.object({
  id: z.string(),
  articleIds: z.array(z.string()),
  sourceCount: z.number(),
  entities: z.array(z.string()).default([]),
  langs: z.array(z.string()).default([]),
  countries: z.array(z.string()).default([]),
  analysisIds: z.array(z.string()).default([]),
})
export type Cluster = z.infer<typeof clusterSchema>

const newsSchema = z.object({
  version: z.number(),
  generatedAt: z.string(),
  maxAgeDays: z.number().optional(),
  snapshot: z.boolean().optional(),
  articles: z.array(z.unknown()),
  clusters: z.array(clusterSchema).default([]),
  sources: z.array(z.object({ name: z.string(), homepage: z.string().nullable().optional(), lang: z.string().nullable().optional(), kind: z.string() })).default([]),
})

export type NewsData = {
  generatedAt: string
  snapshot: boolean
  articles: Article[]
  clusters: Cluster[]
  byId: Map<string, Article>
  rejected: number
}

const otdEventSchema = z.object({ id: z.string(), year: z.number().int(), text: z.string(), url: httpsUrl, pageTitle: z.string().nullable() })
const otdQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string(),
  source: z.object({ label: z.string(), url: httpsUrl }),
})
const otdSchema = z.object({
  generatedAt: z.string(),
  license: z.string().nullable().optional(),
  days: z.record(z.string(), z.object({ events: z.array(otdEventSchema), questions: z.array(otdQuestionSchema) })),
})
export type OnThisDay = z.infer<typeof otdSchema>
export type OtdEvent = z.infer<typeof otdEventSchema>
export type OtdQuestion = z.infer<typeof otdQuestionSchema>

const statusSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  lang: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  ok: z.boolean(),
  httpStatus: z.number().nullable().optional(),
  error: z.string().nullable().optional(),
  entries: z.number(),
  kept: z.number(),
  usedFallback: z.boolean(),
  newestItemAt: z.string().nullable().optional(),
  lastSuccessAt: z.string().nullable().optional(),
  warning: z.string().nullable().optional(),
})
export const statusSchema = z.object({
  generatedAt: z.string(),
  durationMs: z.number(),
  mode: z.enum(['live', 'snapshot']),
  keptPreviousData: z.boolean(),
  articleCount: z.number(),
  clusterCount: z.number(),
  sourcesOk: z.number(),
  sourcesTotal: z.number(),
  maxAgeDays: z.number(),
  sources: z.array(statusSourceSchema),
  onThisDay: z.object({ id: z.string(), name: z.string(), ok: z.boolean(), error: z.string().nullable(), days: z.array(z.string()) }).nullable(),
})
export type Status = z.infer<typeof statusSchema>

const DATA_BASE = `${import.meta.env.BASE_URL}data/`

export function parseNews(json: unknown): NewsData {
  const base = newsSchema.parse(json)
  const articles: Article[] = []
  let rejected = 0
  for (const raw of base.articles) {
    const res = articleSchema.safeParse(raw)
    if (res.success) {
      const cats = res.data.categories.filter((c): c is CategoryId => (CATEGORY_IDS as readonly string[]).includes(c))
      if (cats.length) articles.push({ ...res.data, categories: cats })
      else rejected++
    } else rejected++
  }
  articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const byId = new Map(articles.map((a) => [a.id, a]))
  const clusters = base.clusters
    .map((c) => ({ ...c, articleIds: c.articleIds.filter((id) => byId.has(id)), analysisIds: c.analysisIds.filter((id) => byId.has(id)) }))
    .filter((c) => c.articleIds.length >= 2)
  return { generatedAt: base.generatedAt, snapshot: !!base.snapshot, articles, clusters, byId, rejected }
}

type Resource<T> = { data: T | null; error: string | null; loading: boolean; reload: () => void }

const cache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

async function load<T>(file: string, parse: (j: unknown) => T, force = false): Promise<T> {
  if (!force && cache.has(file)) return cache.get(file) as T
  if (!force && inflight.has(file)) return inflight.get(file) as Promise<T>
  const p = (async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12_000)
    try {
      const res = await fetch(`${DATA_BASE}${file}`, { signal: ctrl.signal, cache: force ? 'no-cache' : 'default' })
      if (!res.ok) throw new Error(`Le fichier ${file} a répondu ${res.status}.`)
      const parsed = parse(await res.json())
      cache.set(file, parsed)
      return parsed
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw new Error('La connexion est trop lente : les données ne sont pas arrivées à temps.')
      if (e instanceof z.ZodError) throw new Error(`Le fichier ${file} est mal formé.`)
      if (e instanceof TypeError) throw new Error('Pas de connexion réseau, et aucune copie hors ligne disponible.')
      throw e
    } finally {
      clearTimeout(timer)
      inflight.delete(file)
    }
  })()
  inflight.set(file, p)
  return p
}

function useResource<T>(file: string, parse: (j: unknown) => T): Resource<T> {
  const [data, setData] = useState<T | null>(() => (cache.get(file) as T) ?? null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!cache.has(file))
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(!cache.has(file) || nonce > 0)
    load(file, parse, nonce > 0)
      .then((d) => {
        if (!alive) return
        setData(d)
        setError(null)
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'Erreur inconnue'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // parse est une fonction de module stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, error, loading, reload }
}

/* ---------- quiz de l'actu (généré par le pipeline à partir des titres réels) ---------- */

const coverageSchema = z.object({ sourceName: z.string(), sourceCountry: z.string().nullable().optional(), title: z.string(), url: httpsUrl, lang: z.string() })
export const newsQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['pays', 'qui', 'nombre', 'angle']),
  prompt: z.string(),
  text: z.string().nullable(),
  options: z.array(z.string()).min(2).max(4),
  answer: z.number().int().min(0),
  solution: z.string(),
  articleId: z.string(),
  article: z.object({
    title: z.string(),
    url: httpsUrl,
    sourceName: z.string(),
    sourceCountry: z.string().nullable().optional(),
    publishedAt: z.string(),
    summary: z.string().nullable().optional(),
    category: z.string(),
  }),
  coverage: z.array(coverageSchema).default([]),
})
export type NewsQuestion = z.infer<typeof newsQuestionSchema>
export type NewsQuiz = { generatedAt: string; questions: NewsQuestion[]; pool: NewsQuestion[] }

export function parseQuiz(json: unknown): NewsQuiz {
  const base = z.object({ generatedAt: z.string(), questions: z.array(z.unknown()), pool: z.array(z.unknown()).default([]) }).parse(json)
  const keep = (arr: unknown[]) =>
    arr.flatMap((q) => {
      const r = newsQuestionSchema.safeParse(q)
      return r.success && r.data.answer < r.data.options.length ? [r.data] : []
    })
  return { generatedAt: base.generatedAt, questions: keep(base.questions), pool: keep(base.pool) }
}

export const useNews = () => useResource('news.json', parseNews)
export const useNewsQuiz = () => useResource('quiz.json', parseQuiz)
export const useOnThisDay = () => useResource('onthisday.json', (j) => otdSchema.parse(j))
export const useStatus = () => useResource('status.json', (j) => statusSchema.parse(j))

/* ---------- sélections éditoriales ---------- */

export function inCategory(a: Article, cat: CategoryId) {
  return a.categories.includes(cat)
}

/**
 * Score d'importance, transparent et explicable :
 * couverture par plusieurs médias > fraîcheur > présence d'un chapô > français.
 * Aucune pondération politique ou par média.
 */
export function importance(a: Article, clusters: Map<string, Cluster>, now = Date.now()): number {
  const hours = (now - new Date(a.publishedAt).getTime()) / 3_600_000
  const coverage = a.clusterId ? (clusters.get(a.clusterId)?.sourceCount ?? 1) : 1
  return (coverage - 1) * 3 + Math.max(0, 24 - hours) / 8 + (a.summary ? 1 : 0) + (a.lang === 'fr' ? 1.5 : 0) + (a.kind === 'news' ? 0.5 : 0)
}

/** Les N titres principaux, en évitant deux fois le même événement ou la même rubrique quand c'est possible. */
export function topStories(data: NewsData, n: number, opts: { lang?: 'fr' | 'all'; exclude?: Set<string> } = {}): Article[] {
  const clusters = new Map(data.clusters.map((c) => [c.id, c]))
  const pool = data.articles.filter((a) => (opts.lang === 'fr' ? a.lang === 'fr' : true) && !opts.exclude?.has(a.id) && a.categories[0] !== 'insolite' && a.kind !== 'opinion')
  const ranked = pool
    .map((a) => ({ a, s: importance(a, clusters) }))
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a)
  const out: Article[] = []
  const usedClusters = new Set<string>()
  const usedCats = new Map<string, number>()
  const usedSources = new Set<string>()
  // 1er passage : médias et rubriques variés ; 2e passage : on complète.
  for (const pass of [1, 2]) {
    for (const a of ranked) {
      if (out.length >= n) break
      if (out.includes(a)) continue
      if (a.clusterId && usedClusters.has(a.clusterId)) continue
      const c = a.categories[0] ?? 'monde'
      if (pass === 1 && ((usedCats.get(c) ?? 0) >= 2 || usedSources.has(a.sourceName))) continue
      out.push(a)
      usedSources.add(a.sourceName)
      if (a.clusterId) usedClusters.add(a.clusterId)
      usedCats.set(c, (usedCats.get(c) ?? 0) + 1)
    }
  }
  return out
}

/** Mots fréquents dans les titres d'une sélection : la « navigation par sujets ». */
const STOP = new Set(
  "les des une un la le du de et en au aux pour par sur dans avec est sont qui que quoi ce cette ces son ses leur leurs plus pas après avant entre contre selon face comme the of to in and for on with at from by after over says new est été être il elle ils elles nous vous on qu'il d'un d'une l'on ainsi lors fait faire font tout tous dont sous vers chez depuis encore déjà aussi alors deux trois quatre cinq premier première nouveau nouvelle ans jours jour mois semaine année what how why who will would could more than into about its their this that these those direct vidéo video ce que l'on sait"
    .split(/\s+/),
)
export function topicTerms(articles: Article[], max = 10): { term: string; count: number }[] {
  // Les titres anglais mettent une majuscule à chaque mot : on ne les utilise pas pour les sujets.
  articles = articles.filter((a) => a.lang === 'fr')
  const counts = new Map<string, { term: string; count: number }>()
  const pairs = new Map<string, number>()
  const split = (t: string) => t.split(/[\s,.:;!?«»"“”()'’/–—-]+/).map((w) => w.trim()).filter(Boolean)
  const isCap = (w: string) => w[0] === w[0]?.toUpperCase() && w[0] !== w[0]?.toLowerCase()
  // Un mot en tête de titre n'est un « sujet » que s'il apparaît aussi capitalisé ailleurs dans une phrase.
  const midCaps = new Set<string>()
  for (const a of articles) split(a.title).slice(1).forEach((w) => isCap(w) && midCaps.add(w.toLowerCase()))
  for (const a of articles) {
    const seen = new Set<string>()
    for (const [i, w] of split(a.title).entries()) {
      if (w.length < 4) continue
      const key = w.toLowerCase()
      if (STOP.has(key) || /^\d+$/.test(key) || seen.has(key)) continue
      // On ne garde que les noms propres / termes capitalisés : plus parlants comme sujets.
      if (!isCap(w)) continue
      if (i === 0 && !midCaps.has(key)) continue
      seen.add(key)
      const nextWord = split(a.title)[i + 1]
      if (nextWord && isCap(nextWord)) pairs.set(`${key} ${nextWord.toLowerCase()}`, (pairs.get(`${key} ${nextWord.toLowerCase()}`) ?? 0) + 1)
      const prev = counts.get(key)
      counts.set(key, { term: prev?.term ?? w, count: (prev?.count ?? 0) + 1 })
    }
  }
  // Un prénom toujours suivi du même nom (« Gadi Eisenkot ») : on ne garde que le nom.
  const always = new Set([...pairs.entries()].filter(([pair, n]) => n === counts.get(pair.split(' ')[0]!)?.count && counts.has(pair.split(' ')[1]!)).map(([pair]) => pair.split(' ')[0]!))
  return [...counts.entries()]
    .filter(([k, t]) => t.count >= 2 && !always.has(k))
    .map(([, t]) => t)
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
}

/**
 * Sujets à plusieurs regards : les événements couverts par le plus de médias,
 * en favorisant ceux qui réunissent des médias de pays différents.
 */
export function perspectiveClusters(data: NewsData, n = 3, exclude?: Set<string>): Cluster[] {
  const now = Date.now()
  const newest = (c: Cluster) => Math.max(...c.articleIds.map((id) => new Date(data.byId.get(id)?.publishedAt ?? 0).getTime()))
  return data.clusters
    .filter((c) => c.sourceCount >= 2 && !exclude?.has(c.id) && c.articleIds.every((id) => data.byId.has(id)))
    .map((c) => ({ c, s: c.sourceCount * 2 + c.countries.length * 1.5 + c.analysisIds.length + (c.langs.length > 1 ? 1 : 0) + Math.max(0, 48 - (now - newest(c)) / 3_600_000) / 12 }))
    .sort((x, y) => y.s - x.s)
    .slice(0, n)
    .map((x) => x.c)
}

/** Pour prendre du recul : analyses (ou tribunes) liées d'abord à un sujet du moment, puis les plus récentes, un article par média. */
export function analysisFeed(data: NewsData, n = 4, kind: 'analysis' | 'opinion' = 'analysis'): Article[] {
  const linked = new Set(data.clusters.flatMap((c) => c.analysisIds))
  const ranked = data.articles
    .filter((a) => a.kind === kind && a.lang === 'fr')
    .sort((x, y) => Number(linked.has(y.id)) - Number(linked.has(x.id)) || y.publishedAt.localeCompare(x.publishedAt))
  const out: Article[] = []
  const perSource = new Map<string, number>()
  for (const a of ranked) {
    if ((perSource.get(a.sourceName) ?? 0) >= 1) continue
    perSource.set(a.sourceName, (perSource.get(a.sourceName) ?? 0) + 1)
    out.push(a)
    if (out.length >= n) break
  }
  return out
}
