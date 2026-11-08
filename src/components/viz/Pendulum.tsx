import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

const GRAVITY = [
  { id: 'terre', label: 'Terre', g: 9.81 },
  { id: 'lune', label: 'Lune', g: 1.62 },
  { id: 'mars', label: 'Mars', g: 3.71 },
  { id: 'jupiter', label: 'Jupiter', g: 24.79 },
] as const

/**
 * Mini-expérience : période d'un pendule simple, T = 2π√(L/g).
 * La masse est modifiable… et ne change rien : c'est précisément ce qu'on veut faire constater.
 */
export function Pendulum() {
  const [L, setL] = useState(1)
  const [mass, setMass] = useState(1)
  const [gi, setGi] = useState(0)
  const [running, setRunning] = useState(true)
  const reduce = useReducedMotion()
  const g = GRAVITY[gi]!.g
  const T = 2 * Math.PI * Math.sqrt(L / g)
  const bob = useRef<SVGGElement>(null)
  const start = useRef(performance.now())

  useEffect(() => {
    start.current = performance.now()
  }, [L, g])

  useEffect(() => {
    if (!running || reduce) {
      bob.current?.setAttribute('transform', `rotate(${reduce ? 14 : 0} 160 20)`)
      return
    }
    let raf = 0
    const tick = (now: number) => {
      const t = (now - start.current) / 1000
      const angle = 18 * Math.cos((2 * Math.PI * t) / T)
      bob.current?.setAttribute('transform', `rotate(${angle.toFixed(2)} 160 20)`)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [T, running, reduce])

  const lengthPx = 40 + L * 85
  const radius = 9 + mass * 4

  return (
    <div className="grid gap-5 rounded-[22px] bg-paper-2 p-4 sm:grid-cols-[1fr_1.1fr] sm:p-6">
      <svg viewBox="0 0 320 260" className="w-full" role="img" aria-label={`Pendule de ${L.toFixed(1)} m sur ${GRAVITY[gi]!.label} : une oscillation complète dure ${T.toFixed(2)} secondes.`}>
        <line x1="90" x2="230" y1="20" y2="20" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <g ref={bob}>
          <line x1="160" x2="160" y1="20" y2={20 + lengthPx} stroke="var(--ink-2)" strokeWidth="1.5" />
          <circle cx="160" cy={20 + lengthPx} r={radius} fill="var(--vermilion)" stroke="var(--ink)" strokeWidth="1.5" />
        </g>
        <circle cx="160" cy="20" r="4" fill="var(--ink)" />
      </svg>
      <div>
        <p className="t-meta">Période (un aller-retour)</p>
        <p className="font-serif text-[2.6rem] leading-none font-medium tabular-nums" aria-live="polite">
          {T.toLocaleString('fr-FR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} s
        </p>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="flex justify-between t-label">
              Longueur du fil <span className="tabular-nums">{L.toLocaleString('fr-FR')} m</span>
            </span>
            <input type="range" min={0.2} max={2.4} step={0.1} value={L} onChange={(e) => setL(Number(e.target.value))} className="mt-1 w-full accent-[var(--vermilion)]" />
          </label>
          <label className="block">
            <span className="flex justify-between t-label">
              Masse de la boule <span className="tabular-nums">{mass} kg</span>
            </span>
            <input type="range" min={1} max={5} step={1} value={mass} onChange={(e) => setMass(Number(e.target.value))} className="mt-1 w-full accent-[var(--vermilion)]" />
          </label>
          <fieldset>
            <legend className="t-label">Pesanteur</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {GRAVITY.map((x, k) => (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={gi === k}
                  onClick={() => setGi(k)}
                  className={`h-9 rounded-full border px-3.5 text-[0.875rem] font-semibold ${gi === k ? 'border-ink bg-ink text-paper' : 'border-ink/25 hover:border-ink'}`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </fieldset>
          {!reduce && (
            <button type="button" onClick={() => setRunning((r) => !r)} className="text-[0.875rem] font-semibold underline underline-offset-2">
              {running ? "Mettre l'animation en pause" : "Relancer l'animation"}
            </button>
          )}
        </div>
        <p className="mt-4 text-[0.875rem] text-ink-2">
          As-tu remarqué ? Changer la masse ne modifie pas la période. Sur la Lune, le même pendule est environ 2,5 fois plus lent.
        </p>
      </div>
    </div>
  )
}
