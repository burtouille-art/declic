import { Check, Copy, Rss } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'

/** Adresse publique du flux « À la une » (même dossier que le site, quel que soit le sous-chemin). */
export function feedUrl(): string {
  if (typeof window === 'undefined') return 'data/une.xml'
  return `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}data/une.xml`
}

/**
 * Les titres de DÉCLIC sur l'écran d'accueil du téléphone, via n'importe quelle appli
 * de widget RSS. Bouton de copie avec repli si le presse-papiers est indisponible.
 */
export function FeedCard() {
  const url = feedUrl()
  const [copied, setCopied] = useState<'ok' | 'ko' | null>(null)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied('ok')
    } catch {
      setCopied('ko')
    }
    window.setTimeout(() => setCopied(null), 4000)
  }
  return (
    <section className="rounded-[24px] border-[1.5px] border-ink/15 p-5 sm:p-7" aria-labelledby="feed-title">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vermilion text-[#171b1d]">
          <Rss size={20} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="feed-title" className="t-h3">
            Les titres de DÉCLIC sur ton écran d'accueil
          </h2>
          <p className="mt-1 text-[0.9375rem] text-ink-2">
            Le flux « À la une » regroupe une dizaine de titres importants, mis à jour toutes les 6 heures. Ajoute son adresse dans une appli de widget RSS : chaque titre ouvre l'article chez le média.
          </p>
          <label htmlFor="feed-url" className="mt-4 block t-label">
            Adresse du flux
          </label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input id="feed-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="h-11 w-full min-w-0 rounded-full border sm:flex-1 border-ink/20 bg-paper-2 px-4 text-[0.875rem] text-ink" />
            <Button variant="primary" onClick={copy} icon={copied === 'ok' ? <Check size={17} aria-hidden /> : <Copy size={17} aria-hidden />}>
              {copied === 'ok' ? 'Adresse copiée' : "Copier l'adresse"}
            </Button>
          </div>
          <p className="t-meta mt-2" aria-live="polite">
            {copied === 'ko' ? 'Copie impossible ici : appuie longuement sur l’adresse pour la sélectionner.' : 'Sur Android : installe une appli de widget RSS, colle cette adresse, puis pose le widget sur l’écran d’accueil.'}
          </p>
        </div>
      </div>
    </section>
  )
}
