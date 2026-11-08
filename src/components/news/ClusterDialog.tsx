import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Article, Cluster } from '../../lib/news'
import { clusterAnalyses, diversityLine, PerspectiveList } from './Perspectives'
import { ArticleLink, Meta } from './Story'

/**
 * Vue comparative : un même événement vu par plusieurs médias.
 * Uniquement les titres originaux et les liens. Aucune étiquette de « bord politique » :
 * le lecteur compare lui-même les angles.
 */
export function ClusterDialog({ cluster, byId, onClose }: { cluster: Cluster | null; byId: Map<string, Article>; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (cluster && !d.open) d.showModal()
    if (!cluster && d.open) d.close()
  }, [cluster])
  const articles = cluster ? cluster.articleIds.map((id) => byId.get(id)).filter((a): a is Article => !!a) : []
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(42rem,calc(100vw-2rem))] max-h-[85dvh] overflow-auto rounded-[22px] bg-paper p-0 text-ink shadow-lift backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      aria-labelledby="cluster-title"
    >
      {cluster && (
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="t-meta">Comparer les couvertures</p>
              <h2 id="cluster-title" className="mt-1 t-h2">
                {articles.length} médias, un même événement
              </h2>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-ink/8" aria-label="Fermer">
              <X size={20} aria-hidden />
            </button>
          </div>
          <p className="mt-1 t-meta">{diversityLine(cluster)}</p>
          <p className="mt-3 text-[0.9375rem] text-ink-2">
            Ces titres ont été rapprochés automatiquement : ils citent les mêmes noms propres peu courants ou partagent plusieurs mots clés, à moins de 36 heures d'intervalle. Lis-les côte à côte.
          </p>
          <ul className="mt-3 space-y-1 rounded-[16px] bg-paper-2 p-3.5 text-[0.9375rem]">
            <li>Quel fait chaque titre met-il en premier ?</li>
            <li>Quels mots changent d’un média à l’autre (verbes, adjectifs) ?</li>
            <li>Qui est cité, et qui ne l’est pas ?</li>
          </ul>
          <ol className="mt-5 divide-y divide-rule border-y border-rule">
            {articles.map((a) => (
              <li key={a.id} className="headline-link relative py-4">
                <Meta article={a} showCategory={false} />
                <p className="mt-1.5 t-h3">
                  <ArticleLink article={a} className="headline stretched">
                    {a.title}
                  </ArticleLink>
                </p>
              </li>
            ))}
          </ol>
          {cluster.analysisIds.length > 0 && (
            <div className="mt-2">
              <PerspectiveList items={[]} analyses={clusterAnalyses(cluster, byId)} />
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
