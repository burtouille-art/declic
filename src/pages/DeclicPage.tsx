import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DiscoveryCard } from '../components/discover/DiscoveryCard'
import { ArticleLink, Meta } from '../components/news/Story'
import { Button, ButtonLink } from '../components/ui/Button'
import { ErrorState, Skeleton, SourceLine } from '../components/ui/bits'
import { Choices, shuffleOptions } from '../components/ui/Choices'
import { DeclicRing } from '../components/ui/DeclicRing'
import type { Recall } from '../content'
import { streak } from '../lib/badges'
import { dailyDiscovery, dailyReflection } from '../lib/daily'
import { formatToday } from '../lib/format'
import { topStories, useNews, type Article } from '../lib/news'
import { dayKey, hashString, mulberry32, seededShuffle } from '../lib/random'
import { actions, useAppState } from '../lib/store'

const STEPS = ['Le monde en trois infos', 'Une découverte', 'Une question pour réfléchir', 'Défi de mémoire', 'Ton bilan'] as const

type MemoryQ = { key: string; prompt: string; options: string[]; answer: number; from: string }

function toMemory(key: string, r: Recall, from: string, seed: string): MemoryQ {
  const s = shuffleOptions(r.options, r.answer, mulberry32(hashString(seed + key)))
  return { key, prompt: r.prompt, options: s.options, answer: s.answer, from }
}

/** Question de rappel sur l'actualité, construite uniquement à partir de données structurées (le nom du média). */
function newsRecall(article: Article, all: Article[], seed: string): MemoryQ | null {
  const others = [...new Set(all.map((a) => a.sourceName))].filter((n) => n !== article.sourceName)
  if (others.length < 2) return null
  const picked = seededShuffle(others, seed + 'src').slice(0, 2)
  return toMemory('m0', { prompt: `Quel média a publié : « ${article.title} » ?`, options: [article.sourceName, ...picked], answer: 0 }, 'Le monde en trois infos', seed)
}

export default function DeclicPage() {
  const key = dayKey()
  const saved = useAppState((s) => s.declic[key])
  const declic = useAppState((s) => s.declic)
  const news = useNews()
  const navigate = useNavigate()
  const step = saved?.completed ? 4 : (saved?.step ?? 0)
  const answers = saved?.answers ?? {}
  const [dir, setDir] = useState(1)
  const [discoveryDone, setDiscoveryDone] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const discovery = dailyDiscovery()
  const reflection = dailyReflection()
  const reflectionOpts = useMemo(() => shuffleOptions(reflection.options, reflection.answer, mulberry32(hashString(key + reflection.id))), [reflection, key])
  const three = useMemo(() => (news.data ? topStories(news.data, 3, { lang: 'fr' }) : []), [news.data])
  const memory = useMemo(() => {
    const qs: MemoryQ[] = []
    const first = three[0]
    const nq = first && news.data ? newsRecall(first, news.data.articles, key) : null
    if (nq) qs.push(nq)
    qs.push(toMemory('m1', discovery.recall, 'La découverte', key))
    qs.push(toMemory('m2', reflection.recall, 'La question du jour', key))
    return qs
  }, [three, news.data, discovery, reflection, key])

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    actions.setDeclic(key, { step: Math.max(0, Math.min(4, to)) })
  }
  const answer = (k: string, i: number) => actions.setDeclic(key, { answers: { ...answers, [k]: i } })
  const finish = () => {
    const memScore = memory.filter((q) => answers[q.key] === q.answer).length
    const refl = answers.reflection === reflectionOpts.answer ? 1 : 0
    const score = Math.min(4, memScore + refl)
    actions.setDeclic(key, { step: 4, completed: true, score })
    actions.recordScore('declic', score, 4)
    setDir(1)
  }
  const restart = () => {
    actions.setDeclic(key, { step: 0, completed: false, score: 0, answers: {} })
    setDiscoveryDone(false)
    setDir(-1)
  }

  const memoryAnswered = memory.every((q) => answers[q.key] !== undefined)
  const canNext = step === 0 ? true : step === 1 ? discoveryDone || answers.discovery === 1 : step === 2 ? answers.reflection !== undefined : step === 3 ? memoryAnswered : false

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col bg-paper">
        {/* Barre de progression : l'anneau Déclic */}
        <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
            <Link to="/" className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[0.875rem] font-semibold text-ink-2 hover:bg-ink/6" aria-label="Quitter le Déclic (ta progression est gardée)">
              <X size={18} aria-hidden /> <span className="hidden sm:inline">Quitter</span>
            </Link>
            <div className="mx-auto flex items-center gap-3">
              <DeclicRing size={34} progress={saved?.completed ? 5 : step} stroke={5} />
              <div className="leading-tight">
                <p className="t-label">{STEPS[step]}</p>
                <p className="t-meta">
                  Étape {step + 1} sur 5<span className="hidden sm:inline"> · {formatToday()}</span>
                </p>
              </div>
            </div>
            <span className="w-[72px]" aria-hidden />
          </div>
          <div className="grid h-1 grid-cols-5 gap-1 px-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className={`rounded-full transition-colors duration-500 ${i <= step ? 'bg-vermilion' : 'bg-ink/10'}`} />
            ))}
          </div>
        </header>

        <main id="declic-main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-36">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.section
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
              aria-labelledby="declic-step-title"
            >
              {step === 0 && (
                <>
                  <StepTitle refEl={headingRef} kicker="Écran 1" title="Le monde en trois informations" />
                  {news.loading && !news.data && <Skeleton className="mt-6 h-64 w-full" />}
                  {news.error && !news.data && (
                    <div className="mt-6">
                      <ErrorState title="L'actualité n'a pas pu être chargée." message={`${news.error} Tu peux continuer : la suite du parcours fonctionne sans connexion.`} onRetry={news.reload} />
                    </div>
                  )}
                  <ol className="mt-6 space-y-4">
                    {three.map((a, i) => (
                      <li key={a.id} className="headline-link relative rounded-[22px] border border-rule bg-paper p-5 sm:p-6">
                        <span className="font-serif text-[2.4rem] leading-none text-vermilion-ink" aria-hidden>
                          {i + 1}
                        </span>
                        <div className="mt-2">
                          <Meta article={a} />
                        </div>
                        <h3 className="mt-2 t-h2 text-pretty">
                          <ArticleLink article={a} className="headline stretched">
                            {a.title}
                          </ArticleLink>
                        </h3>
                        {a.summary && <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">{a.summary}</p>}
                      </li>
                    ))}
                  </ol>
                  <p className="t-meta mt-4">Sélection automatique : sujets couverts par plusieurs médias et récents d'abord, rubriques variées. Titres et chapôs tels que publiés.</p>
                </>
              )}

              {step === 1 && (
                <>
                  <StepTitle refEl={headingRef} kicker="Écran 2" title="Une découverte surprenante" />
                  <div className="mt-6 rounded-[22px] bg-sun/35 p-5 sm:p-7">
                    <DiscoveryCard
                      d={discovery}
                      headingLevel={3}
                      compact
                      onRevealed={() => {
                        setDiscoveryDone(true)
                        answer('discovery', 1)
                      }}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <StepTitle refEl={headingRef} kicker="Écran 3" title="Une question qui fait réfléchir" />
                  <p className="mt-6 font-serif text-[1.45rem] leading-snug font-medium text-pretty sm:text-[1.7rem]" style={{ fontVariationSettings: "'opsz' 32" }}>
                    {reflection.prompt}
                  </p>
                  <p className="t-meta mt-2">Réponds d'abord. L'explication s'affiche ensuite.</p>
                  <div className="mt-5">
                    <Choices options={reflectionOpts.options} selected={answers.reflection ?? null} correct={reflectionOpts.answer} onSelect={(i) => answer('reflection', i)} legend={reflection.prompt} />
                  </div>
                  {answers.reflection !== undefined && (
                    <div className="mt-6 border-l-4 border-petrol pl-5" aria-live="polite">
                      <p className="t-h3">{answers.reflection === reflectionOpts.answer ? 'Bien raisonné.' : "L'intuition t'a joué un tour, comme à la plupart des gens."}</p>
                      <p className="mt-2 t-body">{reflection.explanation}</p>
                      <SourceLine source={reflection.source} className="mt-3" />
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <StepTitle refEl={headingRef} kicker="Écran 4" title="Défi de mémoire" />
                  <p className="mt-2 text-ink-2">Trois questions sur ce que tu viens de voir. Se tester aide à retenir.</p>
                  <ol className="mt-6 space-y-8">
                    {memory.map((q, i) => (
                      <li key={q.key}>
                        <p className="t-meta">
                          Question {i + 1} · {q.from}
                        </p>
                        <p className="mt-1 t-h3">{q.prompt}</p>
                        <div className="mt-3">
                          <Choices options={q.options} selected={answers[q.key] ?? null} correct={q.answer} onSelect={(k) => answer(q.key, k)} legend={q.prompt} hotkeys={false} compact />
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {step === 4 && (
                <Bilan
                  refEl={headingRef}
                  score={saved?.score ?? 0}
                  streakDays={streak(declic)}
                  three={three}
                  discoveryTitle={discovery.title}
                  discoveryId={discovery.id}
                  reflectionPrompt={reflection.prompt}
                  onRestart={restart}
                />
              )}
            </motion.section>
          </AnimatePresence>
        </main>

        {step < 4 && (
          <footer className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 backdrop-blur">
            <div className="mx-auto flex h-20 max-w-3xl items-center gap-3 px-4">
              {step > 0 ? (
                <Button variant="quiet" onClick={() => go(step - 1)} icon={<ArrowLeft size={18} aria-hidden />}>
                  Retour
                </Button>
              ) : (
                <Button variant="quiet" onClick={() => navigate('/')}>
                  Plus tard
                </Button>
              )}
              <div className="ml-auto flex items-center gap-3">
                {!canNext && <span className="hidden t-meta sm:inline">{step === 1 ? 'Révèle la découverte pour continuer' : 'Réponds pour continuer'}</span>}
                {step < 3 ? (
                  <Button variant="primary" size="lg" disabled={!canNext} onClick={() => go(step + 1)}>
                    Continuer <ArrowRight size={18} aria-hidden />
                  </Button>
                ) : (
                  <Button variant="accent" size="lg" disabled={!canNext} onClick={finish}>
                    Voir mon bilan <ArrowRight size={18} aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          </footer>
        )}
      </div>
    </MotionConfig>
  )
}

function StepTitle({ kicker, title, refEl }: { kicker: string; title: string; refEl: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <div>
      <p className="t-meta">{kicker}</p>
      <h1 id="declic-step-title" ref={refEl} tabIndex={-1} className="mt-1 t-h1 outline-none">
        {title}
      </h1>
    </div>
  )
}

function Bilan(props: {
  refEl: React.RefObject<HTMLHeadingElement | null>
  score: number
  streakDays: number
  three: Article[]
  discoveryTitle: string
  discoveryId: string
  reflectionPrompt: string
  onRestart: () => void
}) {
  const { score, streakDays, three } = props
  return (
    <div className="text-center">
      <motion.div initial={{ scale: 0.8, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }} className="mx-auto w-fit">
        <DeclicRing size={132} progress={5} stroke={13} title="Parcours terminé" />
      </motion.div>
      <p className="mt-6 t-meta">Écran 5</p>
      <h1 ref={props.refEl} tabIndex={-1} id="declic-step-title" className="mt-1 t-display outline-none">
        Déclic !
      </h1>
      <p className="mx-auto mt-3 max-w-md t-lede text-ink-2">
        {score}/4 bonnes réponses aujourd'hui.{' '}
        {streakDays > 1 ? `${streakDays} jours d'affilée : belle régularité.` : 'Reviens demain pour un nouveau parcours.'}
      </p>
      <div className="mx-auto mt-10 max-w-xl text-left">
        <h2 className="t-label">Ce que tu as exploré</h2>
        <ul className="mt-3 divide-y divide-rule border-y border-rule">
          {three.map((a) => (
            <li key={a.id} className="py-3">
              <span className="t-meta">Actualité · {a.sourceName}</span>
              <ArticleLink article={a} className="mt-0.5 block font-serif text-[1.1rem] leading-snug hover:underline">
                {a.title}
              </ArticleLink>
            </li>
          ))}
          <li className="py-3">
            <span className="t-meta">Découverte</span>
            <Link to={`/decouvrir/${props.discoveryId}`} className="mt-0.5 block font-serif text-[1.1rem] leading-snug hover:underline">
              {props.discoveryTitle}
            </Link>
          </li>
          <li className="py-3">
            <span className="t-meta">Question du jour</span>
            <p className="mt-0.5 font-serif text-[1.1rem] leading-snug">{props.reflectionPrompt}</p>
          </li>
        </ul>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/jouer/quiz" variant="accent" size="lg">
          Continuer avec le quiz du jour
        </ButtonLink>
        <ButtonLink to="/" variant="outline" size="lg">
          Retour à l'accueil
        </ButtonLink>
        <Button variant="quiet" size="lg" onClick={props.onRestart} icon={<RotateCcw size={17} aria-hidden />}>
          Recommencer le parcours
        </Button>
      </div>
    </div>
  )
}
