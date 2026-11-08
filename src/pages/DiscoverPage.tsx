import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DiscoveryCard, KIND_LABEL } from '../components/discover/DiscoveryCard'
import { DISCOVERIES, DISCOVERY_BY_ID, type Discovery } from '../content'
import { pickRandom } from '../lib/random'
import { useAppState } from '../lib/store'

/** La machine à curiosités : un grand bouton, une découverte inattendue à chaque pression. */
export default function DiscoverPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const discovered = useAppState((s) => s.discovered)
  const [kind, setKind] = useState<Discovery['kind'] | 'all'>('all')
  const current = id ? DISCOVERY_BY_ID.get(id) : undefined

  const pool = useMemo(() => DISCOVERIES.filter((d) => kind === 'all' || d.kind === kind), [kind])
  const surprise = () => {
    // On privilégie ce que la personne n'a pas encore vu.
    const unseen = pool.filter((d) => !discovered.includes(d.id) && d.id !== current?.id)
    const next = pickRandom(unseen.length ? unseen : pool.filter((d) => d.id !== current?.id)) ?? pool[0]
    if (next) navigate(`/decouvrir/${next.id}`, { replace: !!current })
  }
  useEffect(() => {
    if (current) document.getElementById('decouverte')?.focus()
  }, [current])

  return (
    <MotionConfig reducedMotion="user">
      <div className="wrap pt-6 lg:pt-10">
        <header className="grid items-end gap-6 border-b border-ink pb-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="t-display">La machine à curiosités</h1>
            <p className="mt-3 t-lede measure text-ink-2">Un phénomène étonnant, une histoire méconnue, une bizarrerie de ton cerveau. Chaque découverte est sourcée et se prolonge.</p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:col-span-5 lg:items-end">
            <motion.button
              type="button"
              onClick={surprise}
              whileTap={{ scale: 0.94, rotate: -6 }}
              className="group flex h-40 w-40 flex-col items-center justify-center rounded-full bg-vermilion text-[#171b1d] shadow-lift transition-[filter] hover:brightness-95 sm:h-48 sm:w-48"
            >
              <Sparkles size={30} aria-hidden className="transition-transform group-hover:rotate-12" />
              <span className="mt-2 font-serif text-[1.5rem] leading-tight font-semibold" style={{ fontVariationSettings: "'opsz' 36" }}>
                Surprends-moi
              </span>
            </motion.button>
            <p className="t-meta" aria-live="polite">
              {discovered.length} découverte{discovered.length > 1 ? 's' : ''} sur {DISCOVERIES.length} révélée{discovered.length > 1 ? 's' : ''}
            </p>
          </div>
        </header>

        <fieldset className="mt-5 flex flex-wrap gap-2">
          <legend className="sr-only">Type de découverte</legend>
          {(['all', ...Object.keys(KIND_LABEL)] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k as typeof kind)} className={`h-9 rounded-full border px-3.5 text-[0.875rem] font-semibold ${kind === k ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-ink-2 hover:border-ink'}`}>
              {k === 'all' ? 'Tout' : KIND_LABEL[k as Discovery['kind']]}
            </button>
          ))}
        </fieldset>

        <AnimatePresence mode="wait">
          {current ? (
            <motion.div key={current.id} initial={{ opacity: 0, y: 24, rotate: -0.6 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} id="decouverte" tabIndex={-1} className="mt-8 rounded-[28px] bg-paper-2 p-6 outline-none sm:p-10">
              <DiscoveryCard d={current} headingLevel={2} />
            </motion.div>
          ) : (
            <p className="mt-10 t-lede text-ink-2">Appuie sur « Surprends-moi », ou choisis directement :</p>
          )}
        </AnimatePresence>

        <section className="mt-14" aria-labelledby="all-disc">
          <h2 id="all-disc" className="t-h2">
            Toutes les découvertes
          </h2>
          <ul className="mt-5 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {pool.map((d) => (
              <li key={d.id} className="border-t border-rule">
                <Link to={`/decouvrir/${d.id}`} className="group block py-4" aria-current={current?.id === d.id ? 'true' : undefined}>
                  <span className="t-meta flex items-center gap-2">
                    {KIND_LABEL[d.kind]}
                    {discovered.includes(d.id) && <span className="rounded-full bg-ok-bg px-2 text-[0.6875rem] font-semibold text-ok">vue</span>}
                  </span>
                  <span className="mt-1 block font-serif text-[1.2rem] leading-snug group-hover:underline">{d.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </MotionConfig>
  )
}
