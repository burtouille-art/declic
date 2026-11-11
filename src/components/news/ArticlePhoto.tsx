import { Info } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { photoShape, type ArticleImage } from './photo'

const linkCls = 'relative z-10 underline decoration-[color-mix(in_oklab,currentColor_35%,transparent)] underline-offset-2 hover:decoration-current'

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
      {children}
      <span className="sr-only"> (nouvel onglet)</span>
    </a>
  )
}

/** Licence NASA (texte long) : affichée seulement si elle est courte, sinon en infobulle et dans le panneau. */
const SHORT_LICENSE = 32

/** Le texte de la légende (sans enveloppe), partagé par la légende visible et le panneau du bouton ⓘ. */
function CreditText({ image, full = false }: { image: ArticleImage; full?: boolean }) {
  if (image.illustration) {
    return (
      <>
        <span className="font-semibold text-ink-2">Illustration{image.subject ? ` : ${image.subject}` : ''}</span>
        {' · '}
        {image.credit}
        {image.license && (
          <>
            {', '}
            {image.licenseUrl ? <Ext href={image.licenseUrl}>{image.license}</Ext> : image.license}
          </>
        )}
        {' · '}
        {image.sourceUrl ? <Ext href={image.sourceUrl}>Wikimedia Commons</Ext> : 'Wikimedia Commons'}
      </>
    )
  }
  const lic = image.license && (full || image.license.length <= SHORT_LICENSE) ? image.license : null
  return (
    <>
      <span className="font-semibold text-ink-2">Photo : {image.sourceUrl ? <Ext href={image.sourceUrl}>{image.credit}</Ext> : image.credit}</span>
      {lic && (
        <>
          {' · '}
          {image.licenseUrl ? <Ext href={image.licenseUrl}>{lic}</Ext> : lic}
        </>
      )}
    </>
  )
}

/**
 * Crédit d'une photo. « caption » : légende visible sous l'image (jamais incrustée dessus).
 * « button » : bouton ⓘ posé sur une vignette, qui ouvre la légende complète (clavier, Échap, clic extérieur).
 */
export function PhotoCredit({ image, mode = 'caption', className = '' }: { image: ArticleImage; mode?: 'caption' | 'button'; className?: string }) {
  if (mode === 'caption') {
    const long = !image.illustration && image.license && image.license.length > SHORT_LICENSE ? image.license : undefined
    return (
      <figcaption className={`t-caption ${className}`} title={long}>
        <CreditText image={image} />
      </figcaption>
    )
  }
  return <CreditButton image={image} className={className} />
}

function CreditButton({ image, className = '' }: { image: ArticleImage; className?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const wrapRef = useRef<HTMLSpanElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])
  return (
    <span ref={wrapRef} className={`absolute right-1 bottom-1 z-10 ${className}`}>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Crédit de la photo : ${image.subject ?? image.credit}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="relative flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(18_20_22/0.62)] text-white before:absolute before:-inset-[10px] before:content-[''] hover:bg-[rgb(18_20_22/0.8)]"
      >
        <Info size={14} aria-hidden />
      </button>
      <span
        id={id}
        role="note"
        hidden={!open}
        className="absolute top-full right-0 z-20 mt-2 block w-[min(18rem,80vw)] border border-rule bg-paper p-3 text-left t-caption whitespace-normal text-ink-3 shadow-lift"
      >
        <span className="block">
          <CreditText image={image} full />
        </span>
        {image.illustration && <span className="mt-1.5 block text-ink-2">Photo d’illustration : elle montre la personne ou le lieu cité, pas l’événement.</span>}
      </span>
    </span>
  )
}

export type PhotoVariant = 'hero' | 'medallion' | 'thumb'

const frame: Record<PhotoVariant, string> = {
  hero: 'aspect-[3/2] lg:aspect-[16/9] w-full',
  medallion: 'aspect-[4/5] w-full',
  thumb: 'aspect-square w-20 lg:w-24',
}

/**
 * Photo d'article (droits vérifiés en amont) selon trois formats :
 * grande photo (lieu, NASA), médaillon (portrait), vignette carrée (listes).
 * Un portrait n'est jamais affiché en grand. En cas d'erreur de chargement, rien ne reste à l'écran.
 */
export function ArticlePhoto({
  image,
  variant,
  priority = false,
  onFail,
  className = '',
  thumbSize,
}: {
  image: ArticleImage
  variant: PhotoVariant
  priority?: boolean
  onFail?: () => void
  className?: string
  /** classe de taille pour une vignette (par défaut 80 / 96 px) */
  thumbSize?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  const shape = photoShape(image)
  const v: PhotoVariant = variant === 'hero' && shape === 'portrait' ? 'medallion' : variant
  const focus = shape === 'portrait' ? 'object-[50%_22%]' : 'object-center'
  const alt = v === 'thumb' ? '' : image.illustration ? `Illustration : ${image.subject ?? 'photo d’illustration'}` : ''
  const img = (
    <img
      src={image.url}
      alt={alt}
      width={image.width ?? undefined}
      height={image.height ?? undefined}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        setFailed(true)
        onFail?.()
      }}
      className={`block h-full w-full rounded-none bg-paper-2 object-cover photo-edge ${focus}`}
    />
  )
  if (v === 'thumb') {
    return (
      <span className={`relative block shrink-0 ${thumbSize ?? frame.thumb} ${thumbSize ? 'aspect-square' : ''} ${className}`}>
        {img}
        <PhotoCredit image={image} mode="button" />
      </span>
    )
  }
  return (
    <figure className={className}>
      <div className={`${frame[v]} ${v === 'hero' ? '-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full' : ''}`}>{img}</div>
      {v === 'hero' && <PhotoCredit image={image} className="mt-2" />}
    </figure>
  )
}
