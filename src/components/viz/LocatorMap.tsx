import { geoBounds, geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo'
import { MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { loadCountries, mainPolygon, type CountryFeature } from './WorldMap'

/**
 * Carte de situation : remplace la photo de presse (dont les droits ne sont pas acquis)
 * par une information utile, « où ça se passe ». Uniquement des pays explicitement cités.
 */
export default function LocatorMap({ ids, names, height = 260 }: { ids: string[]; names: string[]; height?: number }) {
  const [features, setFeatures] = useState<CountryFeature[] | null>(null)
  useEffect(() => {
    loadCountries().then(setFeatures).catch(() => setFeatures([]))
  }, [])
  const W = 960
  const drawn = useMemo(() => {
    if (!features?.length) return null
    const focus = features.find((f) => f.id === ids[0])
    if (!focus) return null
    const [[w, s], [e, n]] = geoBounds(mainPolygon(focus))
    const pad = Math.max(7, (e - w) * 1.1, (n - s) * 1.1)
    const box = { type: 'MultiPoint' as const, coordinates: [[w - pad * 1.6, s - pad], [e + pad * 1.6, n + pad], [w - pad * 1.6, n + pad], [e + pad * 1.6, s - pad]] }
    const projection = geoNaturalEarth1().fitExtent([[0, 0], [W, height]], box)
    const path = geoPath(projection)
    const c = projection(geoCentroid(mainPolygon(focus)))
    return { path, c }
  }, [features, ids, height])

  if (!drawn) return <div className="skeleton rounded-[18px]" style={{ aspectRatio: `${W} / ${height}` }} aria-hidden />
  return (
    <figure className="overflow-hidden rounded-[18px] bg-paper-2">
      <svg viewBox={`0 0 ${W} ${height}`} className="block h-auto w-full" role="img" aria-label={`Carte de situation : ${names.join(', ')}`}>
        <defs>
          <pattern id="loc-sea" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="var(--rule)" />
          </pattern>
        </defs>
        <rect width={W} height={height} fill="url(#loc-sea)" />
        {features!.map((f) => {
          const d = drawn.path(f)
          if (!d) return null
          const hit = ids.includes(f.id)
          return <path key={f.id} d={d} fill={hit ? 'var(--vermilion)' : 'color-mix(in oklab, var(--ink) 16%, var(--paper-2))'} stroke="var(--paper-2)" strokeWidth={hit ? 1.4 : 0.8} />
        })}
        {drawn.c && (
          <g transform={`translate(${drawn.c[0]},${drawn.c[1]})`}>
            <circle r="34" fill="none" stroke="var(--ink)" strokeWidth="2" strokeDasharray="4 5" />
          </g>
        )}
      </svg>
      <figcaption className="flex items-center gap-1.5 px-4 py-2.5 t-meta">
        <MapPin size={13} aria-hidden className="text-vermilion-ink" /> Cité dans le titre : <strong className="font-semibold text-ink-2">{names.join(', ')}</strong>
      </figcaption>
    </figure>
  )
}
