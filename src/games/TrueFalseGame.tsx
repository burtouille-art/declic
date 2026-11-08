import { Check, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { GameFrame, GameResult, type RecapItem } from '../components/game/GameFrame'
import { Button } from '../components/ui/Button'
import { STATEMENTS, STATEMENT_BY_ID } from '../content'
import { dailyStatements } from '../lib/daily'
import { shuffle } from '../lib/random'
import { dueIds, nextEntry } from '../lib/srs'
import { actions, getState, useAppState } from '../lib/store'

export default function TrueFalseGame() {
  const [round, setRound] = useState(0)
  const items = useMemo(() => {
    // 1re partie du jour : sélection quotidienne, enrichie des affirmations à réviser ; ensuite : tirage libre.
    if (round === 0) {
      const due = dueIds(getState().srs).filter((id) => id.startsWith('tf-')).map((id) => STATEMENT_BY_ID.get(id)!).filter(Boolean).slice(0, 3)
      const daily = dailyStatements(new Date(), 10).filter((s) => !due.includes(s))
      return [...due, ...daily].slice(0, 10)
    }
    return shuffle(STATEMENTS).slice(0, 10)
  }, [round])
  return (
    <GameFrame title="Vrai ou faux ?" subtitle="Des affirmations qui testent tes connaissances… et tes intuitions.">
      <Run key={round} items={items} onReplay={() => setRound((r) => r + 1)} />
    </GameFrame>
  )
}

function Run({ items, onReplay }: { items: typeof STATEMENTS; onReplay: () => void }) {
  const [i, setI] = useState(0)
  const [choice, setChoice] = useState<boolean | null>(null)
  const [recap, setRecap] = useState<RecapItem[]>([])
  const [done, setDone] = useState(false)
  const best = useAppState((s) => s.scores['vrai-faux']?.best)
  const s = items[i]

  const answer = useCallback(
    (v: boolean) => {
      if (!s || choice !== null) return
      setChoice(v)
      const ok = v === s.answer
      setRecap((r) => [...r, { prompt: s.statement, ok, detail: s.answer ? 'Vrai' : 'Faux', sourceUrl: s.source.url }])
      actions.updateSrs(s.id, nextEntry(getState().srs[s.id], ok))
    },
    [s, choice],
  )
  const next = () => {
    if (i + 1 >= items.length) {
      actions.recordScore('vrai-faux', recap.filter((r) => r.ok).length, items.length)
      setDone(true)
    } else {
      setI(i + 1)
      setChoice(null)
    }
  }

  useEffect(() => {
    if (choice !== null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'v' || e.key === 'V' || e.key === 'ArrowLeft') answer(true)
      if (e.key === 'f' || e.key === 'F' || e.key === 'ArrowRight') answer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer, choice])

  if (done) {
    const score = recap.filter((r) => r.ok).length
    return <GameResult score={score} max={items.length} best={best} message={score >= 8 ? "Ton intuition est bien calibrée." : score >= 5 ? 'Quelques idées reçues sont tombées aujourd’hui.' : 'Beaucoup d’idées reçues sont très répandues : tu viens d’en déboulonner plusieurs.'} recap={recap} onReplay={onReplay} replayLabel="Nouvelle série" />
  }
  if (!s) return null
  const ok = choice !== null && choice === s.answer
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label="Avancement" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={i}>
          <div className="h-full rounded-full bg-vermilion transition-[width] duration-500" style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span className="t-meta tabular-nums">
          {i + 1}/{items.length}
        </span>
      </div>
      <blockquote className="mt-8 border-l-4 border-ink pl-5">
        <p className="font-serif text-[1.75rem] leading-snug font-medium text-pretty sm:text-[2.1rem]" style={{ fontVariationSettings: "'opsz' 40" }}>
          {s.statement}
        </p>
      </blockquote>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {[true, false].map((v) => {
          const chosen = choice === v
          const correct = choice !== null && v === s.answer
          return (
            <button
              key={String(v)}
              type="button"
              disabled={choice !== null}
              onClick={() => answer(v)}
              className={`flex h-20 items-center justify-center gap-2 rounded-[20px] border-2 font-serif text-[1.6rem] font-medium transition-colors disabled:cursor-default ${
                choice === null ? 'border-ink/20 hover:border-ink hover:bg-paper-2' : correct ? 'border-ok bg-ok-bg' : chosen ? 'border-ko bg-ko-bg' : 'border-ink/10 text-ink-3'
              }`}
            >
              {choice !== null && correct && <Check aria-hidden />}
              {choice !== null && chosen && !correct && <X aria-hidden />}
              {v ? 'Vrai' : 'Faux'}
              {chosen && <span className="sr-only"> (ta réponse)</span>}
            </button>
          )
        })}
      </div>
      <p className="t-meta mt-3 hidden sm:block">Clavier : V ou ← pour vrai, F ou → pour faux.</p>
      {choice !== null && (
        <div className={`mt-6 rounded-[20px] border-l-4 p-5 ${ok ? 'border-ok bg-ok-bg' : 'border-ko bg-ko-bg'}`} aria-live="polite">
          <p className="t-h3">{ok ? 'Bien vu.' : 'Raté !'}</p>
          <p className="mt-1.5 leading-relaxed">{s.explanation}</p>
          <p className="t-meta mt-2">
            Source :{' '}
            <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="link-ed text-ink-2">
              {s.source.label}
            </a>
          </p>
          <Button className="mt-4" onClick={next} autoFocus>
            {i + 1 >= items.length ? 'Voir mon score' : 'Affirmation suivante'}
          </Button>
        </div>
      )}
    </div>
  )
}
