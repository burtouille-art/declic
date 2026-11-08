import { Pause, Play, Timer } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameFrame, GameResult, type RecapItem } from '../components/game/GameFrame'
import { Button } from '../components/ui/Button'
import { Choices, shuffleOptions } from '../components/ui/Choices'
import { QUESTIONS, STATEMENTS } from '../content'
import { shuffle } from '../lib/random'
import { actions, useAppState } from '../lib/store'

type Item = { id: string; prompt: string; options: string[]; answer: number; detail: string; url: string }

function buildPool(): Item[] {
  const qs: Item[] = QUESTIONS.filter((q) => q.level <= 2).map((q) => {
    const s = shuffleOptions(q.options, q.answer)
    return { id: q.id, prompt: q.prompt, options: s.options, answer: s.answer, detail: q.options[q.answer]!, url: q.source.url }
  })
  const tf: Item[] = STATEMENTS.map((s) => ({ id: s.id, prompt: `Vrai ou faux : ${s.statement}`, options: ['Vrai', 'Faux'], answer: s.answer ? 0 : 1, detail: s.answer ? 'Vrai' : 'Faux', url: s.source.url }))
  return shuffle([...qs, ...tf])
}

const DURATIONS = [
  { s: 60, label: '60 secondes' },
  { s: 120, label: '2 minutes (temps étendu)' },
]

export default function SixtyGame() {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro')
  const [duration, setDuration] = useState(60)
  const [pool, setPool] = useState<Item[]>([])
  const [recap, setRecap] = useState<RecapItem[]>([])
  const best = useAppState((s) => s.scores['60-secondes']?.best)

  const start = () => {
    setPool(buildPool())
    setRecap([])
    setPhase('play')
  }
  const end = useCallback(
    (r: RecapItem[]) => {
      setRecap(r)
      const score = r.filter((x) => x.ok).length
      // Seul le format officiel de 60 secondes alimente le record.
      if (duration === 60) actions.recordScore('60-secondes', score)
      setPhase('done')
    },
    [duration],
  )

  return (
    <GameFrame title="Le défi des 60 secondes" subtitle="Un maximum de bonnes réponses avant la fin du chrono. Pas de pénalité : passe si tu sèches.">
      {phase === 'intro' && (
        <div>
          <fieldset>
            <legend className="t-label">Durée</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button key={d.s} type="button" aria-pressed={duration === d.s} onClick={() => setDuration(d.s)} className={`h-10 rounded-full border px-4 font-semibold ${duration === d.s ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="mt-3 text-[0.9375rem] text-ink-2">Le chrono peut être mis en pause à tout moment. {best !== undefined && `Ton record : ${best}.`}</p>
          <Button className="mt-6" size="lg" variant="accent" onClick={start} icon={<Timer size={19} aria-hidden />}>
            Lancer le chrono
          </Button>
        </div>
      )}
      {phase === 'play' && <Play_ pool={pool} duration={duration} onEnd={end} />}
      {phase === 'done' && (
        <GameResult
          score={recap.filter((r) => r.ok).length}
          unit={`bonnes réponses en ${duration === 60 ? '60 secondes' : '2 minutes'}`}
          best={best}
          message={`${recap.length} questions vues. ${recap.filter((r) => !r.ok).length ? 'Les corrections sont juste en dessous.' : ''}`}
          recap={recap}
          onReplay={start}
        />
      )}
    </GameFrame>
  )
}

function Play_({ pool, duration, onEnd }: { pool: Item[]; duration: number; onEnd: (r: RecapItem[]) => void }) {
  const [left, setLeft] = useState(duration)
  const [paused, setPaused] = useState(false)
  const [i, setI] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const recap = useRef<RecapItem[]>([])
  const item = pool[i % pool.length]!
  const ended = useRef(false)

  useEffect(() => {
    if (paused) return
    const t = window.setInterval(() => setLeft((l) => l - 1), 1000)
    return () => window.clearInterval(t)
  }, [paused])
  useEffect(() => {
    if (left <= 0 && !ended.current) {
      ended.current = true
      onEnd(recap.current)
    }
  }, [left, onEnd])
  // Pause automatique si l'onglet passe en arrière-plan
  useEffect(() => {
    const onVis = () => document.hidden && setPaused(true)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const select = (k: number) => {
    if (sel !== null || paused) return
    setSel(k)
    recap.current = [...recap.current, { prompt: item.prompt, ok: k === item.answer, detail: `Réponse : ${item.detail}`, sourceUrl: item.url }]
    window.setTimeout(() => {
      setSel(null)
      setI((x) => x + 1)
    }, 450)
  }
  const skip = () => {
    recap.current = [...recap.current, { prompt: item.prompt, ok: false, detail: `Passée. Réponse : ${item.detail}`, sourceUrl: item.url }]
    setI((x) => x + 1)
  }
  const score = useMemo(() => recap.current.filter((r) => r.ok).length, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  const pct = (left / duration) * 100

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className={`font-serif text-[2.6rem] leading-none tabular-nums ${left <= 10 ? 'text-vermilion-ink' : ''}`} role="timer" aria-live={left <= 10 && left % 5 === 0 ? 'assertive' : 'off'} aria-label={`${left} secondes restantes`}>
          {left}
          <span className="text-[1.2rem]">s</span>
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10" aria-hidden>
          <div className="h-full rounded-full bg-vermilion transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <span className="t-label tabular-nums" aria-live="polite">
          {score} pts
        </span>
        <button type="button" onClick={() => setPaused((p) => !p)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 hover:border-ink" aria-label={paused ? 'Reprendre' : 'Mettre en pause'}>
          {paused ? <Play size={17} aria-hidden /> : <Pause size={17} aria-hidden />}
        </button>
      </div>
      {paused ? (
        <div className="mt-10 rounded-[22px] bg-paper-2 p-8 text-center">
          <p className="t-h2">Pause</p>
          <Button className="mt-4" onClick={() => setPaused(false)} icon={<Play size={17} aria-hidden />}>
            Reprendre
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="font-serif text-[1.5rem] leading-snug font-medium text-pretty sm:text-[1.75rem]">{item.prompt}</h2>
          <div className="mt-5">
            <Choices key={i} options={item.options} selected={sel} correct={item.answer} onSelect={select} legend={item.prompt} compact />
          </div>
          <Button variant="quiet" className="mt-4" onClick={skip}>
            Passer
          </Button>
        </div>
      )}
    </div>
  )
}
