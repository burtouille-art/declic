import { ArrowUpRight } from 'lucide-react'
import type { QuizItem } from '../../lib/daily'
import { relativeTime } from '../../lib/format'
import { CountryTag, PerspectiveList } from '../news/Perspectives'

/** Une lettre par caractère, sans accent ni majuscule : les positions restent celles du titre original. */
const fold = (s: string) => s.split('').map((c) => (c.normalize('NFD')[0] ?? c).toLowerCase()).join('')

/** Met en évidence la réponse dans le titre original (« États-Unis » retrouve aussi « Etats-Unis »). */
function Highlight({ title, part }: { title: string; part: string }) {
  const i = part ? fold(title).indexOf(fold(part)) : -1
  if (i < 0) return <>{title}</>
  return (
    <>
      {title.slice(0, i)}
      <mark className="rounded-sm bg-sun px-0.5 text-[#171b1d]">{part}</mark>
      {title.slice(i + part.length)}
    </>
  )
}

/**
 * Correction d'une question d'actualité : le titre complet tel que publié, le média, la date,
 * le chapô du média (inchangé) et, quand d'autres médias ont couvert le même événement, leurs titres.
 */
export function ActuCorrection({ item, tone = 'paper' }: { item: QuizItem; tone?: 'paper' | 'onDark' }) {
  const a = item.actu
  if (!a) return null
  const art = a.article
  const dark = tone === 'onDark'
  return (
    // Sur les fonds colorés de la correction, le gris des métadonnées est foncé d'un cran (contraste AA).
    <div className={`mt-2 ${dark ? "" : "[&_.t-meta]:text-ink-2"}`}>
      <p className={`t-label ${dark ? 'text-on-petrol/90' : 'text-ink-2'}`}>{a.type === 'angle' ? 'Le titre de ce média' : 'Le titre tel que publié'}</p>
      <p className="mt-1 font-serif text-[1.15rem] leading-snug font-medium text-pretty">
        {a.type === 'angle' ? art.title : <Highlight title={art.title} part={a.solution} />}
      </p>
      <p className={`mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 t-meta ${dark ? 'text-on-petrol/90' : ''}`}>
        <span className={`font-semibold ${dark ? '' : 'text-ink-2'}`}>{art.sourceName}</span>
        {!dark && <CountryTag country={art.sourceCountry} />}
        {dark && art.sourceCountry && art.sourceCountry !== 'France' && <span>({art.sourceCountry})</span>}
        <span aria-hidden>·</span>
        <time dateTime={art.publishedAt}>{relativeTime(art.publishedAt)}</time>
      </p>
      {art.summary && !dark && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{art.summary}</p>}
      <a
        href={art.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-2 inline-flex items-center gap-1 text-[0.9375rem] font-semibold underline underline-offset-3 ${dark ? 'text-on-petrol' : 'text-ink'}`}
      >
        Lire l’article sur {art.sourceName} <ArrowUpRight size={15} aria-hidden />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
      {a.coverage.length > 0 && !dark && (
        <div className="mt-4">
          <p className="t-label text-ink-2">{a.type === 'angle' ? 'Les autres titres sur ce sujet' : 'Ailleurs, le même sujet'}</p>
          <div className="mt-1.5">
            <PerspectiveList compact items={a.coverage} />
          </div>
        </div>
      )}
    </div>
  )
}
