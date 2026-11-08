import { CheckCircle2, CircleAlert, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErrorState, Skeleton } from '../components/ui/bits'
import { formatDateTime, relativeTime } from '../lib/format'
import { useStatus } from '../lib/news'

/**
 * Diagnostic des sources, pour le propriétaire du site. Ne contient que des informations
 * publiques (URL des flux, nombre d'articles, erreurs réseau) : aucun secret n'existe côté navigateur.
 */
export default function DiagnosticPage() {
  const { data, error, loading, reload } = useStatus()
  return (
    <div className="wrap pt-6 lg:pt-10">
      <p className="t-meta">
        <Link to="/" className="hover:underline">Accueil</Link> / Diagnostic
      </p>
      <h1 className="mt-2 t-h1">État des sources</h1>
      <p className="mt-2 measure text-ink-2">Résultat de la dernière collecte automatique (GitHub Actions, toutes les 6 heures). Une source en erreur n'efface pas ses articles récents : la version précédente est conservée.</p>

      {loading && !data && <Skeleton className="mt-6 h-64 w-full" />}
      {error && !data && (
        <div className="mt-6">
          <ErrorState title="Le fichier de diagnostic est introuvable." message={error} onRetry={reload} />
        </div>
      )}
      {data && (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { k: 'Dernière collecte', v: relativeTime(data.generatedAt), sub: formatDateTime(data.generatedAt) },
              { k: 'Sources en ligne', v: `${data.sourcesOk}/${data.sourcesTotal}` },
              { k: 'Articles publiés', v: String(data.articleCount), sub: `fraîcheur max. ${data.maxAgeDays} jours` },
              { k: 'Rapprochements', v: String(data.clusterCount) },
              { k: 'Mode', v: data.mode === 'live' ? 'Collecte réelle' : 'Instantané', sub: `${(data.durationMs / 1000).toFixed(1)} s` },
            ].map((x) => (
              <div key={x.k} className="rounded-[18px] bg-paper-2 p-4">
                <dt className="t-meta">{x.k}</dt>
                <dd className="mt-1 font-serif text-[1.5rem] leading-tight">{x.v}</dd>
                {x.sub && <dd className="t-meta">{x.sub}</dd>}
              </div>
            ))}
          </dl>
          {data.keptPreviousData && (
            <p className="mt-4 rounded-[14px] bg-ko-bg p-4 font-semibold" role="status">
              La dernière collecte a récupéré trop peu d'articles : les données valides précédentes ont été conservées.
            </p>
          )}
          {data.mode === 'snapshot' && (
            <p className="mt-4 rounded-[14px] bg-sun/40 p-4" role="status">
              Ces données proviennent de l'instantané de démarrage. Lance le workflow « Collecte et déploiement » (onglet Actions de GitHub) pour une collecte réelle.
            </p>
          )}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[0.9375rem]">
              <caption className="sr-only">Détail par source</caption>
              <thead>
                <tr className="border-b border-ink t-meta">
                  <th scope="col" className="py-2 font-semibold">Source</th>
                  <th scope="col" className="py-2 font-semibold">État</th>
                  <th scope="col" className="py-2 text-right font-semibold">Articles</th>
                  <th scope="col" className="py-2 font-semibold">Plus récent</th>
                  <th scope="col" className="py-2 font-semibold">Dernier succès</th>
                  <th scope="col" className="py-2 font-semibold">Détail</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s) => (
                  <tr key={s.id} className="border-b border-rule align-top">
                    <th scope="row" className="py-2.5 pr-3 font-medium">
                      {s.name}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="block t-meta link-ed break-all">
                        {s.id}
                      </a>
                    </th>
                    <td className="py-2.5 pr-3">
                      {s.ok ? (
                        <span className="inline-flex items-center gap-1 text-ok">
                          <CheckCircle2 size={16} aria-hidden /> OK
                        </span>
                      ) : s.usedFallback ? (
                        <span className="inline-flex items-center gap-1 text-sun-ink">
                          <History size={16} aria-hidden /> Secours
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ko">
                          <CircleAlert size={16} aria-hidden /> Erreur
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {s.kept}
                      <span className="t-meta"> / {s.entries}</span>
                    </td>
                    <td className="py-2.5 pr-3">{s.newestItemAt ? relativeTime(s.newestItemAt) : '—'}</td>
                    <td className="py-2.5 pr-3">{s.lastSuccessAt ? relativeTime(s.lastSuccessAt) : 'jamais'}</td>
                    <td className="py-2.5 text-ink-2">{s.error ?? s.warning ?? ''}</td>
                  </tr>
                ))}
                {data.onThisDay && (
                  <tr className="border-b border-rule">
                    <th scope="row" className="py-2.5 font-medium">{data.onThisDay.name}</th>
                    <td className="py-2.5">{data.onThisDay.ok ? <span className="text-ok">OK</span> : <span className="text-ko">Erreur</span>}</td>
                    <td className="py-2.5 text-right">{data.onThisDay.days.length} j</td>
                    <td colSpan={2} />
                    <td className="py-2.5 text-ink-2">{data.onThisDay.error ?? ''}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-4 t-meta">« Articles » : retenus après filtrage (fraîcheur, validité) / présents dans le flux.</p>
        </>
      )}
    </div>
  )
}
