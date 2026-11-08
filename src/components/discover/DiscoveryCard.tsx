import { ArrowUpRight, Eye } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import type { Discovery } from '../../content'
import { actions } from '../../lib/store'
import { Button } from '../ui/Button'
import { FavoriteButton, Skeleton, SourceLine } from '../ui/bits'
import { Choices } from '../ui/Choices'

const Interaction = lazy(() => import('../viz/Interaction'))

export const KIND_LABEL: Record<Discovery['kind'], string> = {
  phenomene: 'Phénomène étonnant',
  histoire: 'Histoire méconnue',
  cerveau: 'Ton cerveau',
  invention: 'Invention',
  donnee: 'Donnée surprenante',
  culture: 'Curiosité culturelle',
}

/**
 * Carte de découverte à révélation progressive :
 * accroche → (question d'intuition) → explication, interaction, source, pour aller plus loin.
 */
export function DiscoveryCard({ d, headingLevel = 3, onRevealed, compact = false }: { d: Discovery; headingLevel?: 2 | 3; onRevealed?: () => void; compact?: boolean }) {
  const [guess, setGuess] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    setGuess(null)
    setRevealed(false)
  }, [d.id])
  const reveal = () => {
    setRevealed(true)
    actions.markDiscovered(d.id)
    onRevealed?.()
  }
  const H = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className="relative" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <p className="t-label text-vermilion-ink">{KIND_LABEL[d.kind]}</p>
        <FavoriteButton item={{ id: `d:${d.id}`, type: 'decouverte', title: d.title }} className="-mt-2 -mr-2" />
      </div>
      <H className={`mt-1 ${compact ? 't-h2' : 't-h1'} text-balance`}>{d.title}</H>
      <p className="mt-3 t-lede text-ink-2">{d.hook}</p>

      {!revealed && d.teaser && (
        <div className="mt-6">
          <p className="mb-3 t-label">{d.teaser.prompt}</p>
          <Choices
            options={d.teaser.options}
            selected={guess}
            correct={d.teaser.answer}
            onSelect={(i) => {
              setGuess(i)
              window.setTimeout(reveal, 650)
            }}
            legend={d.teaser.prompt}
            hotkeys={false}
            compact
          />
        </div>
      )}
      {!revealed && !d.teaser && (
        <Button className="mt-6" variant="primary" onClick={reveal} icon={<Eye size={18} aria-hidden />}>
          Révéler l'explication
        </Button>
      )}

      {revealed && (
        <div className="mt-6">
          {d.teaser && guess !== null && (
            <p className={`mb-3 t-label ${guess === d.teaser.answer ? 'text-ok' : 'text-ko'}`}>
              {guess === d.teaser.answer ? 'Bien vu, ton intuition était juste.' : `Pas tout à fait : la bonne réponse était « ${d.teaser.options[d.teaser.answer]} ».`}
            </p>
          )}
          <p className="t-body measure">{d.body}</p>
          {d.interaction !== 'none' && (
            <div className="mt-6">
              <Suspense fallback={<Skeleton className="h-56 w-full" />}>
                <Interaction kind={d.interaction} />
              </Suspense>
            </div>
          )}
          <div className="mt-5 flex flex-col gap-2 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
            <SourceLine source={d.source} />
            <a href={d.more.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 t-label hover:text-vermilion-ink">
              Approfondir : {d.more.label} <ArrowUpRight size={15} aria-hidden />
              <span className="sr-only">(nouvel onglet)</span>
            </a>
          </div>
        </div>
      )}
    </article>
  )
}
