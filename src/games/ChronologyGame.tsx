import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { GameFrame, GameResult } from '../components/game/GameFrame'
import { Button } from '../components/ui/Button'
import { LiveRegion } from '../components/ui/bits'
import type { HistoryEvent } from '../content'
import { drawChronology } from '../lib/gameLogic'
import { actions, useAppState } from '../lib/store'

const ROUNDS = 3
const PER_ROUND = 5


const fmtYear = (y: number) => (y < 0 ? `${-y} av. J.-C.` : String(y))

export default function ChronologyGame() {
  const [game, setGame] = useState(0)
  const [round, setRound] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(false)
  const best = useAppState((s) => s.scores['chronologie']?.best)
  const events = useMemo(() => drawChronology(Math.floor(Math.random() * 1e9), PER_ROUND), [game, round]) // eslint-disable-line react-hooks/exhaustive-deps

  if (done) {
    return (
      <GameFrame title="La chronologie">
        <GameResult
          score={total}
          max={ROUNDS * PER_ROUND}
          unit="événements bien placés"
          best={best}
          message={total === ROUNDS * PER_ROUND ? 'Chronologie parfaite. Le temps n’a pas de secret pour toi.' : 'Les années sont révélées après chaque manche : de bons repères pour la prochaine fois.'}
          onReplay={() => {
            setGame((g) => g + 1)
            setRound(0)
            setTotal(0)
            setDone(false)
          }}
        />
      </GameFrame>
    )
  }

  return (
    <GameFrame title="La chronologie" subtitle="Remets ces événements dans l’ordre, du plus ancien au plus récent." progress={{ value: round, max: ROUNDS, label: 'Manches jouées' }}>
      <Round
        key={`${game}-${round}`}
        events={events}
        onDone={(score) => {
          const nt = total + score
          setTotal(nt)
          // Le record retient la meilleure manche (5 = parfaite) : utile pour le badge.
          actions.recordScore('chronologie', score, PER_ROUND)
          if (round + 1 >= ROUNDS) setDone(true)
          else setRound(round + 1)
        }}
        last={round + 1 >= ROUNDS}
      />
    </GameFrame>
  )
}

function Round({ events, onDone, last }: { events: HistoryEvent[]; onDone: (score: number) => void; last: boolean }) {
  const [order, setOrder] = useState(events)
  const [checked, setChecked] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const correct = useMemo(() => [...events].sort((a, b) => a.year - b.year), [events])
  const score = order.filter((e, i) => correct[i]?.id === e.id).length

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return
    const next = order.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    setOrder(next)
    setAnnounce(`« ${item!.label} » déplacé en position ${to + 1} sur ${order.length}.`)
  }

  // Glisser-déposer au pointeur (souris et tactile) : on déplace dès qu'on passe sur une autre ligne.
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragIndex === null || !listRef.current) return
    const items = [...listRef.current.querySelectorAll<HTMLElement>('[data-row]')]
    const over = items.findIndex((el) => {
      const r = el.getBoundingClientRect()
      return e.clientY >= r.top && e.clientY <= r.bottom
    })
    if (over !== -1 && over !== dragIndex) {
      move(dragIndex, over)
      setDragIndex(over)
    }
  }

  return (
    <div>
      <LiveRegion>{announce}</LiveRegion>
      <p className="t-meta">Glisse les cartes avec la poignée, ou utilise les flèches. Le plus ancien en haut.</p>
      <ol ref={listRef} className="mt-4 space-y-2.5" onPointerMove={onPointerMove} onPointerUp={() => setDragIndex(null)} onPointerCancel={() => setDragIndex(null)}>
        {order.map((e, i) => {
          const ok = checked && correct[i]?.id === e.id
          return (
            <li
              key={e.id}
              data-row
              className={`flex items-center gap-2 rounded-[18px] border-[1.5px] bg-paper p-2 pr-3 transition-shadow ${dragIndex === i ? 'border-ink shadow-lift' : checked ? (ok ? 'border-ok bg-ok-bg' : 'border-ko bg-ko-bg') : 'border-ink/15'}`}
            >
              {!checked && (
                <button
                  type="button"
                  aria-label={`Déplacer « ${e.label} » (glisser)`}
                  className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-ink-3 hover:bg-ink/6 active:cursor-grabbing"
                  onPointerDown={(ev) => {
                    ev.preventDefault()
                    ;(ev.currentTarget.parentElement?.parentElement as HTMLElement | null)?.setPointerCapture?.(ev.pointerId)
                    setDragIndex(i)
                  }}
                  tabIndex={-1}
                >
                  <GripVertical size={18} aria-hidden />
                </button>
              )}
              <span className={`w-6 shrink-0 text-center font-serif text-[1.2rem] ${checked ? '' : 'text-ink-3'}`} aria-hidden>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 py-1">
                <p className="leading-snug font-semibold">{e.label}</p>
                {checked && (
                  <p className="mt-0.5 text-[0.875rem] text-ink-2">
                    <strong className="text-ink">{fmtYear(e.year)}</strong> — {e.detail}{' '}
                    <a href={e.source.url} target="_blank" rel="noopener noreferrer" className="link-ed">
                      Source
                    </a>
                  </p>
                )}
              </div>
              {!checked && (
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 hover:border-ink disabled:opacity-30" aria-label={`Monter « ${e.label} »`}>
                    <ArrowUp size={17} aria-hidden />
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 hover:border-ink disabled:opacity-30" aria-label={`Descendre « ${e.label} »`}>
                    <ArrowDown size={17} aria-hidden />
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {!checked ? (
        <Button className="mt-6" size="lg" variant="accent" onClick={() => setChecked(true)}>
          Valider l'ordre
        </Button>
      ) : (
        <div className="mt-6" aria-live="polite">
          <p className="t-h3">
            {score === PER_ROUND ? 'Ordre parfait !' : `${score} sur ${PER_ROUND} à la bonne place.`}
          </p>
          {score < PER_ROUND && (
            <p className="mt-1 text-ink-2">
              Le bon ordre : {correct.map((c) => `${c.label} (${fmtYear(c.year)})`).join(' → ')}.
            </p>
          )}
          <Button className="mt-4" size="lg" onClick={() => onDone(score)} autoFocus>
            {last ? 'Voir le résultat' : 'Manche suivante'}
          </Button>
        </div>
      )}
    </div>
  )
}
