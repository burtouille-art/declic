import { geoArea, geoNaturalEarth1, geoPath, geoCentroid, type GeoPermissibleObjects } from 'd3-geo'
import { useEffect, useMemo, useState } from 'react'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { Skeleton } from '../ui/bits'

type CountryFeature = Feature<Geometry, { name: string }> & { id: string }

let cache: CountryFeature[] | null = null
async function loadCountries(): Promise<CountryFeature[]> {
  if (cache) return cache
  // Natural Earth 1:110m via world-atlas (domaine public), embarqué dans le build.
  const topo = (await import('world-atlas/countries-110m.json')).default as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
  const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>
  cache = fc.features.filter((f) => f.id !== '010').map((f) => ({ ...f, id: String(f.id) })) as CountryFeature[] // sans l'Antarctique
  return cache
}

export type Fill = 'base' | 'muted' | 'highlight' | 'selected' | 'ok' | 'ko' | 'heat1' | 'heat2' | 'heat3'

const FILLS: Record<Fill, string> = {
  base: 'color-mix(in oklab, var(--ink) 20%, var(--paper-2))',
  muted: 'color-mix(in oklab, var(--ink) 9%, var(--paper-2))',
  highlight: 'var(--vermilion)',
  selected: 'var(--ink)',
  ok: 'var(--ok)',
  ko: 'var(--ko)',
  heat1: 'color-mix(in oklab, var(--vermilion) 40%, var(--paper-2))',
  heat2: 'color-mix(in oklab, var(--vermilion) 70%, var(--paper-2))',
  heat3: 'var(--vermilion)',
}

type Pin = { id: string; label: string }

/** Écarte les repères trop proches (pays voisins) pour qu'ils restent tous touchables. */
function spread(points: ([number, number] | null)[], min: number): ([number, number] | null)[] {
  const pts = points.map((p) => (p ? ([...p] as [number, number]) : null))
  for (let it = 0; it < 30; it++) {
    let moved = false
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]
        const b = pts[j]
        if (!a || !b) continue
        const dx = b[0] - a[0]
        const dy = b[1] - a[1]
        const d = Math.hypot(dx, dy) || 0.01
        if (d < min) {
          const push = (min - d) / 2
          const ux = d > 0.01 ? dx / d : 1
          const uy = d > 0.01 ? dy / d : 0
          a[0] -= ux * push
          a[1] -= uy * push
          b[0] += ux * push
          b[1] += uy * push
          moved = true
        }
      }
    if (!moved) break
  }
  return pts
}

/** Centre du plus grand morceau du pays (sinon la France « tombe » dans l'Atlantique à cause de la Guyane). */
function mainCentroid(f: CountryFeature): [number, number] {
  const g = f.geometry
  if (g.type === 'MultiPolygon') {
    let best = g.coordinates[0]!
    let bestArea = -1
    for (const poly of g.coordinates) {
      const a = geoArea({ type: 'Polygon', coordinates: poly })
      if (a > bestArea) {
        bestArea = a
        best = poly
      }
    }
    return geoCentroid({ type: 'Polygon', coordinates: best })
  }
  return geoCentroid(f)
}

export function WorldMap({
  fills = {},
  fitIds,
  onPick,
  pins = [],
  onPin,
  pinState = {},
  label,
  height = 420,
  fitBox,
  marker,
}: {
  fills?: Record<string, Fill>
  fitIds?: string[]
  onPick?: (id: string) => void
  pins?: Pin[]
  onPin?: (id: string) => void
  pinState?: Record<string, 'ok' | 'ko' | 'idle'>
  label: string
  height?: number
  /** Cadre [[ouest, sud], [est, nord]] en degrés : plus fiable que l'emprise des pays (la Russie traverse l'antiméridien). */
  fitBox?: [[number, number], [number, number]]
  /** Pays à signaler par un cercle (utile pour les petits pays). */
  marker?: string
}) {
  const [features, setFeatures] = useState<CountryFeature[] | null>(cache)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!features) loadCountries().then(setFeatures).catch(() => setError(true))
  }, [features])

  const W = 960
  const { path, centroids } = useMemo(() => {
    if (!features) return { path: null, centroids: new Map<string, [number, number]>() }
    const target: GeoPermissibleObjects = fitBox
      ? {
          type: 'MultiPoint',
          coordinates: [fitBox[0], fitBox[1], [fitBox[0][0], fitBox[1][1]], [fitBox[1][0], fitBox[0][1]], [(fitBox[0][0] + fitBox[1][0]) / 2, fitBox[1][1]], [(fitBox[0][0] + fitBox[1][0]) / 2, fitBox[0][1]]],
        }
      : ({ type: 'FeatureCollection', features } as GeoPermissibleObjects)
    const projection = geoNaturalEarth1().fitExtent(
      [
        [16, 16],
        [W - 16, height - 16],
      ],
      target,
    )
    const path = geoPath(projection)
    const centroids = new Map<string, [number, number]>()
    for (const f of features) {
      const p = projection(mainCentroid(f))
      if (p) centroids.set(f.id, p as [number, number])
    }
    return { path, centroids }
  }, [features, fitBox, height])

  if (error) return <p className="t-meta">La carte n'a pas pu être chargée.</p>
  if (!features || !path) return <Skeleton className="w-full" />

  return (
    <div className="relative w-full overflow-hidden rounded-[18px] bg-paper-2">
      <svg viewBox={`0 0 ${W} ${height}`} className="block h-auto w-full touch-manipulation" role="img" aria-label={label}>
        <g>
          {features.map((f) => {
            const fill = fills[f.id] ?? (fitIds?.length && !fitIds.includes(f.id) ? 'muted' : 'base')
            const d = path(f)
            if (!d) return null
            return (
              <path
                key={f.id}
                d={d}
                fill={FILLS[fill]}
                stroke="var(--paper-2)"
                strokeWidth={0.8}
                onClick={onPick ? () => onPick(f.id) : undefined}
                className={onPick ? 'cursor-pointer transition-[fill] hover:brightness-95' : undefined}
              />
            )
          })}
        </g>
        {marker && centroids.get(marker) && (
          <circle cx={centroids.get(marker)![0]} cy={centroids.get(marker)![1]} r={22} fill="none" stroke="var(--ink)" strokeWidth={2.5} strokeDasharray="5 4" />
        )}
      </svg>
      {spread(pins.map((p) => centroids.get(p.id) ?? null), 70).map((c, k) => {
        const p = pins[k]!
        if (!c) return null
        const st = pinState[p.id] ?? 'idle'
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPin?.(p.id)}
            aria-label={p.label}
            className={`absolute flex h-8 w-8 sm:h-9 sm:w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[0.875rem] font-bold shadow-lift hover:ring-4 hover:ring-vermilion/40 ${
              st === 'ok' ? 'border-ok bg-ok text-paper' : st === 'ko' ? 'border-ko bg-ko text-paper' : 'border-ink bg-paper text-ink'
            }`}
            style={{ left: `${(c[0] / W) * 100}%`, top: `${(c[1] / height) * 100}%` }}
          >
            {k + 1}
          </button>
        )
      })}
    </div>
  )
}
