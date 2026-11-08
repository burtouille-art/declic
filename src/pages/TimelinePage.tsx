import { ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EVENTS, type HistoryEvent } from '../content'

const ERAS: { id: HistoryEvent['era'] | 'all'; label: string; range: string }[] = [
  { id: 'all', label: 'Tout', range: '' },
  { id: 'antiquite', label: 'Antiquité', range: 'jusqu’en 476' },
  { id: 'moyen-age', label: 'Moyen Âge', range: '476 – 1492' },
  { id: 'moderne', label: 'Temps modernes', range: '1492 – 1789' },
  { id: 'xixe', label: 'XIXe siècle', range: '1789 – 1914' },
  { id: 'contemporain', label: 'Époque contemporaine', range: 'depuis 1900' },
]
const fmt = (y: number) => (y < 0 ? `${-y} av. J.-C.` : String(y))

/**
 * Frise chronologique interactive. Sur grand écran, un axe proportionnel montre les vrais écarts
 * de temps ; partout, une liste navigable au clavier détaille chaque événement.
 */
export default function TimelinePage() {
  const [era, setEra] = useState<(typeof ERAS)[number]['id']>('all')
  const [active, setActive] = useState<string | null>(null)
  const sorted = useMemo(() => [...EVENTS].sort((a, b) => a.year - b.year), [])
  const list = sorted.filter((e) => era === 'all' || e.era === era)
  const min = list[0]?.year ?? 0
  const max = list[list.length - 1]?.year ?? 1
  const pos = (y: number) => (max === min ? 50 : ((y - min) / (max - min)) * 100)
  const activeEv = sorted.find((e) => e.id === active)

  return (
    <div className="wrap pt-6 lg:pt-10">
      <Link to="/apprendre" className="t-label text-ink-2 hover:text-ink">
        ← Apprendre
      </Link>
      <h1 className="mt-3 t-display">La frise du temps</h1>
      <p className="mt-3 t-lede measure text-ink-2">{EVENTS.length} repères, de l'Antiquité à nos jours. Choisis une époque : l'axe se resserre et révèle les vrais écarts de temps.</p>

      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Époques">
        {ERAS.map((e) => (
          <button key={e.id} role="tab" aria-selected={era === e.id} onClick={() => setEra(e.id)} className={`h-10 shrink-0 rounded-full border px-4 text-[0.875rem] font-semibold ${era === e.id ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}>
            {e.label}
            {e.range && <span className="ml-1.5 font-normal opacity-70">{e.range}</span>}
          </button>
        ))}
      </div>

      {/* Axe proportionnel (décoratif + cliquable ; la liste ci-dessous est l'équivalent accessible) */}
      <div className="relative mt-10 hidden h-28 md:block" aria-hidden>
        <div className="absolute top-12 right-0 left-0 h-[2px] bg-ink" />
        <span className="t-meta absolute top-16 left-0">{fmt(min)}</span>
        <span className="t-meta absolute top-16 right-0">{fmt(max)}</span>
        {list.map((e, k) => (
          <button
            key={e.id}
            type="button"
            tabIndex={-1}
            onClick={() => setActive(e.id)}
            className="group absolute top-12 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos(e.year)}%` }}
            title={`${fmt(e.year)} — ${e.label}`}
          >
            <span className={`block rounded-full border-2 border-ink transition-all ${active === e.id ? 'h-5 w-5 bg-vermilion' : 'h-3 w-3 bg-paper group-hover:bg-vermilion'}`} />
            {(active === e.id || list.length <= 8 || k % 4 === 0) && (
              <span className={`absolute left-1/2 -translate-x-1/2 text-[0.75rem] font-semibold whitespace-nowrap ${k % 2 ? 'top-6' : '-top-7'}`}>{fmt(e.year)}</span>
            )}
          </button>
        ))}
      </div>

      {activeEv && (
        <div className="mt-4 hidden rounded-[22px] bg-sun p-5 text-[#171b1d] md:block" aria-live="polite">
          <p className="font-serif text-[1.8rem] leading-none">{fmt(activeEv.year)}</p>
          <p className="mt-1 t-h3">{activeEv.label}</p>
          <p className="mt-1">{activeEv.detail}</p>
        </div>
      )}

      <ol className="mt-10 border-l-2 border-ink pl-6">
        {list.map((e, k) => {
          const prev = list[k - 1]
          const gap = prev ? e.year - prev.year : 0
          return (
            <li key={e.id} className="relative pb-7">
              {prev && gap >= 100 && <p className="t-meta -mt-3 mb-3 italic">… {gap.toLocaleString('fr-FR')} ans plus tard</p>}
              <span className={`absolute top-1.5 -left-[33px] h-4 w-4 rounded-full border-2 border-ink ${active === e.id ? 'bg-vermilion' : 'bg-paper'}`} aria-hidden />
              <button type="button" onClick={() => setActive(e.id)} aria-pressed={active === e.id} className="text-left">
                <span className="font-serif text-[1.6rem] leading-none font-medium tabular-nums">{fmt(e.year)}</span>
                <span className="mt-1 block t-h3">{e.label}</span>
              </button>
              <p className="mt-1 max-w-2xl text-ink-2">{e.detail}</p>
              <a href={e.source.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 t-meta link-ed">
                {e.source.label} <ExternalLink size={11} aria-hidden />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            </li>
          )
        })}
      </ol>
      <p className="mt-4">
        <Link to="/jouer/chronologie" className="t-label hover:text-vermilion-ink">
          Te sens-tu prêt ? Joue à la chronologie →
        </Link>
      </p>
    </div>
  )
}
