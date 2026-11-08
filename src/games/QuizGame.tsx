import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Feedback, GameFrame, GameResult, type RecapItem } from '../components/game/GameFrame'
import { Button, ButtonLink } from '../components/ui/Button'
import { EmptyState, Skeleton } from '../components/ui/bits'
import { Choices, shuffleOptions } from '../components/ui/Choices'
import { QUESTION_BY_ID, QUESTIONS, THEMES, type Theme } from '../content'
import { CATEGORY_BY_ID } from '../content/categories'
import { ActuCorrection } from '../components/game/ActuCorrection'
import { actuQuiz, dailyQuiz, fromQuestion, type QuizItem } from '../lib/daily'
import { useNewsQuiz, useOnThisDay } from '../lib/news'
import { dayKey, hashString, mulberry32, shuffle } from '../lib/random'
import { dueIds, nextEntry } from '../lib/srs'
import { actions, getState, useAppState } from '../lib/store'

const THEME_LABEL: Record<Theme, string> = {
  sciences: 'Sciences', espace: 'Espace', histoire: 'Histoire', geographie: 'Géographie', culture: 'Culture',
  corps: 'Corps & cerveau', nature: 'Nature', technologie: 'Technologie', langue: 'Langue',
}

const categoryLabel = (id: string) => (CATEGORY_BY_ID as Record<string, { label: string } | undefined>)[id]?.label ?? id

type Mode = 'jour' | 'libre' | 'revisions'

export default function QuizGame() {
  const [params, setParams] = useSearchParams()
  const mode = (params.get('mode') ?? 'jour') as Mode
  const otd = useOnThisDay()
  const news = useNewsQuiz()
  const srs = useAppState((s) => s.srs)
  const [theme, setTheme] = useState<Theme | 'all'>('all')
  const [round, setRound] = useState(0)
  const [started, setStarted] = useState(mode !== 'libre')

  const actu = useMemo(() => actuQuiz(news.data), [news.data])
  // Sans assez de titres exploitables (collecte en panne, hors ligne…), on revient au quiz de culture du jour.
  const fallback = mode === 'jour' && actu.length === 0
  const items: QuizItem[] = useMemo(() => {
    if (mode === 'jour') return actu.length ? actu : dailyQuiz(new Date(), otd.data)
    if (mode === 'revisions') return dueIds(srs).map((id) => QUESTION_BY_ID.get(id)).filter((q) => !!q).slice(0, 10).map((q) => fromQuestion(q!))
    const pool = theme === 'all' ? QUESTIONS : QUESTIONS.filter((q) => q.theme === theme)
    return shuffle(pool).slice(0, 10).map(fromQuestion)
    // round force un nouveau tirage ; srs volontairement figé au démarrage d'une session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, actu, otd.data, theme, round, started])

  const switchMode = (m: Mode) => {
    setParams(m === 'jour' ? {} : { mode: m })
    setStarted(m !== 'libre')
    setRound((r) => r + 1)
  }

  return (
    <GameFrame
      title={mode === 'jour' ? (fallback ? 'Le quiz du jour' : 'Le quiz de l’actu') : mode === 'revisions' ? 'Révisions' : 'Culture générale'}
      subtitle={
        mode === 'jour'
          ? fallback
            ? 'Les titres du jour ne sont pas disponibles : voici dix questions de culture générale.'
            : 'Retrouve le mot qui manque dans les vrais titres des dernières 48 heures. À chaque réponse : l’article d’origine et ce qu’en disent d’autres médias.'
          : mode === 'revisions'
            ? 'Les questions que tu as ratées reviennent au bon moment.'
            : 'Dix questions tirées au hasard dans la banque, chacune sourcée.'
      }
      aside={
        <div className="flex gap-1" role="tablist" aria-label="Mode de jeu">
          {(['jour', 'libre', 'revisions'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`h-9 rounded-full px-3 text-[0.8125rem] font-semibold ${mode === m ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-ink/6'}`}
            >
              {m === 'jour' ? 'Actu' : m === 'libre' ? 'Culture' : 'Révisions'}
            </button>
          ))}
        </div>
      }
    >
      {mode === 'jour' && ((news.loading && !news.data && !news.error) || (fallback && otd.loading && !otd.data && !otd.error)) ? (
        // On attend les données avant de figer les 10 questions (sinon le quiz changerait en cours de partie).
        <div role="status" className="space-y-3">
          <span className="sr-only">Préparation du quiz…</span>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : mode === 'libre' && !started ? (
        <div>
          <p className="t-label">Choisis un thème</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['all', ...THEMES] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={theme === t}
                onClick={() => setTheme(t)}
                className={`h-10 rounded-full border px-4 text-[0.9375rem] font-semibold ${theme === t ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}
              >
                {t === 'all' ? 'Tous les thèmes' : THEME_LABEL[t]}
              </button>
            ))}
          </div>
          <Button className="mt-6" size="lg" variant="accent" onClick={() => setStarted(true)}>
            Lancer 10 questions
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={mode === 'revisions' ? 'Rien à réviser pour le moment.' : 'Aucune question disponible.'}>
          {mode === 'revisions' ? 'Les questions ratées reviennent ici le lendemain, puis à intervalles de plus en plus longs.' : null}
          <div className="mt-4">
            <ButtonLink to="/jouer/quiz?mode=libre" variant="outline">
              Faire un quiz libre
            </ButtonLink>
          </div>
        </EmptyState>
      ) : (
        <QuizRun key={`${mode}-${round}-${items.map((i) => i.id).join()}`} items={items} mode={mode} onReplay={() => setRound((r) => r + 1)} />
      )}
    </GameFrame>
  )
}

function QuizRun({ items, mode, onReplay }: { items: QuizItem[]; mode: Mode; onReplay: () => void }) {
  const [seed] = useState(() => (mode === 'jour' ? dayKey() : String(Math.random())))
  const shuffled = useMemo(() => items.map((q) => shuffleOptions(q.options, q.answer, mulberry32(hashString(seed + q.id)))), [items, seed])
  const [i, setI] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [recap, setRecap] = useState<RecapItem[]>([])
  const [done, setDone] = useState(false)
  const q = items[i]
  const s = shuffled[i]
  const score = recap.filter((r) => r.ok).length
  const scoreKey = items[0]?.origin === 'actu' ? 'quiz-actu' : mode === 'jour' ? 'quiz-du-jour' : 'quiz-libre'
  const best = useAppState((st) => st.scores[scoreKey]?.best)

  const select = useCallback(
    (k: number) => {
      if (!q || !s || sel !== null) return
      setSel(k)
      const ok = k === s.answer
      setRecap((r) => [...r, { prompt: q.actu?.text ? q.actu.article.title : q.prompt, ok, detail: q.actu ? `${q.actu.article.sourceName} · réponse : ${q.actu.solution}` : `Réponse : ${q.options[q.answer]}`, sourceUrl: q.source.url }])
      if (q.origin === 'banque') actions.updateSrs(q.id, nextEntry(getState().srs[q.id], ok))
    },
    [q, s, sel],
  )
  const next = () => {
    if (i + 1 >= items.length) {
      const final = recap.filter((r) => r.ok).length
      actions.recordScore(scoreKey, final, items.length)
      setDone(true)
    } else {
      setI(i + 1)
      setSel(null)
    }
  }

  if (done) {
    const ratio = score / items.length
    return (
      <GameResult
        score={score}
        max={items.length}
        best={best}
        message={items[0]?.origin === 'actu' ? (ratio === 1 ? 'Sans faute : tu suis l’actualité de près.' : ratio >= 0.6 ? 'Bien informé ! Les articles sont dans le récapitulatif si tu veux creuser.' : 'Tu sais maintenant ce qui s’est passé : ouvre les articles du récapitulatif pour aller plus loin.') : ratio === 1 ? 'Sans faute. Impressionnant.' : ratio >= 0.7 ? 'Très solide. Les erreurs reviendront en révision.' : ratio >= 0.4 ? 'Pas mal ! Les questions ratées reviendront dans tes révisions.' : 'Chaque erreur est une chose apprise : elles reviendront en révision pour s’ancrer.'}
        recap={recap}
        onReplay={onReplay}
        replayLabel={mode === 'jour' ? 'Refaire ce quiz' : 'Nouvelle série'}
        extra={
          recap.some((r) => !r.ok) && mode !== 'revisions' ? (
            <ButtonLink to="/jouer/quiz?mode=revisions" variant="outline" size="lg">
              Mes révisions
            </ButtonLink>
          ) : undefined
        }
      />
    )
  }
  if (!q || !s) return null
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label="Avancement du quiz" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={i + (sel !== null ? 1 : 0)}>
          <div className="h-full rounded-full bg-vermilion transition-[width] duration-500" style={{ width: `${((i + (sel !== null ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
        <span className="t-meta tabular-nums">
          {i + 1}/{items.length} · {score} pt{score > 1 ? 's' : ''}
        </span>
      </div>
      <p className="mt-6 t-meta">
        {q.origin === 'ephemeride' ? 'Ce jour-là · éphéméride Wikipédia' : q.origin === 'actu' ? `Actu · ${categoryLabel(q.theme)}` : THEME_LABEL[q.theme as Theme] ?? q.theme}
      </p>
      {q.actu?.text ? (
        <>
          <h2 className="mt-1 t-label text-ink-2">{q.prompt}</h2>
          <blockquote className="mt-2 border-l-4 border-ink pl-4 font-serif text-[1.5rem] leading-snug font-medium text-pretty sm:text-[1.85rem]" style={{ fontVariationSettings: "'opsz' 36" }}>
            <ClozeText text={q.actu.text} />
          </blockquote>
          <p className="mt-2 t-meta">Titre publié par {q.actu.article.sourceName}</p>
        </>
      ) : (
        <h2 className="mt-1 font-serif text-[1.6rem] leading-snug font-medium text-pretty sm:text-[1.9rem]" style={{ fontVariationSettings: "'opsz' 36" }}>
          {q.prompt}
        </h2>
      )}
      <div className="mt-6">
        <Choices options={s.options} selected={sel} correct={s.answer} onSelect={select} legend={q.actu?.text ? `${q.prompt} ${q.actu.text.replace('……', 'mot manquant')}` : q.prompt} />
      </div>
      <p className="t-meta mt-3 hidden sm:block">Astuce : touches 1 à 4 pour répondre, Entrée pour continuer.</p>
      {sel !== null && (
        <Feedback
          ok={sel === s.answer}
          explanation={q.explanation}
          source={q.source}
          onNext={next}
          nextLabel={i + 1 >= items.length ? 'Voir mon score' : 'Question suivante'}
          detail={q.actu ? <ActuCorrection item={q} /> : undefined}
        />
      )}
    </div>
  )
}

/** Le titre avec son trou, rendu lisible par les lecteurs d'écran. */
function ClozeText({ text }: { text: string }) {
  const [before, after] = text.split('……')
  if (after === undefined) return <>{text}</>
  return (
    <>
      {before}
      <span className="mx-0.5 inline-block min-w-[3.5ch] border-b-[3px] border-vermilion align-baseline" aria-hidden>
        {'\u2003'}
      </span>
      <span className="sr-only">(mot manquant)</span>
      {after}
    </>
  )
}
