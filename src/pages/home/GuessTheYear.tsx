import { ArrowRight, ExternalLink } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/bits'
import { otdForDate } from '../../lib/daily'
import type { OnThisDay } from '../../lib/news'

/**
 * Expérience culturelle : « Ce jour-là ». Un événement de l'éphéméride Wikipédia,
 * on estime l'année avec un curseur, puis on révèle. Fonctionne au doigt et au clavier.
 */
export function GuessTheYear({ otd, loading, error }: { otd: OnThisDay | null; loading: boolean; error: string | null }) {
  const today = otdForDate(otd)
  const events = useMemo(() => (today?.events ?? []).filter((e) => e.year >= 1000 && !e.text.includes(String(e.year))), [today])
  const [k, setK] = useState(0)
  const [guess, setGuess] = useState(1900)
  const [revealed, setRevealed] = useState(false)
  const ev = events[k % Math.max(1, events.length)]
  useEffect(() => {
    setRevealed(false)
    setGuess(1900)
  }, [k])

  return (
    <section className="mt-16 border-y border-ink lg:mt-24" aria-labelledby="otd-title">
      <div className="wrap grid gap-8 py-12 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-4">
          <h2 id="otd-title" className="t-h1">
            Ce jour-là
          </h2>
          <p className="mt-3 text-ink-2">Un événement survenu un {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}. Place le curseur sur l'année que tu crois juste.</p>
          <Link to="/apprendre/frise" className="mt-4 inline-flex items-center gap-1 t-label hover:text-vermilion-ink">
            Explorer la frise du temps <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="lg:col-span-8">
          {loading && !otd && <Skeleton className="h-48 w-full" />}
          {(error || (!loading && !ev)) && (
            <p className="text-ink-2">L'éphéméride du jour n'est pas disponible pour le moment. La frise du temps reste accessible.</p>
          )}
          {ev && (
            <div>
              <p className="font-serif text-[1.6rem] leading-snug font-medium text-balance sm:text-[2rem]" style={{ fontVariationSettings: "'opsz' 40" }}>
                « {ev.text.charAt(0).toUpperCase() + ev.text.slice(1)} »
              </p>
              <div className="mt-6">
                <label htmlFor="year-guess" className="flex items-baseline justify-between t-label">
                  Ton estimation
                  <span className="font-serif text-[2.4rem] leading-none font-medium tabular-nums">{guess}</span>
                </label>
                <input
                  id="year-guess"
                  type="range"
                  min={1000}
                  max={2025}
                  step={1}
                  value={guess}
                  disabled={revealed}
                  onChange={(e) => setGuess(Number(e.target.value))}
                  className="mt-2 h-8 w-full accent-[var(--vermilion)]"
                />
                <div className="flex justify-between t-meta">
                  <span>1000</span>
                  <span>2025</span>
                </div>
              </div>
              {!revealed ? (
                <Button className="mt-4" onClick={() => setRevealed(true)}>
                  Révéler l'année
                </Button>
              ) : (
                <div className="mt-4 rounded-2xl bg-paper-2 p-5" aria-live="polite">
                  <p className="t-h2">
                    C'était en {ev.year}.{' '}
                    <span className="text-ink-2">
                      {Math.abs(ev.year - guess) === 0 ? 'Pile !' : Math.abs(ev.year - guess) <= 10 ? `À ${Math.abs(ev.year - guess)} ans près, bravo.` : `Écart : ${Math.abs(ev.year - guess)} ans.`}
                    </span>
                  </p>
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[0.9375rem] font-semibold hover:text-vermilion-ink">
                    Lire « {ev.pageTitle} » sur Wikipédia <ExternalLink size={14} aria-hidden />
                    <span className="sr-only">(nouvel onglet)</span>
                  </a>
                  {events.length > 1 && (
                    <div>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setK((x) => x + 1)}>
                        Un autre événement ({(k % events.length) + 1}/{events.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <p className="t-meta mt-4">Source : Wikipédia, éphéméride du jour (licence CC BY-SA 4.0).</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
