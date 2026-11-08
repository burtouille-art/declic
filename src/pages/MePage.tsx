import { ExternalLink, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState, ProgressBar } from '../components/ui/bits'
import { DeclicRing } from '../components/ui/DeclicRing'
import { CATEGORIES } from '../content/categories'
import { COUNTRIES, DISCOVERIES, FICHES, PATHS } from '../content'
import { BADGES, streak } from '../lib/badges'
import { relativeTime } from '../lib/format'
import { dayKey } from '../lib/random'
import { actions, resetState, useAppState, type CategoryId, type SavedItem } from '../lib/store'

const GAMES = [
  { id: 'quiz-du-jour', label: 'Quiz du jour', max: 10 },
  { id: 'quiz-libre', label: 'Quiz libre', max: 10 },
  { id: 'vrai-faux', label: 'Vrai ou faux', max: 10 },
  { id: 'chronologie', label: 'Chronologie (meilleure manche)', max: 5 },
  { id: '60-secondes', label: 'Défi 60 secondes' },
  { id: 'voyage', label: 'Grand voyage', max: 10 },
  { id: 'declic', label: 'Déclic du jour', max: 4 },
]

function itemLink(i: SavedItem) {
  if (i.type === 'article' && i.url) return { href: i.url, external: true }
  if (i.type === 'fiche') return { href: `/apprendre/${i.id.replace(/^f:/, '')}`, external: false }
  return { href: `/decouvrir/${i.id.replace(/^d:/, '')}`, external: false }
}

function ItemList({ items, empty }: { items: SavedItem[]; empty: string }) {
  if (!items.length) return <p className="py-4 text-ink-2">{empty}</p>
  return (
    <ul className="divide-y divide-rule">
      {items.map((i) => {
        const l = itemLink(i)
        return (
          <li key={i.id + i.at} className="flex items-baseline justify-between gap-4 py-3">
            <div className="min-w-0">
              <span className="t-meta">
                {i.type === 'article' ? `Article${i.meta ? ` · ${i.meta}` : ''}` : i.type === 'fiche' ? 'Fiche' : 'Découverte'} · {relativeTime(i.at)}
              </span>
              {l.external ? (
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="block font-serif text-[1.1rem] leading-snug hover:underline">
                  {i.title} <ExternalLink size={12} className="inline" aria-hidden />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              ) : (
                <Link to={l.href} className="block font-serif text-[1.1rem] leading-snug hover:underline">
                  {i.title}
                </Link>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function MePage() {
  const state = useAppState((s) => s)
  const [confirmReset, setConfirmReset] = useState(false)
  const st = streak(state.declic)
  const last14 = useMemo(() => {
    const out: { key: string; label: string; v: number }[] = []
    for (let k = 13; k >= 0; k--) {
      const d = new Date()
      d.setDate(d.getDate() - k)
      const key = dayKey(d)
      const day = state.declic[key]
      out.push({ key, label: d.toLocaleDateString('fr-FR', { weekday: 'narrow', day: 'numeric' }), v: day?.completed ? 5 : (day?.step ?? 0) })
    }
    return out
  }, [state.declic])

  const toggleCat = (id: CategoryId) => {
    const cur = state.prefs.categories
    actions.setPrefs({ categories: cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id] })
  }

  return (
    <div className="wrap pt-6 lg:pt-10">
      <header className="border-b border-ink pb-6">
        <h1 className="t-display">Mon espace</h1>
        <p className="mt-3 t-lede measure text-ink-2">Pas de compte, pas de serveur : tout ce qui est ici reste dans ce navigateur, sur cet appareil.</p>
      </header>

      {/* Tableau de progression */}
      <section className="mt-8 grid gap-6 lg:grid-cols-12" aria-labelledby="prog-title">
        <h2 id="prog-title" className="sr-only">
          Ma progression
        </h2>
        <div className="rounded-[26px] bg-petrol p-6 text-on-petrol lg:col-span-7">
          <p className="t-label text-on-petrol/90">Mes 14 derniers jours de Déclic</p>
          <ol className="mt-4 grid grid-cols-7 gap-y-4" aria-label="Calendrier des Déclic">
            {last14.map((d) => (
              <li key={d.key} className="flex flex-col items-center gap-1">
                <DeclicRing size={34} progress={d.v} tone="paper" track="paper" stroke={4.5} title={`${d.key} : ${d.v >= 5 ? 'terminé' : d.v ? `étape ${d.v} sur 5` : 'non commencé'}`} />
                <span className="text-[0.6875rem] text-on-petrol/90">{d.label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 font-serif text-[1.5rem]">{st ? `${st} jour${st > 1 ? 's' : ''} d'affilée` : 'Un Déclic aujourd’hui pour lancer une série ?'}</p>
        </div>
        <dl className="grid grid-cols-2 gap-4 lg:col-span-5">
          {[
            { k: 'Découvertes révélées', v: `${state.discovered.length}/${DISCOVERIES.length}` },
            { k: 'Fiches terminées', v: `${state.learned.length}/${FICHES.length}` },
            { k: 'Pays trouvés', v: `${state.countriesFound.length}/${COUNTRIES.length}` },
            { k: 'Articles ouverts', v: String(state.history.filter((h) => h.type === 'article').length) },
          ].map((x) => (
            <div key={x.k} className="rounded-[20px] bg-paper-2 p-4">
              <dt className="t-meta">{x.k}</dt>
              <dd className="mt-1 font-serif text-[2rem] leading-none tabular-nums">{x.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="paths-me">
        <h2 id="paths-me" className="t-h2">
          Mes parcours
        </h2>
        <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATHS.map((p) => {
            const done = p.fiches.filter((f) => state.learned.includes(f)).length
            return (
              <li key={p.id}>
                <Link to={`/apprendre/${p.fiches.find((f) => !state.learned.includes(f)) ?? p.fiches[0]}?parcours=${p.id}`} className="t-label hover:underline">
                  {p.title}
                </Link>
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar value={done} max={p.fiches.length} label={p.title} tone="petrol" />
                  <span className="t-meta">{done}/{p.fiches.length}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="scores-title">
        <h2 id="scores-title" className="t-h2">
          Mes jeux
        </h2>
        <table className="mt-4 w-full max-w-2xl text-left">
          <thead>
            <tr className="border-b border-ink t-meta">
              <th scope="col" className="py-2 font-semibold">Jeu</th>
              <th scope="col" className="py-2 text-right font-semibold">Record</th>
              <th scope="col" className="py-2 text-right font-semibold">Dernier</th>
              <th scope="col" className="py-2 text-right font-semibold">Parties</th>
            </tr>
          </thead>
          <tbody>
            {GAMES.map((g) => {
              const s = state.scores[g.id]
              return (
                <tr key={g.id} className="border-b border-rule tabular-nums">
                  <th scope="row" className="py-2.5 font-medium">{g.label}</th>
                  <td className="py-2.5 text-right">{s ? `${s.best}${g.max ? `/${g.max}` : ''}` : '—'}</td>
                  <td className="py-2.5 text-right">{s ? s.last : '—'}</td>
                  <td className="py-2.5 text-right">{s?.plays ?? 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-12" aria-labelledby="badges-title">
        <h2 id="badges-title" className="t-h2">
          Badges
        </h2>
        <p className="mt-1 text-ink-2">Des repères de régularité et de curiosité. Aucun classement.</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BADGES.map((b) => {
            const got = state.badges[b.id]
            return (
              <li key={b.id} className={`rounded-[20px] p-4 ${got ? 'bg-sun text-[#171b1d]' : 'border border-dashed border-rule text-ink-3'}`}>
                <DeclicRing size={28} progress={got ? 5 : 0} />
                <p className={`mt-2 font-semibold ${got ? '' : 'text-ink-2'}`}>{b.title}</p>
                <p className="mt-0.5 text-[0.8125rem]">{got ? `Obtenu le ${new Date(got).toLocaleDateString('fr-FR')}` : b.hint}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section id="preferences" className="mt-12 scroll-mt-24" aria-labelledby="prefs-title">
        <h2 id="prefs-title" className="t-h2">
          Mes préférences
        </h2>
        <fieldset className="mt-4">
          <legend className="t-label">Rubriques suivies (pour « Selon tes centres d'intérêt »)</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = state.prefs.categories.includes(c.id)
              return (
                <button key={c.id} type="button" aria-pressed={on} onClick={() => toggleCat(c.id)} className={`h-10 rounded-full border px-4 font-semibold ${on ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}>
                  {c.label}
                </button>
              )
            })}
          </div>
        </fieldset>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <fieldset>
            <legend className="t-label">Langue des articles à la une</legend>
            <div className="mt-2 flex gap-2">
              {(['all', 'fr'] as const).map((l) => (
                <button key={l} type="button" aria-pressed={state.prefs.lang === l} onClick={() => actions.setPrefs({ lang: l })} className={`h-10 rounded-full border px-4 font-semibold ${state.prefs.lang === l ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}>
                  {l === 'all' ? 'Français et anglais' : 'Français seulement'}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="t-label">Apparence</legend>
            <div className="mt-2 flex gap-2">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button key={t} type="button" aria-pressed={state.prefs.theme === t} onClick={() => actions.setPrefs({ theme: t })} className={`h-10 rounded-full border px-4 font-semibold ${state.prefs.theme === t ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}>
                  {t === 'system' ? 'Automatique' : t === 'light' ? 'Clair' : 'Sombre'}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="fav-title">
          <h2 id="fav-title" className="border-b border-ink pb-2 t-h2">
            Mes favoris
          </h2>
          <ItemList items={state.favorites} empty="Touche le cœur sur un article, une fiche ou une découverte pour la retrouver ici." />
        </section>
        <section aria-labelledby="hist-title">
          <div className="flex items-end justify-between border-b border-ink pb-2">
            <h2 id="hist-title" className="t-h2">
              Historique
            </h2>
            {state.history.length > 0 && (
              <button type="button" onClick={actions.clearHistory} className="t-label text-ink-2 hover:text-ink">
                Effacer
              </button>
            )}
          </div>
          <ItemList items={state.history.slice(0, 30)} empty="Les articles ouverts et les fiches lues apparaîtront ici." />
        </section>
      </div>

      <section className="mt-14 border-t border-rule pt-6" aria-labelledby="data-title">
        <h2 id="data-title" className="t-h3">
          Mes données
        </h2>
        <p className="mt-1 max-w-2xl text-[0.9375rem] text-ink-2">
          Préférences, favoris, historique, scores, badges et révisions sont enregistrés dans le stockage local de ce navigateur (localStorage). Rien n'est envoyé ailleurs. Vider les données du site efface tout.
        </p>
        {!confirmReset ? (
          <Button variant="outline" className="mt-4" onClick={() => setConfirmReset(true)} icon={<Trash2 size={16} aria-hidden />}>
            Tout effacer
          </Button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3" role="alert">
            <span className="font-semibold">Effacer définitivement toute ta progression ?</span>
            <Button
              variant="accent"
              onClick={() => {
                resetState()
                setConfirmReset(false)
              }}
            >
              Oui, tout effacer
            </Button>
            <Button variant="quiet" onClick={() => setConfirmReset(false)}>
              Annuler
            </Button>
          </div>
        )}
      </section>
      {state.favorites.length === 0 && state.history.length === 0 && Object.keys(state.scores).length === 0 && (
        <div className="mt-10">
          <EmptyState title="Tout commence par un Déclic.">
            <Link to="/declic" className="link-ed font-semibold">
              Lance ton premier parcours de 5 minutes
            </Link>
          </EmptyState>
        </div>
      )}
    </div>
  )
}
