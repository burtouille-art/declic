/**
 * L'anneau Déclic : cinq segments, comme les cinq écrans du parcours quotidien.
 * C'est la signature visuelle du site (logo, progression, calendrier).
 */
type Props = {
  progress?: number // 0 à 5 segments remplis
  size?: number
  stroke?: number
  className?: string
  title?: string
  tone?: 'vermilion' | 'paper' | 'petrol'
  track?: 'rule' | 'paper' | 'transparent'
}

const SEGMENTS = 5
const GAP_DEG = 14

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180
  const sx = cx + r * Math.cos(rad(startDeg))
  const sy = cy + r * Math.sin(rad(startDeg))
  const ex = cx + r * Math.cos(rad(endDeg))
  const ey = cy + r * Math.sin(rad(endDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

const toneVar = { vermilion: 'var(--vermilion)', paper: 'var(--paper)', petrol: 'var(--petrol)' }
const trackVar = { rule: 'var(--rule)', paper: 'color-mix(in oklab, var(--paper) 42%, transparent)', transparent: 'transparent' }

export function DeclicRing({ progress = 0, size = 28, stroke, className = '', title, tone = 'vermilion', track = 'rule' }: Props) {
  const sw = stroke ?? Math.max(2.5, size / 9)
  const r = (size - sw) / 2
  const c = size / 2
  const span = 360 / SEGMENTS
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const start = i * span + GAP_DEG / 2
        const end = (i + 1) * span - GAP_DEG / 2
        const filled = i < progress
        return (
          <path
            key={i}
            d={arcPath(c, c, r, start, end)}
            fill="none"
            stroke={filled ? toneVar[tone] : trackVar[track]}
            strokeWidth={sw}
            strokeLinecap="round"
            style={{ transition: 'stroke 300ms ease' }}
          />
        )
      })}
    </svg>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <DeclicRing size={26} progress={5} />
      <span className="font-serif text-[1.55rem] leading-none font-semibold italic tracking-[-0.03em]" style={{ fontVariationSettings: "'opsz' 48" }}>
        déclic
      </span>
    </span>
  )
}
