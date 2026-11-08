import { ArrowRight, Sparkles, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClusterDialog } from '../components/news/ClusterDialog'
import { LeadStory, StoryRow } from '../components/news/Story'
import { ButtonLink } from '../components/ui/Button'
import { ErrorState, SectionHeading, Skeleton } from '../components/ui/bits'
import { DeclicRing } from '../components/ui/DeclicRing'
import { CATEGORIES } from '../content/categories'
import { FICHES } from '../content'
import { formatToday, relativeTime } from '../lib/format'
import { inCategory, topStories, useNews, useOnThisDay, type Cluster } from '../lib/news'
import { dayKey } from '../lib/random'
import { useAppState } from '../lib/store'
import { DiscoveryOfTheDay } from './home/DiscoveryOfTheDay'
import { GuessTheYear } from './home/GuessTheYear'
import { QuizTeaser } from './home/QuizTeaser'
import { ScienceDesk } from './home/ScienceDesk'
import { StepBack, Viewpoints } from './home/Viewpoints'

/** Numéro d'édition = jour de l'année : un repère de magazine quotidien. */
function editionNumber(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000)
}

export function HomePage() {
  const news = useNews()
  const otd = useOnThisDay()
  const prefs = useAppState((s) => s.prefs)
  const declicDay = useAppState((s) => s.declic[dayKey()])
  const [compare, setCompare] = useState<Cluster | null>(null)

  const data = news.data
  const clusters = useMemo(() => new Map((data?.clusters ?? []).map((c) => [c.id, c])), [data])
  const top = useMemo(() => (data ? topStories(data, 5, { lang: prefs.lang }) : []), [data, prefs.lang])
  const lead = top[0]
  const rest = top.slice(1, 5)
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of data?.articles ?? []) for (const c of a.categories) m.set(c, (m.get(c) ?? 0) + 1)
    return m
  }, [data])
  const progress = declicDay?.completed ? 5 : (declicDay?.step ?? 0)

  return (
    <>
      {/* ——— Couverture ——— */}
      <section className="wrap pt-6 lg:pt-12" aria-labelledby="home-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-2">
          <p className="t-label">
            {formatToday()} {new Date().getFullYear()}
            <span className="ml-2 font-normal text-ink-3">· Édition n° {editionNumber()}</span>
          </p>
          {data && (
            <p className="t-meta">
              Actualisé {relativeTime(data.generatedAt)} · {data.articles.length} articles de {new Set(data.articles.map((a) => a.sourceName)).size} médias
            </p>
          )}
        </div>
        <div className="grid items-start gap-8 pt-5 lg:grid-cols-12 lg:gap-10 lg:pt-8">
          <h1 id="home-title" className="t-display text-balance lg:col-span-8">
            Aujourd'hui, le monde a encore des choses à t'apprendre.
          </h1>
          <aside className="hidden lg:col-span-4 lg:block" aria-label="Le Déclic du jour">
            <DeclicCard progress={progress} />
          </aside>
        </div>
      </section>

      {/* ——— À la une ——— */}
      <section className="wrap mt-7 lg:mt-12" aria-labelledby="une-title">
        <h2 id="une-title" className="sr-only">
          À la une
        </h2>
        {news.loading && !data && <HomeSkeleton />}
        {news.error && !data && <ErrorState title="Les actualités n'ont pas pu être chargées." message={news.error} onRetry={news.reload} />}
        {data && lead && (
          <div className="grid gap-x-10 gap-y-2 lg:grid-cols-12">
            <div className="lg:col-span-7 lg:border-r lg:border-rule lg:pr-10">
              <LeadStory article={lead} byId={data.byId} cluster={lead.clusterId ? clusters.get(lead.clusterId) : undefined} onCompare={() => lead.clusterId && setCompare(clusters.get(lead.clusterId) ?? null)} />
              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <ButtonLink to="/declic" variant="accent" size="lg" className="w-full sm:w-auto" icon={<DeclicRing size={22} progress={progress} tone="paper" track="paper" />}>
                  Comprendre en 5 minutes
                </ButtonLink>
                <Link to="/2-minutes" className="inline-flex items-center gap-1.5 t-label text-ink-2 hover:text-ink sm:hidden">
                  <Timer size={16} aria-hidden /> Je n'ai que 2 minutes
                </Link>
              </div>
            </div>
            <div className="divide-y divide-rule lg:col-span-5">
              {rest.map((a) => (
                <StoryRow key={a.id} article={a} cluster={a.clusterId ? clusters.get(a.clusterId) : undefined} onCompare={() => a.clusterId && setCompare(clusters.get(a.clusterId) ?? null)} />
              ))}
              <div className="pt-4">
                <Link to="/actus" className="inline-flex items-center gap-1.5 t-label hover:text-vermilion-ink">
                  Toute l'actualité <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        )}
        {data && data.snapshot && (
          <p className="t-meta mt-4">
            Données de démarrage relevées le {new Date(data.generatedAt).toLocaleDateString('fr-FR')} ; la collecte automatique les remplace à chaque actualisation.
          </p>
        )}
      </section>

      <section className="wrap mt-10 lg:hidden" aria-label="Le Déclic du jour">
        <DeclicCard progress={progress} />
      </section>

      {/* ——— Quiz de l'actu : juste après les titres qu'il fait retenir ——— */}
      <QuizTeaser otd={otd.data} />

      {/* ——— Points de vue ——— */}
      {data && <Viewpoints data={data} exclude={lead?.clusterId} onCompare={setCompare} />}

      {/* ——— Analyses et débats ——— */}
      {data && <StepBack data={data} />}

      {/* ——— Rubriques : un index typographique ——— */}
      <section className="mt-16 border-y border-ink bg-paper-2/60 py-8 lg:mt-24 lg:py-10" aria-labelledby="rubriques-title">
        <div className="wrap">
          <h2 id="rubriques-title" className="t-label text-ink-2">
            Les rubriques
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 sm:gap-x-7">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link to={`/actus/${c.id}`} className="group inline-flex items-baseline gap-1.5 font-serif text-[1.6rem] leading-tight tracking-[-0.015em] sm:text-[2.1rem]" style={{ fontVariationSettings: "'opsz' 48" }}>
                  <span className="group-hover:text-vermilion-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">{c.label}</span>
                  <sup className="t-meta font-sans">{counts.get(c.id) ?? 0}</sup>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ——— Découverte inattendue ——— */}
      <DiscoveryOfTheDay />

      {/* ——— Sciences ——— */}
      {data && <ScienceDesk articles={data.articles.filter((a) => inCategory(a, 'sciences') || inCategory(a, 'espace'))} />}

      {/* ——— Expérience culturelle : devine l'année ——— */}
      <GuessTheYear otd={otd.data} loading={otd.loading} error={otd.error} />

      {/* ——— Pour toi ——— */}
      {data && <ForYou categories={prefs.categories} articles={data.articles} />}

      {data && <ClusterDialog cluster={compare} byId={data.byId} onClose={() => setCompare(null)} />}
    </>
  )
}

const DECLIC_STEPS = ['Le monde en trois infos', 'Une découverte surprenante', 'Une question pour réfléchir', 'Un défi de mémoire', 'Ton bilan']

/** Carte signature : l'anneau et ses cinq segments, chacun nommé. */
function DeclicCard({ progress }: { progress: number }) {
  const done = progress >= 5
  return (
    <Link to="/declic" className="group relative block overflow-hidden rounded-[24px] bg-petrol p-5 text-on-petrol transition-transform hover:-translate-y-0.5 sm:p-6">
      <div className="flex items-center gap-4">
        <DeclicRing size={64} progress={progress} tone="paper" track="paper" stroke={7} className="shrink-0" />
        <div>
          <p className="font-serif text-[1.55rem] leading-tight font-medium" style={{ fontVariationSettings: "'opsz' 36" }}>
            {done ? 'Déclic du jour : fait !' : progress > 0 ? 'Reprendre ton Déclic' : 'Ton Déclic du jour'}
          </p>
          <p className="text-[0.875rem] text-on-petrol/90">{done ? 'Reviens demain pour un nouveau parcours.' : '5 minutes, 5 étapes.'}</p>
        </div>
      </div>
      <ol className="mt-5 space-y-2 border-t border-on-petrol/25 pt-4">
        {DECLIC_STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-[0.9375rem]">
            <span className={`h-1.5 w-7 shrink-0 rounded-full ${i < progress ? 'bg-vermilion' : 'bg-on-petrol/30'}`} aria-hidden />
            <span className={i < progress ? 'text-on-petrol/75 line-through decoration-on-petrol/40' : ''}>{label}</span>
            {i < progress && <span className="sr-only">(fait)</span>}
          </li>
        ))}
      </ol>
      <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-paper px-5 text-[0.9375rem] font-semibold text-ink group-hover:bg-paper/90">
        {done ? 'Voir mon bilan' : progress > 0 ? `Continuer, étape ${progress + 1}` : 'Commencer'} <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  )
}

function HomeSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12" role="status" aria-label="Chargement des actualités">
      <div className="lg:col-span-7">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-12 w-full" />
        <Skeleton className="mt-2 h-12 w-4/5" />
        <Skeleton className="mt-5 h-20 w-full" />
      </div>
      <div className="space-y-6 lg:col-span-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ForYou({ categories, articles }: { categories: string[]; articles: import('../lib/news').Article[] }) {
  const picks = useMemo(() => {
    const out: import('../lib/news').Article[] = []
    const seen = new Set<string>()
    for (const cat of categories) {
      const a = articles.find((x) => x.categories.includes(cat as never) && !seen.has(x.id))
      if (a) {
        out.push(a)
        seen.add(a.id)
      }
    }
    return out.slice(0, 4)
  }, [categories, articles])
  const fiches = useMemo(() => FICHES.filter((f) => f.rubriques.some((r) => categories.includes(r))).slice(0, 3), [categories])
  return (
    <section className="wrap mt-20" aria-labelledby="foryou-title">
      <SectionHeading
        id="foryou-title"
        title="Selon tes centres d'intérêt"
        kicker={`Tu suis : ${categories.length ? categories.map((c) => CATEGORIES.find((x) => x.id === c)?.label).join(', ') : 'aucune rubrique'}`}
        action={
          <Link to="/moi#preferences" className="t-label shrink-0 hover:text-vermilion-ink">
            Modifier
          </Link>
        }
      />
      <div className="mt-6 grid gap-x-10 lg:grid-cols-12">
        <div className="divide-y divide-rule border-t border-ink lg:col-span-7">
          {picks.length ? picks.map((a) => <StoryRow key={a.id} article={a} />) : <p className="py-4 text-ink-2">Pas d'article récent dans tes rubriques pour le moment.</p>}
        </div>
        <div className="mt-8 lg:col-span-5 lg:mt-0">
          <p className="flex items-center gap-2 t-label">
            <Sparkles size={16} aria-hidden className="text-vermilion-ink" /> Pour comprendre
          </p>
          <ul className="mt-3 space-y-3">
            {fiches.map((f) => (
              <li key={f.id}>
                <Link to={`/apprendre/${f.id}`} className="block rounded-2xl bg-paper-2 p-4 transition-colors hover:bg-paper-3">
                  <span className="t-h3 block">{f.title}</span>
                  <span className="t-meta mt-1 block">Fiche · 2 min</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
