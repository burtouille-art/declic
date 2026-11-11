import { Layers, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { lazy, Suspense, useDeferredValue, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { clusterAnalyses, clusterItems, diversityLine, PerspectiveList } from '../components/news/Perspectives'
import { ClusterDialog } from '../components/news/ClusterDialog'
import { pickPhotos } from '../components/news/photo'
import { LeadStory, StoryRow } from '../components/news/Story'
import { EmptyState, ErrorState, SectionHeading, Skeleton } from '../components/ui/bits'
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
  { id: 'opinion', label: 'Tribunes et débats' },
  { id: 'institution', label: 'Institutions' },
] as const

function Chip({ active, onClick, children, controls }: { active: boolean; onClick: () => void; children: React.ReactNode; controls?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-controls={controls}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border px-3.5 text-[0.875rem] font-semibold transition-colors ${active ? 'border-ink bg-ink text-paper' : 'border-line-ui text-ink-2 hover:border-ink hover:text-ink'}`}
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

  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilters = (period !== '7j' ? 1 : 0) + (kind !== 'all' ? 1 : 0) + (lang !== prefLang ? 1 : 0)
  const recent = useMemo(() => rest.slice(0, 60), [rest])
  // Une photo n'apparaît qu'une fois par page (même image ou même sujet), dans l'ordre d'affichage.
  const allowed = useMemo(() => pickPhotos(lead ? [lead, ...recent] : recent), [lead, recent])

  const meta = cat ? CATEGORY_BY_ID[cat] : null
  const explainers = useMemo(() => {
    const c = cat ?? lead?.categories[0]
    if (!c) return { fiches: [], discoveries: [] }
    return { fiches: FICHES.filter((f) => f.rubriques.includes(c)).slice(0, 3), discoveries: DISCOVERIES.filter((d) => d.rubriques.includes(c)).slice(0, 2) }
  }, [cat, lead])
  const showMap = !cat || cat === 'monde'

  if (!valid) return <NotFound />

  return (
    <div className="wrap pt-4 lg:pt-10">
      <header className="border-b border-ink pb-3 lg:pb-5">
        <nav aria-label="Fil d'Ariane" className={`t-meta ${cat ? '' : 'hidden sm:block'}`}>
          <Link to="/" className="hover:underline">Accueil</Link> / {cat ? <Link to="/actus" className="hover:underline">Actualités</Link> : 'Actualités'}
          {meta && ` / ${meta.label}`}
        </nav>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h1 className="t-h1">{meta ? meta.label : 'Actualités'}</h1>
            <p className="mt-1 t-meta measure lg:t-lede lg:text-ink-2">{meta ? meta.blurb : 'Les titres tels que publiés, avec la source et l’heure.'}</p>
          </div>
          {data && <p className="hidden t-meta sm:block">Actualisé {relativeTime(data.generatedAt)}</p>}
        </div>
      </header>

      {/* Recherche (+ filtres en ligne sur ordinateur) */}
      <div className="mt-3 grid gap-3 lg:mt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-4">
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
            className="h-11 w-full rounded-full border border-line-ui bg-paper pr-12 pl-11 text-[1rem] placeholder:text-ink-3 focus:border-ink"
          />
          {q && (
            <button type="button" onClick={() => set('q', null)} className="absolute top-1/2 right-1 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-ink/8" aria-label="Effacer la recherche">
              <X size={17} aria-hidden />
            </button>
          )}
        </div>
        <div id="news-filters" className={`${filtersOpen ? 'flex' : 'hidden'} order-last flex-wrap gap-x-5 gap-y-3 border-y border-rule py-3 lg:order-none lg:flex lg:border-0 lg:py-0`}>
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
            <select value={kind} onChange={(e) => set('type', e.target.value === 'all' ? null : e.target.value)} className="h-9 rounded-full border border-line-ui bg-paper px-3 font-semibold">
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Rubriques : une seule ligne qui défile */}
        <nav aria-label="Rubriques" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:col-span-2 lg:mx-0 lg:px-0">
          <Link to={{ pathname: '/actus', search: params.toString() }} className={`flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[0.875rem] font-semibold ${!cat ? 'border-ink bg-ink text-paper' : 'border-line-ui text-ink-2 hover:border-ink'}`} aria-current={!cat ? 'page' : undefined}>
            Toutes
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={{ pathname: `/actus/${c.id}`, search: params.toString() }}
              aria-current={cat === c.id ? 'page' : undefined}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.875rem] font-semibold ${cat === c.id ? 'border-ink bg-ink text-paper' : 'border-line-ui text-ink-2 hover:border-ink'}`}
            >
              <span className={`h-2 w-2 rounded-[1px] ${toneClasses[c.tone].dot}`} aria-hidden />
              {c.label}
            </Link>
          ))}
        </nav>

        {/* Mobile : bouton Filtres + sujets du moment sur la même ligne défilante */}
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:col-span-2 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="news-filters"
            onClick={() => setFiltersOpen((o) => !o)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.875rem] font-semibold lg:hidden ${filtersOpen ? 'border-ink bg-ink text-paper' : 'border-line-ui text-ink-2'}`}
          >
            <SlidersHorizontal size={15} aria-hidden /> Filtres{activeFilters ? ` · ${activeFilters}` : ''}
          </button>
          {topics.length > 0 && <span className="mr-1 hidden t-meta lg:inline">Sujets du moment</span>}
          {topics.map((t) => (
            <button
              key={t.term}
              type="button"
              aria-pressed={q.toLowerCase() === t.term.toLowerCase()}
              onClick={() => set('q', q.toLowerCase() === t.term.toLowerCase() ? null : t.term)}
              className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[0.8125rem] font-semibold ${q.toLowerCase() === t.term.toLowerCase() ? 'bg-vermilion text-ink-fixed' : 'bg-paper-2 hover:bg-paper-3'}`}
            >
              {t.term} <span className={`font-normal ${q.toLowerCase() === t.term.toLowerCase() ? '' : 'text-ink-3'}`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {country && countryIndex.get(country) && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[0.875rem] font-semibold text-paper">
          <MapPin size={15} aria-hidden /> Articles mentionnant : {countryIndex.get(country)!.name}
          <button type="button" onClick={() => set('pays', null)} className="ml-1 rounded-full hover:bg-paper/20" aria-label="Retirer le filtre pays">
            <X size={15} aria-hidden />
          </button>
        </p>
      )}

      <section id="news-results" aria-live="polite" aria-busy={news.loading} className="mt-4 lg:mt-8">
        <p className="sr-only">{filtered.length} articles</p>
        {news.loading && !data && (
          <div className="grid gap-x-10 lg:grid-cols-2" role="status" aria-label="Chargement des actualités">
            {[0, 1].map((col) => (
              <div key={col} className="divide-y divide-rule border-t border-ink">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px] gap-4 py-4">
                    <div>
                      <Skeleton className="h-3 w-[120px]" />
                      <Skeleton className="mt-3 h-5 w-full" />
                      <Skeleton className="mt-2 h-5 w-3/4" />
                    </div>
                    <Skeleton className="mt-6 h-20 w-20" />
                  </div>
                ))}
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
              <LeadStory article={lead} byId={data?.byId} showPhoto={allowed.has(lead.id)} cluster={lead.clusterId ? clusters.get(lead.clusterId) : undefined} onCompare={() => lead.clusterId && setCompare(clusters.get(lead.clusterId) ?? null)} />
            </div>
            {(explainers.fiches.length > 0 || explainers.discoveries.length > 0) && (
              <aside className="border-t-2 border-ink pt-3 lg:col-span-4" aria-label="Pour comprendre">
                <p className="t-label">Pour comprendre</p>
                <ul className="mt-1 divide-y divide-rule">
                  {explainers.fiches.map((f) => (
                    <li key={f.id}>
                      <Link to={`/apprendre/${f.id}`} className="group block py-3">
                        <span className="t-meta block">Fiche</span>
                        <span className="mt-0.5 block t-h4 group-hover:underline">{f.title}</span>
                      </Link>
                    </li>
                  ))}
                  {explainers.discoveries.map((d) => (
                    <li key={d.id}>
                      <Link to={`/decouvrir/${d.id}`} className="group block py-3">
                        <span className="t-meta block">Découverte</span>
                        <span className="mt-0.5 block t-h4 group-hover:underline">{d.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        )}

        {visibleClusters.length > 0 && (
          <section className="mt-14 lg:mt-16" aria-labelledby="clusters-title">
            <SectionHeading id="clusters-title" title="Vu par plusieurs médias" description="Les mêmes événements, avec les titres de chaque média tels qu’ils les ont publiés." />
            <ul className="mt-5 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:mt-6">
              {visibleClusters.map((c) => {
                const items = clusterItems(c, data!.byId)
                return (
                  <li key={c.id}>
                    <p className="t-label text-ink-2">{diversityLine(c)}</p>
                    <div className="mt-2">
                      <PerspectiveList compact items={items.slice(0, 3)} analyses={clusterAnalyses(c, data!.byId)} />
                    </div>
                    <button type="button" onClick={() => setCompare(c)} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-paper-2 px-3.5 text-[0.8125rem] font-semibold hover:bg-paper-3">
                      <Layers size={14} aria-hidden /> Comparer {items.length > 3 ? `les ${items.length} titres` : 'les titres'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {showMap && countryIndex.size > 0 && (
          <section className="mt-14 lg:mt-16" aria-labelledby="map-title">
            <SectionHeading id="map-title" title="Où se passe l'actualité ?" description="Pays explicitement cités dans les titres et chapôs de la sélection. Choisis-en un pour filtrer." />
            <div className="mt-5 grid gap-6 lg:mt-6 lg:grid-cols-12">
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
          <section className="mt-14 lg:mt-16" aria-labelledby="recent-title">
            <SectionHeading id="recent-title" title="Les plus récents" />
            {/* Deux colonnes en alternance (pair / impair) : l'ordre chronologique se lit en Z ; une seule colonne sur mobile. */}
            <div className="mt-1 grid gap-x-10 lg:grid-cols-2">
              {recent.map((a, k) => (
                <div key={a.id} className={k === 0 ? '' : k === 1 ? 'border-t border-rule lg:border-t-0' : 'border-t border-rule'}>
                  <StoryRow article={a} summary showPhoto={allowed.has(a.id)} cluster={a.clusterId ? clusters.get(a.clusterId) : undefined} onCompare={() => a.clusterId && setCompare(clusters.get(a.clusterId) ?? null)} />
                </div>
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

