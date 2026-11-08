import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import type { Dataset } from '../../content/datasets'
import { SourceLine } from '../ui/bits'

const W = 640
const H = 300
const PAD = { l: 48, r: 18, t: 22, b: 34 }

/**
 * Graphique manipulable : on parcourt les points au doigt, à la souris ou au clavier
 * (flèches), on peut comparer deux années, et un tableau accessible reprend les données.
 */
export function LineChart({ dataset }: { dataset: Dataset }) {
  const id = useId()
  const pts = dataset.points
  const [i, setI] = useState(pts.length - 1)
  const [from, setFrom] = useState(0)
  const [showTable, setShowTable] = useState(false)

  const { sx, sy, yTicks, path, area } = useMemo(() => {
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const x0 = Math.min(...xs)
    const x1 = Math.max(...xs)
    const yMin = Math.min(...ys)
    const yMax = Math.max(...ys)
    const span = yMax - yMin
    const lo = Math.floor((yMin - span * 0.08) / niceStep(span)) * niceStep(span)
    const hi = Math.ceil((yMax + span * 0.05) / niceStep(span)) * niceStep(span)
    const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r)
    const sy = (y: number) => H - PAD.b - ((y - lo) / (hi - lo)) * (H - PAD.t - PAD.b)
    const step = niceStep(span)
    const yTicks: number[] = []
    for (let v = lo; v <= hi + 1e-9; v += step) yTicks.push(Number(v.toFixed(4)))
    const path = pts.map((p, k) => `${k ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')
    const area = `${path} L${sx(x1).toFixed(1)},${H - PAD.b} L${sx(x0).toFixed(1)},${H - PAD.b} Z`
    return { sx, sy, yTicks, path, area }
  }, [pts])

  const cur = pts[i] ?? pts[pts.length - 1]!
  const base = pts[from] ?? pts[0]!
  const delta = cur.y - base.y
  const pct = base.y ? (delta / base.y) * 100 : 0
  const fmt = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: dataset.decimals, maximumFractionDigits: dataset.decimals })

  const pick = (clientX: number, rect: DOMRect) => {
    const x = ((clientX - rect.left) / rect.width) * W
    let best = 0
    pts.forEach((p, k) => {
      if (Math.abs(sx(p.x) - x) < Math.abs(sx(pts[best]!.x) - x)) best = k
    })
    setI(best)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setI((v) => Math.min(pts.length - 1, v + 1))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setI((v) => Math.max(0, v - 1))
    else if (e.key === 'Home') setI(0)
    else if (e.key === 'End') setI(pts.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <figure className="rounded-[22px] bg-paper-2 p-4 sm:p-6">
      <figcaption>
        <p className="t-h3">{dataset.title}</p>
        <p className="t-meta mt-0.5">{dataset.note}</p>
      </figcaption>

      <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-2" aria-live="polite">
        <p>
          <span className="block t-meta">En {cur.x}</span>
          <span className="font-serif text-[2.4rem] leading-none font-medium tabular-nums">{fmt(cur.y)}</span>
          <span className="ml-1.5 t-label text-ink-2">{dataset.unit}</span>
        </p>
        {i !== from && (
          <p className="pb-1 text-[0.9375rem]">
            <span className={delta >= 0 ? 'text-vermilion-ink' : 'text-petrol-ink'}>
              {delta >= 0 ? '+' : '−'}
              {fmt(Math.abs(delta))} {dataset.unit} ({delta >= 0 ? '+' : '−'}
              {Math.abs(pct).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} %)
            </span>{' '}
            <span className="text-ink-2">depuis {base.x}</span>
          </p>
        )}
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={`Année affichée sur le graphique « ${dataset.title} »`}
        aria-valuemin={pts[0]!.x}
        aria-valuemax={pts[pts.length - 1]!.x}
        aria-valuenow={cur.x}
        aria-valuetext={`${cur.x} : ${fmt(cur.y)} ${dataset.unit}`}
        onKeyDown={onKey}
        className="mt-3 cursor-crosshair touch-none rounded-lg"
        onPointerDown={(e) => {
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          pick(e.clientX, e.currentTarget.getBoundingClientRect())
        }}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && pick(e.clientX, e.currentTarget.getBoundingClientRect())}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--vermilion)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--vermilion)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} stroke="var(--rule)" strokeWidth="1" />
              <text x={PAD.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="12" fill="var(--ink-3)" fontFamily="var(--font-sans)">
                {t.toLocaleString('fr-FR')}
              </text>
            </g>
          ))}
          {[pts[0]!, pts[Math.floor(pts.length / 2)]!, pts[pts.length - 1]!].map((p) => (
            <text key={p.x} x={sx(p.x)} y={H - 10} textAnchor="middle" fontSize="12" fill="var(--ink-3)" fontFamily="var(--font-sans)">
              {p.x}
            </text>
          ))}
          <path d={area} fill={`url(#${id}-g)`} />
          <path d={path} fill="none" stroke="var(--vermilion)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, k) => (
            <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={k === i ? 0 : 2.5} fill="var(--vermilion)" />
          ))}
          <line x1={sx(base.x)} x2={sx(base.x)} y1={PAD.t} y2={H - PAD.b} stroke="var(--ink-3)" strokeDasharray="3 4" />
          <line x1={sx(cur.x)} x2={sx(cur.x)} y1={PAD.t} y2={H - PAD.b} stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx={sx(cur.x)} cy={sy(cur.y)} r="7" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.875rem]">
        <label className="inline-flex items-center gap-2">
          <span className="text-ink-2">Comparer avec</span>
          <select value={from} onChange={(e) => setFrom(Number(e.target.value))} className="h-9 rounded-full border border-ink/25 bg-paper px-3 font-semibold">
            {pts.map((p, k) => (
              <option key={p.x} value={k}>
                {p.x}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable} className="font-semibold underline underline-offset-2">
          {showTable ? 'Masquer' : 'Afficher'} les données
        </button>
        <span className="t-meta">Astuce : flèches ← → au clavier</span>
      </div>
      {showTable && (
        <table className="mt-3 w-full max-w-sm text-[0.875rem] tabular-nums">
          <caption className="sr-only">{dataset.title}</caption>
          <thead>
            <tr className="border-b border-rule text-left">
              <th scope="col" className="py-1 font-semibold">Année</th>
              <th scope="col" className="py-1 text-right font-semibold">{dataset.unit}</th>
            </tr>
          </thead>
          <tbody>
            {pts.map((p) => (
              <tr key={p.x} className="border-b border-rule/60">
                <td className="py-1">{p.x}</td>
                <td className="py-1 text-right">{fmt(p.y)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <SourceLine source={dataset.source} className="mt-3" />
    </figure>
  )
}

function niceStep(span: number) {
  const raw = span / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow
}
