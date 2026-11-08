import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '../ui/Button'
import { ProgressBar } from '../ui/bits'
import { DeclicRing } from '../ui/DeclicRing'

export function GameFrame({ title, subtitle, progress, children, aside }: { title: string; subtitle?: string; progress?: { value: number; max: number; label?: string }; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="wrap max-w-3xl pt-5 pb-10 lg:pt-8">
      <div className="flex items-center justify-between gap-3">
        <Link to="/jouer" className="inline-flex h-10 items-center gap-1.5 rounded-full pr-3 pl-2 text-[0.875rem] font-semibold text-ink-2 hover:bg-ink/6 hover:text-ink">
          <ArrowLeft size={18} aria-hidden /> Tous les jeux
        </Link>
        {aside}
      </div>
      <h1 className="mt-3 t-h1">{title}</h1>
      {subtitle && <p className="mt-1 text-ink-2">{subtitle}</p>}
      {progress && (
        <div className="mt-5 flex items-center gap-3">
          <ProgressBar value={progress.value} max={progress.max} label={progress.label ?? 'Progression'} />
          <span className="t-meta shrink-0 tabular-nums">
            {progress.value}/{progress.max}
          </span>
        </div>
      )}
      <div className="mt-6">{children}</div>
    </div>
  )
}

export type RecapItem = { prompt: string; ok: boolean; detail?: string; sourceUrl?: string }

export function GameResult({
  score,
  max,
  unit = 'bonnes réponses',
  message,
  recap = [],
  onReplay,
  replayLabel = 'Rejouer',
  extra,
  best,
}: {
  score: number
  max?: number
  unit?: string
  message: string
  recap?: RecapItem[]
  onReplay: () => void
  replayLabel?: string
  extra?: ReactNode
  best?: number
}) {
  const ratio = max ? score / max : 1
  return (
    <section aria-live="polite" aria-labelledby="result-title">
      <div className="flex flex-col items-start gap-5 rounded-[26px] bg-ink p-6 text-paper sm:flex-row sm:items-center sm:p-8">
        <DeclicRing size={88} progress={Math.round(ratio * 5)} tone="vermilion" track="paper" stroke={9} />
        <div>
          <h2 id="result-title" className="font-serif text-[3rem] leading-none font-medium tabular-nums">
            {score}
            {max !== undefined && <span className="text-paper/60">/{max}</span>}
          </h2>
          <p className="mt-1 t-label text-paper/80">{unit}</p>
          <p className="mt-3 max-w-md text-[1.0625rem]">{message}</p>
          {best !== undefined && <p className="mt-1 t-meta text-paper/70">Ton record : {best}</p>}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="accent" size="lg" onClick={onReplay} icon={<RotateCcw size={18} aria-hidden />}>
          {replayLabel}
        </Button>
        {extra}
        <ButtonLink to="/jouer" variant="outline" size="lg">
          Quitter
        </ButtonLink>
      </div>
      {recap.length > 0 && (
        <div className="mt-10">
          <h3 className="t-label">Récapitulatif</h3>
          <ol className="mt-3 divide-y divide-rule border-y border-rule">
            {recap.map((r, i) => (
              <li key={i} className="flex gap-3 py-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${r.ok ? 'bg-ok-bg text-ok' : 'bg-ko-bg text-ko'}`}>
                  {r.ok ? <Check size={14} strokeWidth={3} aria-label="Juste" /> : <X size={14} strokeWidth={3} aria-label="Faux" />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{r.prompt}</p>
                  {r.detail && <p className="mt-0.5 text-[0.875rem] text-ink-2">{r.detail}</p>}
                  {r.sourceUrl && (
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="t-meta link-ed">
                      Source
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

export function Feedback({ ok, explanation, source, onNext, nextLabel = 'Question suivante' }: { ok: boolean; explanation: string; source: { label: string; url: string }; onNext: () => void; nextLabel?: string }) {
  const btn = useRef<HTMLButtonElement>(null)
  // Le focus passe sur « suivant » : on enchaîne au clavier avec Entrée.
  useEffect(() => {
    const t = window.setTimeout(() => btn.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <div className={`mt-5 rounded-[20px] border-l-4 p-5 ${ok ? 'border-ok bg-ok-bg' : 'border-ko bg-ko-bg'}`} aria-live="polite">
      <p className="t-h3">{ok ? 'Exact !' : 'Pas cette fois.'}</p>
      <p className="mt-1.5 text-[1rem] leading-relaxed">{explanation}</p>
      <p className="t-meta mt-2">
        Source :{' '}
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="link-ed text-ink-2">
          {source.label}
        </a>
      </p>
      <Button ref={btn} className="mt-4" onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  )
}
