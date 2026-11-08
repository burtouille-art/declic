import { AlertTriangle, Clock, ExternalLink, Heart, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_BY_ID, toneClasses } from '../../content/categories'
import type { Source } from '../../content/types'
import { actions, useAppState, type CategoryId, type SavedItem } from '../../lib/store'
import { Button } from './Button'

export function CategoryTag({ id, link = true, className = '' }: { id: CategoryId; link?: boolean; className?: string }) {
  const meta = CATEGORY_BY_ID[id]
  if (!meta) return null
  const tone = toneClasses[meta.tone]
  const inner = (
    <>
      <span className={`inline-block h-2 w-2 rounded-[1px] ${tone.dot}`} aria-hidden />
      <span className={tone.text}>{meta.label}</span>
    </>
  )
  const cls = `relative z-10 inline-flex items-center gap-1.5 font-sans text-[0.8125rem] font-semibold ${className}`
  return link ? (
    <Link to={`/actus/${id}`} className={`${cls} hover:underline underline-offset-2`}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  )
}

export function ReadingTime({ minutes, label }: { minutes: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 t-meta">
      <Clock size={13} aria-hidden />
      {label ?? `${minutes} min`}
    </span>
  )
}

export function ProgressBar({ value, max, label, tone = 'vermilion', className = '' }: { value: number; max: number; label: string; tone?: 'vermilion' | 'petrol' | 'ink'; className?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  const color = tone === 'vermilion' ? 'bg-vermilion' : tone === 'petrol' ? 'bg-petrol' : 'bg-ink'
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-ink/10 ${className}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} sur ${max}`}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-500 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function SourceLine({ source, prefix = 'Source', className = '' }: { source: Source; prefix?: string; className?: string }) {
  return (
    <p className={`t-meta ${className}`}>
      {prefix} :{' '}
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="link-ed text-ink-2">
        {source.label}
        <ExternalLink size={11} className="ml-0.5 inline align-baseline" aria-hidden />
        <span className="sr-only"> (nouvel onglet)</span>
      </a>
    </p>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-sm ${className}`} aria-hidden />
}

export function ErrorState({ title, message, onRetry, children }: { title: string; message?: string | null; onRetry?: () => void; children?: ReactNode }) {
  return (
    <div role="alert" className="border-l-4 border-vermilion bg-paper-2 px-5 py-5">
      <p className="flex items-center gap-2 t-label text-ink">
        <AlertTriangle size={18} className="text-vermilion-ink" aria-hidden /> {title}
      </p>
      {message && <p className="mt-1.5 text-[0.9375rem] text-ink-2">{message}</p>}
      {children}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry} icon={<RotateCw size={15} aria-hidden />}>
          Réessayer
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-rule px-5 py-8 text-center">
      <p className="t-h3">{title}</p>
      {children && <div className="mt-2 text-[0.9375rem] text-ink-2">{children}</div>}
    </div>
  )
}

export function FavoriteButton({ item, className = '' }: { item: Omit<SavedItem, 'at'>; className?: string }) {
  const favorites = useAppState((s) => s.favorites)
  const active = favorites.some((f) => f.id === item.id)
  return (
    <button
      type="button"
      onClick={() => actions.toggleFavorite(item)}
      aria-pressed={active}
      aria-label={active ? `Retirer « ${item.title} » des favoris` : `Ajouter « ${item.title} » aux favoris`}
      className={`relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-ink/6 hover:text-vermilion-ink ${active ? 'text-vermilion-ink' : ''} ${className}`}
    >
      <Heart size={18} fill={active ? 'currentColor' : 'none'} aria-hidden />
    </button>
  )
}

export function SectionHeading({ title, kicker, action, id, className = '' }: { title: string; kicker?: string; action?: ReactNode; id?: string; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div>
        {kicker && <p className="t-meta mb-1">{kicker}</p>}
        <h2 id={id} className="t-h2">
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

export function LiveRegion({ children }: { children: ReactNode }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {children}
    </div>
  )
}
