import { Layers } from 'lucide-react'
import { ArticlePhoto } from '../../components/news/ArticlePhoto'
import { clusterAnalyses, clusterItems, diversityLine, PerspectiveList } from '../../components/news/Perspectives'
import { photoShape } from '../../components/news/photo'
import { StoryRow } from '../../components/news/Story'
import { SectionHeading } from '../../components/ui/bits'
import type { Article, Cluster, NewsData } from '../../lib/news'

/**
 * « Un sujet, plusieurs regards » : pour les événements couverts par plusieurs médias,
 * leurs titres côte à côte (texte original) et les analyses qui s'y rapportent.
 * `photos` : pour chaque sujet, l'article dont la photo peut être montrée (déjà dédoublonnée sur la page).
 */
export function Viewpoints({ data, clusters, photos, onCompare }: { data: NewsData; clusters: Cluster[]; photos: Map<string, Article>; onCompare: (c: Cluster) => void }) {
  if (!clusters.length) return null
  const [first, ...others] = clusters
  return (
    <section className="wrap mt-14 lg:mt-24" aria-labelledby="regards-title">
      <SectionHeading
        id="regards-title"
        title="Un sujet, plusieurs regards"
        description="Les titres de plusieurs médias sur un même événement, tels qu’ils les ont publiés. Compare les mots choisis, ce qui est mis en avant, ce qui manque."
      />
      <div className="mt-5 grid gap-x-10 gap-y-10 lg:mt-6 lg:grid-cols-12">
        {first && <Topic cluster={first} data={data} photo={photos.get(first.id)} onCompare={onCompare} wide className="lg:col-span-7" />}
        <div className="space-y-10 lg:col-span-5">
          {others.map((c) => (
            <Topic key={c.id} cluster={c} data={data} photo={photos.get(c.id)} onCompare={onCompare} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Topic({ cluster, data, photo, onCompare, wide = false, className = '' }: { cluster: Cluster; data: NewsData; photo?: Article; onCompare: (c: Cluster) => void; wide?: boolean; className?: string }) {
  const items = clusterItems(cluster, data.byId)
  const shown = wide ? items.slice(0, 6) : items.slice(0, 3)
  const image = photo?.image ?? null
  const shape = image ? photoShape(image) : null
  const big = wide && image && shape === 'wide'
  return (
    <article className={className}>
      {big && image && <ArticlePhoto image={image} variant="hero" className="mb-4" />}
      <div className={image && !big ? 'flex items-start justify-between gap-4' : ''}>
        <p className="t-label text-ink-2">{diversityLine(cluster)}</p>
        {image && !big && (wide ? <ArticlePhoto image={image} variant="thumb" thumbSize="w-[112px]" /> : <ArticlePhoto image={image} variant="thumb" />)}
      </div>
      <div className="mt-2">
        <PerspectiveList items={shown} analyses={clusterAnalyses(cluster, data.byId)} compact={!wide} />
      </div>
      {items.length > shown.length && (
        <button type="button" onClick={() => onCompare(cluster)} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-paper-2 px-3.5 text-[0.8125rem] font-semibold hover:bg-paper-3">
          <Layers size={14} aria-hidden /> Voir les {items.length} titres
        </button>
      )}
    </article>
  )
}

/** Prendre du recul : décryptages d'un côté, opinions signées de l'autre, un article par média. */
export function StepBack({ analyses, opinions, allowed }: { analyses: Article[]; opinions: Article[]; allowed: Set<string> }) {
  if (!analyses.length && !opinions.length) return null
  return (
    <section className="mt-14 bg-paper-2 py-10 lg:mt-24 lg:py-14" aria-labelledby="recul-title">
      <div className="wrap">
        <SectionHeading id="recul-title" title="Prendre du recul" />
        <div className="mt-5 grid gap-x-12 gap-y-10 lg:mt-6 lg:grid-cols-2">
          {analyses.length > 0 && (
            <div>
              <h3 className="t-h3">Décrypter</h3>
              <p className="t-meta mt-1">Analyses et explications : le contexte, les chiffres, les causes.</p>
              <div className="mt-2 divide-y divide-rule border-t border-ink">
                {analyses.map((a) => (
                  <StoryRow key={a.id} article={a} showCategory={false} showPhoto={allowed.has(a.id)} />
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
