import { Layers, MapPin, Search, X } from 'lucide-react'
import { lazy, Suspense, useDeferredValue, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ClusterDialog } from '../components/news/ClusterDialog'
import { ArticleLink, LeadStory, StoryCard } from '../components/news/Story'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/bits'
import { CATEGORIES, CATEGORY_BY_ID, toneClasses } from '../content/categories'
import { DISCOVERIES, FICHES } from '../content'
import { relativeTime } from '../lib/format'
import { countriesIn } from '../lib/geo'
import { topicTerms, topStories, useNews, type Article, type Cluster } from '../lib/news'
import { CATEGORY_IDS, useAppState, type CategoryId } from '../lib/store'
import { NotFound } from './NotFound'

const WorldMap = lazy(() => import('../components/viz/WorldMap').then((m) => ({ default: m.WorldMap })))

const PERIODS = [
  { id: '24h', label: '24 h', hours: 24 },
  { id: '3j', label: '3 jours', hours: 72 },
  { id: '7j', label: '7 jours', hours: 24 * 7 },
] as const
const KINDS = [
  { id: 'all', label: 'Tout' },
  { id: 'news', label: 'Actualité' },
  { id: 'analysis', label: 'Analyses' },
  { id: 'institution', label: 'Institutions' },
] as const

function Chip({ active, onClick, children, controls }: { active: boolean; onClick: () => void; children: React.ReactNode; controls?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-controls={controls}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border px-3.5 text-[0.875rem] font-semibold transition-colors ${active ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-ink-2 hover:border-ink hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

export function NewsPage() {
  const { rubrique } = useParams()
  const [params, setParams] = useSearchParams()
  const news = useNews()
  const prefLang = useAppState((s) => s.prefs.lang)
  const [compare, setCompare] = useState<Cluster | null>(null)

  const valid = !rubrique || (CATEGORY_IDS as readonly string[]).includes(rubrique)
  const cat = (valid ? rubrique : undefined) as CategoryId | undefined
  const q = params.get('q') ?? ''
  const period = (params.get('periode') ?? '7j') as (typeof PERIODS)[number]['id']
  const kind = (params.get('type') ?? 'all') as (typeof KINDS)[number]['id']
  const lang = (params.get('langue') ?? prefLang) as 'fr' | 'all'
  const country = params.get('pays')
  const deferredQ = useDeferredValue(q)

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value === null || value === '') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const data = news.data
  const clusters = useMemo(() => new Map((data?.clusters ?? []).map((c) => [c.id, c])), [data])

  const base = useMemo(() => {
    if (!data) return []
    const limit = Date.now() - (PERIODS.find((p) => p.id === period)?.hours ?? 168) * 3_600_000
    return data.articles.filter(
      (a) =>
        (!cat || a.categories.includes(cat)) &&
        (lang === 'all' || a.lang === 'fr') &&
        (kind === 'all' || a.kind === kind) &&
        new Date(a.publishedAt).getTime() >= limit,
    )
  }, [data, cat, lang, kind, period])

  const countryIndex = useMemo(() => {
    const m = new Map<string, { name: string; articles: Article[] }>()
    for (const a of base) for (const c of countriesIn(`${a.title} ${a.summary ?? ''}`)) {
      const e = m.get(c.id) ?? { name: c.name, articles: [] }
      e.articles.push(a)
      m.set(c.id, e)
    }
    return m
  }, [base])

  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return base.filter((a) => {
      if (country && !countryIndex.get(country)?.articles.includes(a)) return false
      if (!needle) return true
      const hay = `${a.title} ${a.summary ?? ''} ${a.sourceName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      return needle.split(/\s+/).every((w) => hay.includes(w))
    })
  }, [base, deferredQ, country, countryIndex])

  const topics = useMemo(() => topicTerms(base, 10), [base])
  // Article principal : le plus important (couverture, fraîcheur), pas seulement le plus récent.
  const lead = useMemo(() => (data && filtered.length ? (topStories({ ...data, articles: filtered }, 1)[0] ?? filtered[0]) : undefined), [data, filtered])
  const rest = useMemo(() => filtered.filter((a) => a !== lead), [filtered, lead])
  const visibleClusters = useMemo(() => {
    const ids = new Set(filtered.map((a) => a.id))
    return (data?.clusters ?? []).filter((c) => c.articleIds.some((id) => ids.has(id))).slice(0, 6)
  }, [data, filtered])

  const meta = cat ? CATEGORY_BY_ID[cat] : null
  const explainers = useMemo(() => {
    const c = cat ?? lead?.categories[0]
    if (!c) return { fiches: [], discoveries: [] }
    return { fiches: FICHES.filter((f) => f.rubriques.includes(c)).slice(0, 3), discoveries: DISCOVERIES.filter((d) => d.rubriques.includes(c)).slice(0, 2) }
  }, [cat, lead])
  const showMap = !cat || cat === 'monde'

  if (!valid) return <NotFound />

  return (
    <div className="wrap pt-6 lg:pt-10">
      <header className="border-b border-ink pb-5">
        <nav aria-label="Fil d'Ariane" className="t-meta">
          <Link to="/" className="hover:underline">Accueil</Link> / {cat ? <Link to="/actus" className="hover:underline">Actualités</Link> : 'Actualités'}
          {meta && ` / ${meta.label}`}
        </nav>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="t-display">{meta ? meta.label : 'Actualités'}</h1>
            <p className="mt-2 t-lede text-ink-2">{meta ? meta.blurb : 'Les titres des médias, tels qu’ils les ont publiés, avec la source et l’heure. Clique pour lire l’article chez eux.'}</p>
          </div>
          {data && <p className="t-meta">Actualisé {relativeTime(data.generatedAt)}</p>}
        </div>
      </header>

      {/* Rubriques */}
      <nav aria-label="Rubriques" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link to={{ pathname: '/actus', search: params.toString() }} className={`flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[0.875rem] font-semibold ${!cat ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-ink-2 hover:border-ink'}`} aria-current={!cat ? 'page' : undefined}>
          Toutes
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={{ pathname: `/actus/${c.id}`, search: params.toString() }}
            aria-current={cat === c.id ? 'page' : undefined}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.875rem] font-semibold ${cat === c.id ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-ink-2 hover:border-ink'}`}
          >
            <span className={`h-2 w-2 rounded-[1px] ${toneClasses[c.tone].dot}`} aria-hidden />
            {c.label}
          </Link>
        ))}
      </nav>

      {/* Recherche et filtres */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <label htmlFor="news-search" className="sr-only">
            Rechercher dans les titres
          </label>
          <input
            id="news-search"
            type="search"
            value={q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Rechercher un sujet, un lieu, un média…"
            className="h-12 w-full rounded-full border border-ink/20 bg-paper pr-12 pl-11 text-[1rem] placeholder:text-ink-3 focus:border-ink"
          />
          {q && (
            <button type="button" onClick={() => set('q', null)} className="absolute top-1/2 right-2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-ink/8" aria-label="Effacer la recherche">
              <X size={17} aria-hidden />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          <fieldset className="flex items-center gap-1.5">
            <legend className="sr-only">Période</legend>
            {PERIODS.map((p) => (
              <Chip key={p.id} active={period === p.id} onClick={() => set('periode', p.id === '7j' ? null : p.id)} controls="news-results">
                {p.label}
              </Chip>
            ))}
          </fieldset>
          <fieldset className="flex items-center gap-1.5">
            <legend className="sr-only">Langue</legend>
            <Chip active={lang === 'fr'} onClick={() => set('langue', lang === 'fr' ? 'all' : 'fr')} controls="news-results">
              En français seulement
            </Chip>
          </fieldset>
          <label className="inline-flex items-center gap-2 text-[0.875rem]">
            <span className="text-ink-2">Type</span>
            <select value={kind} onChange={(e) => set('type', e.target.value === 'all' ? null : e.target.value)} className="h-9 rounded-full border border-ink/20 bg-paper px-3 font-semibold">
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Sujets */}
      {topics.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="t-meta mr-1">Sujets du moment</span>
          {topics.map((t) => (
            <button
              key={t.term}
              type="button"
              aria-pressed={q.toLowerCase() === t.term.toLowerCase()}
              onClick={() => set('q', q.toLowerCase() === t.term.toLowerCase() ? null : t.term)}
              className={`rounded-full px-3 py-1 text-[0.8125rem] font-semibold ${q.toLowerCase() === t.term.toLowerCase() ? 'bg-vermilion text-[#171b1d]' : 'bg-paper-2 hover:bg-paper-3'}`}
            >
              {t.term} <span className="font-normal text-ink-3">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {country && countryIndex.get(country) && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[0.875rem] font-semibold text-paper">
          <MapPin size={15} aria-hidden /> Articles mentionnant : {countryIndex.get(country)!.name}
          <button type="button" onClick={() => set('pays', null)} className="ml-1 rounded-full hover:bg-paper/20" aria-label="Retirer le filtre pays">
            <X size={15} aria-hidden />
          </button>
        </p>
      )}

      <section id="news-results" aria-live="polite" aria-busy={news.loading} className="mt-8">
        <p className="sr-only">{filtered.length} articles</p>
        {news.loading && !data && (
          <div className="grid gap-8 md:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-3 h-6 w-full" />
                <Skeleton className="mt-2 h-16 w-full" />
              </div>
            ))}
          </div>
        )}
        {news.error && !data && <ErrorState title="Impossible de charger les actualités." message={news.error} onRetry={news.reload} />}
        {data && filtered.length === 0 && (
          <EmptyState title="Aucun article ne correspond.">
            {base.length ? 'Essaie un autre mot-clé, une période plus longue ou toutes les langues.' : `Pas d'article de moins de ${PERIODS.find((p) => p.id === period)?.label} dans cette rubrique pour l'instant. Les sources sont relues toutes les six heures.`}
          </EmptyState>
        )}
        {lead && (
          <div className="grid gap-x-10 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <LeadStory article={lead} cluster={lead.clusterId ? clusters.get(lead.clusterId) : undefined} onCompare={() => lead.clusterId && setCompare(clusters.get(lead.clusterId) ?? null)} />
            </div>
            <aside className="lg:col-span-4" aria-label="Pour comprendre">
              {(explainers.fiches.length > 0 || explainers.discoveries.length > 0) && (
                <div className="rounded-[22px] bg-paper-2 p-5">
                  <p className="t-label">Pour comprendre</p>
                  <ul className="mt-3 space-y-3">
                    {explainers.fiches.map((f) => (
                      <li key={f.id}>
                        <Link to={`/apprendre/${f.id}`} className="group block">
                          <span className="t-meta">Fiche</span>
                          <span className="block font-serif text-[1.1rem] leading-snug group-hover:underline">{f.title}</span>
                        </Link>
                      </li>
                    ))}
                    {explainers.discoveries.map((d) => (
                      <li key={d.id}>
                        <Link to={`/decouvrir/${d.id}`} className="group block">
                          <span className="t-meta">Découverte</span>
                          <span className="block font-serif text-[1.1rem] leading-snug group-hover:underline">{d.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        )}

        {visibleClusters.length > 0 && (
          <section className="mt-12" aria-labelledby="clusters-title">
            <h2 id="clusters-title" className="flex items-center gap-2 t-h2">
              <Layers size={22} aria-hidden /> Vu par plusieurs médias
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {visibleClusters.map((c) => {
                const arts = c.articleIds.map((id) => data!.byId.get(id)).filter((a): a is Article => !!a)
                return (
                  <li key={c.id} className="rounded-[22px] border border-rule p-5">
                    <p className="t-meta">{c.sourceCount} médias · {arts.map((a) => a.sourceName).join(', ')}</p>
                    <ul className="mt-2 space-y-2">
                      {arts.slice(0, 3).map((a) => (
                        <li key={a.id} className="font-serif text-[1.05rem] leading-snug">
                          <span className="font-sans text-[0.75rem] font-semibold text-ink-3">{a.sourceName} — </span>
                          <ArticleLink article={a} className="hover:underline">
                            {a.title}
                          </ArticleLink>
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => setCompare(c)} className="mt-3 text-[0.875rem] font-semibold underline underline-offset-2">
                      Comparer les titres
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {showMap && countryIndex.size > 0 && (
          <section className="mt-12" aria-labelledby="map-title">
            <h2 id="map-title" className="flex items-center gap-2 t-h2">
              <MapPin size={22} aria-hidden /> Où se passe l'actualité ?
            </h2>
            <p className="mt-1 t-meta">Pays explicitement cités dans les titres et chapôs de la sélection. Choisis-en un pour filtrer.</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <Suspense fallback={<Skeleton className="h-72 w-full" />}>
                  <WorldMap
                    label={`Carte des pays cités : ${[...countryIndex.values()].map((c) => c.name).join(', ')}`}
                    fills={Object.fromEntries([...countryIndex.entries()].map(([id, v]) => [id, id === country ? 'selected' : v.articles.length >= 4 ? 'heat3' : v.articles.length >= 2 ? 'heat2' : 'heat1']))}
                    onPick={(id) => countryIndex.has(id) && set('pays', id === country ? null : id)}
                  />
                </Suspense>
              </div>
              <ul className="flex flex-wrap content-start gap-2 lg:col-span-4">
                {[...countryIndex.entries()]
                  .sort((a, b) => b[1].articles.length - a[1].articles.length)
                  .map(([id, v]) => (
                    <li key={id}>
                      <Chip active={country === id} onClick={() => set('pays', country === id ? null : id)} controls="news-results">
                        {v.name} <span className="font-normal opacity-70">{v.articles.length}</span>
                      </Chip>
                    </li>
                  ))}
              </ul>
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section className="mt-12" aria-labelledby="recent-title">
            <h2 id="recent-title" className="t-h2">
              Les plus récents
            </h2>
            <div className="mt-5 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.slice(0, 60).map((a) => (
                <StoryCard key={a.id} article={a} cluster={a.clusterId ? clusters.get(a.clusterId) : undefined} onCompare={() => a.clusterId && setCompare(clusters.get(a.clusterId) ?? null)} />
              ))}
            </div>
            {rest.length > 60 && <p className="mt-8 t-meta">Encore {rest.length - 60} articles plus anciens : affine avec la recherche ou une période plus courte.</p>}
          </section>
        )}
      </section>

      <SourcesNote />
      {data && <ClusterDialog cluster={compare} byId={data.byId} onClose={() => setCompare(null)} />}
    </div>
  )
}

function SourcesNote() {
  const news = useNews()
  const names = useMemo(() => [...new Set((news.data?.articles ?? []).map((a) => a.sourceName))].sort(), [news.data])
  if (!names.length) return null
  return (
    <aside className="mt-16 border-t border-rule pt-5 text-[0.875rem] text-ink-2">
      <p>
        <strong className="text-ink">Sources de cette page :</strong> {names.join(', ')}. Titres et chapôs tels que publiés dans les flux RSS publics ; aucune réécriture, aucun résumé généré.{' '}
        <Link to="/diagnostic" className="link-ed">
          État des sources
        </Link>
      </p>
    </aside>
  )
}

