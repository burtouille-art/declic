import { Layers } from 'lucide-react'
import { useMemo } from 'react'
import { clusterAnalyses, clusterItems, diversityLine, PerspectiveList } from '../../components/news/Perspectives'
import { StoryRow } from '../../components/news/Story'
import { analysisFeed, perspectiveClusters, type Cluster, type NewsData } from '../../lib/news'

/**
 * « Un sujet, plusieurs regards » : pour les événements couverts par plusieurs médias,
 * leurs titres côte à côte (texte original) et les analyses qui s'y rapportent.
 */
export function Viewpoints({ data, exclude, onCompare }: { data: NewsData; exclude?: string | null; onCompare: (c: Cluster) => void }) {
  const clusters = useMemo(() => perspectiveClusters(data, 3, exclude ? new Set([exclude]) : undefined), [data, exclude])
  if (!clusters.length) return null
  const [first, ...others] = clusters
  return (
    <section className="wrap mt-16 lg:mt-24" aria-labelledby="regards-title">
      <div className="grid gap-x-10 gap-y-3 border-t-2 border-ink pt-4 lg:grid-cols-12">
        <h2 id="regards-title" className="t-h1 lg:col-span-5">
          Un sujet, plusieurs regards
        </h2>
        <p className="t-body text-ink-2 lg:col-span-6 lg:col-start-7">
          Les titres de plusieurs médias sur un même événement, tels qu’ils les ont publiés. Compare les mots choisis, ce qui est mis en avant, ce qui manque.
        </p>
      </div>
      <div className="mt-8 grid gap-x-10 gap-y-10 lg:grid-cols-12">
        {first && <Topic cluster={first} data={data} onCompare={onCompare} className="lg:col-span-7" />}
        <div className="space-y-10 lg:col-span-5">
          {others.map((c) => (
            <Topic key={c.id} cluster={c} data={data} onCompare={onCompare} compact />
          ))}
        </div>
      </div>
    </section>
  )
}

function Topic({ cluster, data, onCompare, compact = false, className = '' }: { cluster: Cluster; data: NewsData; onCompare: (c: Cluster) => void; compact?: boolean; className?: string }) {
  const items = clusterItems(cluster, data.byId)
  const shown = compact ? items.slice(0, 3) : items.slice(0, 6)
  return (
    <article className={className}>
      <p className="t-label text-ink-2">{diversityLine(cluster)}</p>
      <div className="mt-2">
        <PerspectiveList items={shown} analyses={clusterAnalyses(cluster, data.byId)} compact={compact} />
      </div>
      {items.length > shown.length && (
        <button type="button" onClick={() => onCompare(cluster)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1.5 text-[0.8125rem] font-semibold hover:bg-paper-3">
          <Layers size={14} aria-hidden /> Voir les {items.length} titres
        </button>
      )}
    </article>
  )
}

/** Prendre du recul : décryptages d'un côté, opinions signées de l'autre, un article par média. */
export function StepBack({ data }: { data: NewsData }) {
  const analyses = useMemo(() => analysisFeed(data, 4, 'analysis'), [data])
  const opinions = useMemo(() => analysisFeed(data, 4, 'opinion'), [data])
  if (!analyses.length && !opinions.length) return null
  return (
    <section className="mt-16 bg-paper-2 py-10 lg:mt-24 lg:py-14" aria-labelledby="recul-title">
      <div className="wrap">
        <h2 id="recul-title" className="t-h1">
          Prendre du recul
        </h2>
        <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-2">
          {analyses.length > 0 && (
            <div>
              <h3 className="t-h3">Décrypter</h3>
              <p className="t-meta mt-1">Analyses et explications : le contexte, les chiffres, les causes.</p>
              <div className="mt-2 divide-y divide-rule border-t border-ink">
                {analyses.map((a) => (
                  <StoryRow key={a.id} article={a} showCategory={false} />
                ))}
              </div>
            </div>
          )}
          {opinions.length > 0 && (
            <div>
              <h3 className="t-h3">Débattre</h3>
              <p className="t-meta mt-1">Tribunes et entretiens publiés par plusieurs médias : des opinions signées, à lire comme des points de vue, pas comme des faits.</p>
              <div className="mt-2 divide-y divide-rule border-t border-ink">
                {opinions.map((a) => (
                  <StoryRow key={a.id} article={a} showCategory={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
