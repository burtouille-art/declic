import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/ui/Button'
import { FavoriteButton, ReadingTime, Skeleton } from '../components/ui/bits'
import { Choices } from '../components/ui/Choices'
import { FICHE_BY_ID, PATHS } from '../content'
import { readingMinutes } from '../lib/format'
import { actions, useAppState } from '../lib/store'
import { THEME_LABEL } from './LearnPage'
import { NotFound } from './NotFound'

const Interaction = lazy(() => import('../components/viz/Interaction'))

export default function FichePage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const fiche = id ? FICHE_BY_ID.get(id) : undefined
  const learned = useAppState((s) => s.learned)
  const [shown, setShown] = useState(1)
  const [answer, setAnswer] = useState<number | null>(null)

  useEffect(() => {
    setShown(1)
    setAnswer(null)
    if (fiche) actions.addHistory({ id: `f:${fiche.id}`, type: 'fiche', title: fiche.title })
  }, [fiche])

  if (!fiche) return <NotFound />
  const path = PATHS.find((p) => p.id === params.get('parcours')) ?? PATHS.find((p) => (p.fiches as readonly string[]).includes(fiche.id))
  const pos = path ? (path.fiches as readonly string[]).indexOf(fiche.id) : -1
  const nextInPath = path && pos >= 0 ? path.fiches[pos + 1] : undefined
  const allText = [fiche.intro, ...fiche.steps.map((s) => s.text)].join(' ')
  const allShown = shown >= fiche.steps.length

  return (
    <article className="wrap max-w-3xl pt-6 lg:pt-10">
      <Link to="/apprendre" className="inline-flex items-center gap-1.5 t-label text-ink-2 hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> Apprendre
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span className="t-label text-petrol-ink">{THEME_LABEL[fiche.theme]}</span>
        <ReadingTime minutes={readingMinutes(allText) + 1} />
        {learned.includes(fiche.id) && <span className="rounded-full bg-ok-bg px-2.5 py-0.5 text-[0.75rem] font-semibold text-ok">Terminée</span>}
        <FavoriteButton item={{ id: `f:${fiche.id}`, type: 'fiche', title: fiche.title }} className="ml-auto" />
      </div>
      <h1 className="mt-2 t-h1 text-balance">{fiche.title}</h1>
      <p className="mt-4 t-lede text-ink-2">{fiche.intro}</p>

      <ol className="mt-8 space-y-7">
        {fiche.steps.slice(0, shown).map((s, k) => (
          <li key={s.heading} className="grid grid-cols-[2.25rem_1fr] gap-3">
            <span className="font-serif text-[1.9rem] leading-none text-vermilion-ink" aria-hidden>
              {k + 1}
            </span>
            <div>
              <h2 className="t-h3">{s.heading}</h2>
              <p className="mt-1.5 t-body">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {!allShown && (
        <Button variant="outline" className="mt-6 ml-12" onClick={() => setShown((n) => n + 1)} icon={<ChevronDown size={18} aria-hidden />}>
          Et ensuite ?
        </Button>
      )}

      {allShown && fiche.visual !== 'none' && fiche.visual !== 'timeline' && (
        <div className="mt-10">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <Interaction kind={fiche.visual} />
          </Suspense>
        </div>
      )}
      {allShown && fiche.visual === 'timeline' && (
        <Link to="/apprendre/frise" className="mt-8 inline-flex items-center gap-1 t-label hover:text-vermilion-ink">
          Replacer l'événement sur la frise du temps <ArrowRight size={16} aria-hidden />
        </Link>
      )}

      {allShown && (
        <section className="mt-10 rounded-[22px] bg-paper-2 p-5 sm:p-7" aria-labelledby="check-title">
          <h2 id="check-title" className="t-label">
            As-tu bien compris ?
          </h2>
          <p className="mt-2 t-h3">{fiche.check.prompt}</p>
          <div className="mt-4">
            <Choices
              options={fiche.check.options}
              selected={answer}
              correct={fiche.check.answer}
              onSelect={(k) => {
                setAnswer(k)
                actions.markLearned(fiche.id)
              }}
              legend={fiche.check.prompt}
              compact
            />
          </div>
          {answer !== null && (
            <p className="mt-4" aria-live="polite">
              <strong>{answer === fiche.check.answer ? 'Exactement.' : 'Pas tout à fait.'}</strong> {fiche.check.explanation}
            </p>
          )}
        </section>
      )}

      <footer className="mt-10 border-t border-rule pt-5">
        <h2 className="t-label">Sources</h2>
        <ul className="mt-2 space-y-1">
          {fiche.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-ed text-[0.9375rem] text-ink-2">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        {fiche.related.length > 0 && (
          <>
            <h2 className="mt-6 t-label">Sujets associés</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {fiche.related.map((rid) => {
                const r = FICHE_BY_ID.get(rid)
                return r ? (
                  <li key={rid}>
                    <Link to={`/apprendre/${rid}`} className="inline-block rounded-full bg-paper-2 px-3.5 py-1.5 text-[0.875rem] font-medium hover:bg-paper-3">
                      {r.title}
                    </Link>
                  </li>
                ) : null
              })}
            </ul>
          </>
        )}
        {path && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-rule p-5">
            <p>
              <span className="t-meta block">Parcours</span>
              <span className="t-h3">{path.title}</span> <span className="t-meta">· fiche {pos + 1} sur {path.fiches.length}</span>
            </p>
            {nextInPath ? (
              <ButtonLink to={`/apprendre/${nextInPath}?parcours=${path.id}`} variant="primary">
                Fiche suivante <ArrowRight size={17} aria-hidden />
              </ButtonLink>
            ) : (
              <ButtonLink to="/apprendre" variant="outline">
                Parcours terminé : choisir la suite
              </ButtonLink>
            )}
          </div>
        )}
      </footer>
    </article>
  )
}
