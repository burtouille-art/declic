import type { Fiche } from '../../content'

/**
 * Pictogrammes maison, au trait, un par thème des fiches. Géométrie simple,
 * couleurs du système (encre + un accent), aucun visuel tiers.
 */
export function ThemeGlyph({ theme, size = 96, className = '' }: { theme: Fiche['theme']; size?: number; className?: string }) {
  const ink = 'var(--ink)'
  const acc = 'var(--vermilion)'
  const pet = 'var(--petrol)'
  const common = { fill: 'none', stroke: ink, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className={className} aria-hidden>
      {theme === 'univers' && (
        <>
          <circle cx="48" cy="48" r="13" fill={acc} />
          <ellipse cx="48" cy="48" rx="40" ry="15" {...common} transform="rotate(-20 48 48)" />
          <circle cx="83" cy="35" r="5" fill={ink} />
          <circle cx="16" cy="18" r="1.8" fill={ink} />
          <circle cx="78" cy="80" r="1.8" fill={ink} />
          <circle cx="22" cy="76" r="1.2" fill={ink} />
        </>
      )}
      {theme === 'corps-cerveau' && (
        <>
          <path d="M30 70 C14 64 12 42 24 32 C26 18 44 12 52 20 C64 12 82 22 78 38 C88 48 80 66 66 66 C62 76 44 78 40 70 Z" {...common} />
          <path d="M48 22 C44 34 54 40 48 52 C44 60 50 66 48 74" {...common} />
          <circle cx="34" cy="44" r="4" fill={acc} />
          <circle cx="64" cy="50" r="4" fill={pet} />
          <path d="M34 44 L48 52 L64 50" {...common} strokeWidth={1.6} strokeDasharray="3 4" />
        </>
      )}
      {theme === 'terre-climat' && (
        <>
          <circle cx="62" cy="26" r="11" fill={acc} />
          <circle cx="44" cy="56" r="26" {...common} />
          <path d="M22 48 C32 44 36 54 46 50 C54 46 56 38 66 42" {...common} />
          <path d="M24 66 C34 62 42 70 52 64 C60 60 64 66 68 62" {...common} stroke={pet} />
        </>
      )}
      {theme === 'histoire' && (
        <>
          <path d="M22 80 H74 M26 72 H70 M30 72 V36 M42 72 V36 M54 72 V36 M66 72 V36 M24 36 H72 L48 18 Z" {...common} />
          <circle cx="48" cy="28" r="3.5" fill={acc} />
        </>
      )}
      {theme === 'technologie' && (
        <>
          <circle cx="48" cy="48" r="14" {...common} />
          <circle cx="48" cy="48" r="5" fill={acc} />
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k * Math.PI) / 4
            return <line key={k} x1={48 + Math.cos(a) * 20} y1={48 + Math.sin(a) * 20} x2={48 + Math.cos(a) * 30} y2={48 + Math.sin(a) * 30} {...common} />
          })}
          <path d="M14 82 H30 V70 M82 14 H66 V26" {...common} stroke={pet} />
        </>
      )}
      {theme === 'societe' && (
        <>
          <circle cx="48" cy="48" r="32" {...common} />
          <path d="M48 26 V48 L64 58" {...common} />
          <circle cx="48" cy="48" r="4" fill={acc} />
          <path d="M16 48 H22 M74 48 H80 M48 16 V20 M48 76 V80" {...common} stroke={pet} />
        </>
      )}
    </svg>
  )
}
