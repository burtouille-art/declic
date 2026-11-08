import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProgressBar } from '../components/ui/bits'
import { FICHE_BY_ID, FICHES, PATHS, type Fiche } from '../content'
import { useAppState } from '../lib/store'

export const THEME_LABEL: Record<Fiche['theme'], string> = {
  univers: 'Univers',
  'corps-cerveau': 'Corps & cerveau',
  'terre-climat': 'Terre & climat',
  histoire: 'Histoire',
  technologie: 'Technologie',
  societe: 'Société',
}

export default function LearnPage() {
  const learned = useAppState((s) => s.learned)
  const themes = Object.keys(THEME_LABEL) as Fiche['theme'][]
  return (
    <div className="wrap pt-6 lg:pt-10">
      <header className="grid gap-6 border-b border-ink pb-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h1 className="t-display">Apprendre</h1>
          <p className="mt-3 t-lede measure text-ink-2">Une encyclopédie vivante en petites fiches : une question intrigante, une explication en trois temps, une question pour vérifier. Deux minutes chacune.</p>
        </div>
        <div className="self-end lg:col-span-4">
          <p className="t-label">
            {learned.length} fiche{learned.length > 1 ? 's' : ''} terminée{learned.length > 1 ? 's' : ''} sur {FICHES.length}
          </p>
          <ProgressBar className="mt-2" value={learned.length} max={FICHES.length} label="Fiches terminées" tone="petrol" />
        </div>
      </header>

      <section className="mt-10" aria-labelledby="paths-title">
        <h2 id="paths-title" className="t-h2">
          Parcours
        </h2>
        <p className="mt-1 text-ink-2">Trois fiches enchaînées, dans un ordre pensé pour progresser.</p>
        <ol className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PATHS.map((p) => {
            const done = p.fiches.filter((f) => learned.includes(f)).length
            const next = p.fiches.find((f) => !learned.includes(f)) ?? p.fiches[0]
            return (
              <li key={p.id} className="flex flex-col rounded-[22px] border-[1.5px] border-ink/15 p-5">
                <p className="t-h3">{p.title}</p>
                <ol className="mt-3 space-y-1.5 text-[0.9375rem]">
                  {p.fiches.map((fid, k) => (
                    <li key={fid} className="flex gap-2">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold ${learned.includes(fid) ? 'bg-petrol text-on-petrol' : 'border border-ink/30 text-ink-3'}`}>
                        {learned.includes(fid) ? <Check size={12} strokeWidth={3} aria-label="terminée" /> : k + 1}
                      </span>
                      <Link to={`/apprendre/${fid}?parcours=${p.id}`} className="leading-snug hover:underline">
                        {FICHE_BY_ID.get(fid)?.title}
                      </Link>
                    </li>
                  ))}
                </ol>
                <div className="mt-auto pt-4">
                  <ProgressBar value={done} max={p.fiches.length} label={`Progression du parcours ${p.title}`} tone="petrol" />
                  <Link to={`/apprendre/${next}?parcours=${p.id}`} className="mt-3 inline-flex items-center gap-1 t-label hover:text-vermilion-ink">
                    {done === p.fiches.length ? 'Revoir le parcours' : done ? 'Continuer' : 'Commencer'} <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mt-14 grid gap-6 rounded-[28px] bg-ink p-6 text-paper sm:p-8 lg:grid-cols-12" aria-labelledby="frise-title">
        <div className="lg:col-span-7">
          <h2 id="frise-title" className="t-h1">
            La frise du temps
          </h2>
          <p className="mt-2 text-paper/80">De la pyramide de Khéops à la première image d'un trou noir : parcours 4 500 ans d'histoire, époque par époque.</p>
        </div>
        <div className="flex items-end lg:col-span-5 lg:justify-end">
          <Link to="/apprendre/frise" className="inline-flex h-12 items-center gap-2 rounded-full bg-paper px-6 font-semibold text-ink hover:bg-paper/90">
            Explorer la frise <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>

      {themes.map((t) => {
        const list = FICHES.filter((f) => f.theme === t)
        if (!list.length) return null
        return (
          <section key={t} className="mt-14" aria-labelledby={`theme-${t}`}>
            <h2 id={`theme-${t}`} className="border-b border-ink pb-2 t-h2">
              {THEME_LABEL[t]}
            </h2>
            <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((f) => (
                <li key={f.id} className="border-b border-rule">
                  <Link to={`/apprendre/${f.id}`} className="group flex items-start gap-3 py-4">
                    <span className="flex-1">
                      <span className="block font-serif text-[1.2rem] leading-snug group-hover:underline">{f.title}</span>
                      <span className="t-meta mt-1 block">{f.intro.split('.')[0]}.</span>
                    </span>
                    {learned.includes(f.id) && (
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-petrol text-on-petrol">
                        <Check size={14} strokeWidth={3} aria-label="Fiche terminée" />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
