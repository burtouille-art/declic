import { ArrowRight, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClusterDialog } from '../components/news/ClusterDialog'
import { photoAllowed, photoShape, pickPhotos } from '../components/news/photo'
import { LeadStory, StoryRow } from '../components/news/Story'
import { buttonClass } from '../components/ui/Button'
import { ErrorState, SectionHeading, Skeleton } from '../components/ui/bits'
import { DeclicRing } from '../components/ui/DeclicRing'
import { CATEGORIES } from '../content/categories'
import { FICHES } from '../content'
import { formatToday, relativeTime } from '../lib/format'
import { analysisFeed, inCategory, perspectiveClusters, topStories, useNews, useOnThisDay, type Article, type Cluster, type NewsData } from '../lib/news'
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

/**
 * Plan de la page, calculé d'un seul passage (pur) : ce qui est affiché, dans l'ordre,
 * pour qu'une même photo et un même article n'apparaissent qu'une fois.
 */
function homePlan(data: NewsData, top: Article[], categories: string[]) {
  const lead = top[0]
  const shownIds = new Set<string>()
  const ordered: Article[] = [] // articles qui montreraient leur photo, dans l'ordre d'affichage
  const show = (a: Article, photo = true) => {
    shownIds.add(a.id)
    if (photo) ordered.push(a)
  }
  top.forEach((a) => show(a))

  // Un sujet, plusieurs regards : une photo par sujet au plus (le 1er article du sujet qui en a une inédite).
  const viewpoints = perspectiveClusters(data, 3, lead?.clusterId ? new Set([lead.clusterId]) : undefined)
  const topicPhoto = new Map<string, Article>()
  for (const c of viewpoints) {
    const arts = c.articleIds.map((id) => data.byId.get(id)).filter((a): a is Article => !!a)
    const cand = arts.find((a) => photoAllowed(a) && pickPhotos([...ordered, a]).has(a.id))
    if (cand) topicPhoto.set(c.id, cand)
    arts.forEach((a) => show(a, a === cand))
  }

  const analyses = analysisFeed(data, 4, 'analysis')
  const opinions = analysisFeed(data, 4, 'opinion')
  analyses.forEach((a) => show(a))
  opinions.forEach((a) => show(a, false))

  // Sciences & espace : sans les articles déjà affichés plus haut ; la grande photo doit être large (NASA, lieu).
  const sci = data.articles.filter((a) => (inCategory(a, 'sciences') || inCategory(a, 'espace')) && !shownIds.has(a.id))
  const sciHero = sci.find((a) => photoAllowed(a) && photoShape(a.image!) === 'wide' && pickPhotos([...ordered, a]).has(a.id))
  const sciList = sci.filter((a) => a !== sciHero).slice(0, 4)
  if (sciHero) show(sciHero)
  sciList.forEach((a) => show(a))

  // Selon tes centres d'intérêt : un article par rubrique suivie, jamais déjà affiché.
  const forYou: Article[] = []
  for (const cat of categories) {
    const a = data.articles.find((x) => x.categories.includes(cat as never) && !shownIds.has(x.id) && !forYou.includes(x) && x.kind !== 'opinion')
    if (a) forYou.push(a)
    if (forYou.length >= 4) break
  }
  forYou.forEach((a) => show(a))

  return { viewpoints, topicPhoto, analyses, opinions, sciHero, sciList, sciCount: sci.length, forYou, allowed: pickPhotos(ordered) }
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
  const plan = useMemo(() => (data ? homePlan(data, top, prefs.categories) : null), [data, top, prefs.categories])
  const lead = top[0]
  const rest = top.slice(1, 5)
  const progress = declicDay?.completed ? 5 : (declicDay?.step ?? 0)
  const allowed = plan?.allowed ?? new Set<string>()

  return (
    <>
      {/* ——— Bandeau d'édition : date, actualisation, slogan (rétrogradé : la une, c'est l'actualité) ——— */}
      <section className="wrap pt-4 lg:pt-7" aria-labelledby="home-title">
        <div className="border-b-2 border-ink pb-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
            <p className="t-label">
              {formatToday()} {new Date().getFullYear()}
              <span className="ml-1 font-normal text-ink-3">· Édition n° {editionNumber()}</span>
            </p>
            {data && (
              <p className="t-meta">
                Actualisé {relativeTime(data.generatedAt)} · {data.articles.length} articles de {new Set(data.articles.map((a) => a.sourceName)).size} médias
              </p>
            )}
          </div>
          <h1 id="home-title" className="mt-1 font-serif text-[1.0625rem] leading-snug font-normal text-ink-2 italic lg:text-[1.125rem]">
            Aujourd'hui, le monde a encore des choses à t'apprendre.
          </h1>
        </div>
      </section>

      {/* ——— À la une ——— */}
      <section className="wrap mt-5 lg:mt-8" aria-labelledby="une-title">
        <h2 id="une-title" className="sr-only">
          À la une
        </h2>
        {news.loading && !data && <HomeSkeleton />}
        {news.error && !data && <ErrorState title="Les actualités n'ont pas pu être chargées." message={news.error} onRetry={news.reload} />}
        {data && lead && (
          <div className="grid gap-x-10 lg:grid-cols-12">
            <div className="lg:col-span-8 lg:border-r lg:border-rule lg:pr-10">
              <LeadStory
                article={lead}
                byId={data.byId}
                showPhoto={allowed.has(lead.id)}
                cluster={lead.clusterId ? clusters.get(lead.clusterId) : undefined}
                onCompare={() => lead.clusterId && setCompare(clusters.get(lead.clusterId) ?? null)}
              />
            </div>
            <div className="mt-6 lg:col-span-4 lg:mt-0">
              <div className="lg:hidden">
                <DeclicStrip progress={progress} />
              </div>
              <aside className="hidden lg:block" aria-label="Le Déclic du jour">
                <DeclicCard progress={progress} />
              </aside>
              <div className="mt-6 divide-y divide-rule border-t border-ink">
                {rest.map((a) => (
                  <StoryRow key={a.id} article={a} showPhoto={allowed.has(a.id)} cluster={a.clusterId ? clusters.get(a.clusterId) : undefined} onCompare={() => a.clusterId && setCompare(clusters.get(a.clusterId) ?? null)} />
                ))}
                <div>
                  <Link to="/actus" className="inline-flex h-11 items-center gap-1.5 t-label hover:text-vermilion-ink">
                    Toute l'actualité <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
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

      {/* ——— Quiz de l'actu : juste après les titres qu'il fait retenir ——— */}
      <QuizTeaser otd={otd.data} />

      {/* ——— Points de vue ——— */}
      {data && plan && <Viewpoints data={data} clusters={plan.viewpoints} photos={plan.topicPhoto} onCompare={setCompare} />}

      {/* ——— Analyses et débats ——— */}
      {plan && <StepBack analyses={plan.analyses} opinions={plan.opinions} allowed={allowed} />}

      {/* ——— Sciences ——— */}
      {plan && plan.sciCount > 0 && <ScienceDesk hero={plan.sciHero} list={plan.sciList} allowed={allowed} />}

      {/* ——— Découverte inattendue ——— */}
      <DiscoveryOfTheDay />

      {/* ——— Expérience culturelle : devine l'année ——— */}
      <GuessTheYear otd={otd.data} loading={otd.loading} error={otd.error} />

      {/* ——— Pour toi ——— */}
      {plan && <ForYou categories={prefs.categories} picks={plan.forYou} allowed={allowed} />}

      {data && <ClusterDialog cluster={compare} byId={data.byId} onClose={() => setCompare(null)} />}
    </>
  )
}

const DECLIC_STEPS = ['Le monde en trois infos', 'Une découverte surprenante', 'Une question pour réfléchir', 'Un défi de mémoire', 'Ton bilan']

function declicLabel(progress: number) {
  return progress >= 5 ? 'Voir mon bilan' : progress > 0 ? `Continuer, étape ${progress + 1}` : 'Commencer'
}

/** Mobile et tablette : le Déclic du jour en une bande compacte, juste après la une. */
function DeclicStrip({ progress }: { progress: number }) {
  const done = progress >= 5
  return (
    <div className="rounded-[20px] bg-petrol p-4 text-on-petrol">
      <div className="flex items-center gap-3.5">
        <DeclicRing size={44} progress={progress} tone="white" track="onDark" stroke={5} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[1.25rem] leading-tight font-[550]" style={{ fontVariationSettings: "'opsz' 30" }}>
            {done ? 'Déclic du jour : fait !' : progress > 0 ? 'Reprendre ton Déclic' : 'Ton Déclic du jour'}
          </p>
          <p className="text-[0.875rem] text-on-petrol/90">{done ? 'Reviens demain pour un nouveau parcours.' : '5 minutes, 5 étapes'}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-[58px]">
        <Link to="/2-minutes" className="inline-flex min-h-11 items-center gap-1.5 t-label text-on-petrol underline decoration-on-petrol/50 underline-offset-3 hover:decoration-on-petrol">
          <Timer size={16} aria-hidden /> Je n'ai que 2 minutes
        </Link>
        <Link to="/declic" className={buttonClass('onPetrol', 'md', 'h-11 px-5')}>
          {declicLabel(progress)} <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  )
}

/** Desktop : la carte signature, resserrée, en tête de la colonne de droite. */
function DeclicCard({ progress }: { progress: number }) {
  const done = progress >= 5
  return (
    <div className="rounded-[20px] bg-petrol p-5 text-on-petrol lg:rounded-[28px]">
      <div className="flex items-center gap-4">
        <DeclicRing size={56} progress={progress} tone="white" track="onDark" stroke={6} className="shrink-0" />
        <div>
          <p className="font-serif text-[1.375rem] leading-tight font-[550]" style={{ fontVariationSettings: "'opsz' 36" }}>
            {done ? 'Déclic du jour : fait !' : progress > 0 ? 'Reprendre ton Déclic' : 'Ton Déclic du jour'}
          </p>
          <p className="text-[0.875rem] text-on-petrol/90">{done ? 'Reviens demain pour un nouveau parcours.' : '5 minutes, 5 étapes.'}</p>
        </div>
      </div>
      <ol className="mt-4 space-y-1.5 border-t border-on-petrol/25 pt-3.5">
        {DECLIC_STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-[0.875rem]">
            <span className={`h-1.5 w-6 shrink-0 rounded-full ${i < progress ? 'bg-white' : 'bg-white/30'}`} aria-hidden />
            <span className={i < progress ? 'text-on-petrol/90 line-through decoration-on-petrol/50' : ''}>{label}</span>
            {i < progress && <span className="sr-only">(fait)</span>}
          </li>
        ))}
      </ol>
      <Link to="/declic" className={buttonClass('onPetrol', 'md', 'mt-4')}>
        {declicLabel(progress)} <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12" role="status" aria-label="Chargement des actualités">
      <div className="lg:col-span-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-12 w-full" />
        <Skeleton className="mt-2 h-12 w-4/5" />
        <Skeleton className="mt-5 h-20 w-full" />
      </div>
      <div className="space-y-6 lg:col-span-4">
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

function ForYou({ categories, picks, allowed }: { categories: string[]; picks: Article[]; allowed: Set<string> }) {
  const fiches = useMemo(() => FICHES.filter((f) => f.rubriques.some((r) => categories.includes(r))).slice(0, 3), [categories])
  const showArticles = picks.length >= 2
  if (!showArticles && !fiches.length) return null
  return (
    <section className="wrap mt-14 lg:mt-24" aria-labelledby="foryou-title">
      <SectionHeading
        id="foryou-title"
        title="Selon tes centres d'intérêt"
        description={`Tu suis : ${categories.length ? categories.map((c) => CATEGORIES.find((x) => x.id === c)?.label).join(', ') : 'aucune rubrique'}.`}
        action={
          <Link to="/moi#preferences" className="inline-flex min-h-11 items-center t-label hover:text-vermilion-ink">
            Modifier
          </Link>
        }
      />
      <div className="mt-5 grid gap-x-10 lg:mt-6 lg:grid-cols-12">
        {showArticles && (
          <div className="divide-y divide-rule lg:col-span-7">
            {picks.map((a) => (
              <StoryRow key={a.id} article={a} showPhoto={allowed.has(a.id)} />
            ))}
          </div>
        )}
        {fiches.length > 0 && (
          <div className={`mt-8 lg:mt-0 ${showArticles ? 'lg:col-span-5' : 'lg:col-span-7'}`}>
            <p className="t-label text-ink-2">Pour comprendre</p>
            <ul className="mt-2 divide-y divide-rule border-t border-ink">
              {fiches.map((f) => (
                <li key={f.id}>
                  <Link to={`/apprendre/${f.id}`} className="group block py-3.5">
                    <span className="t-meta block">Fiche · 2 min</span>
                    <span className="mt-0.5 block t-h4 group-hover:underline">{f.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
