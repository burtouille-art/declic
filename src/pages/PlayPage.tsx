import { ArrowRight, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dueIds } from '../lib/srs'
import { dayKey } from '../lib/random'
import { useAppState } from '../lib/store'

function Score({ id, max }: { id: string; max?: number }) {
  const s = useAppState((st) => st.scores[id])
  if (!s) return <span className="t-meta">Pas encore joué</span>
  return (
    <span className="t-meta">
      Record {s.best}
      {max ? `/${max}` : ''} · {s.plays} partie{s.plays > 1 ? 's' : ''}
    </span>
  )
}

export default function PlayPage() {
  const srs = useAppState((s) => s.srs)
  const due = dueIds(srs).length
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return (
    <div className="wrap pt-6 lg:pt-10">
      <header className="border-b border-ink pb-5">
        <h1 className="t-display">Jouer</h1>
        <p className="mt-2 t-lede measure text-ink-2">Apprendre sans avoir l'impression de réviser. Chaque réponse est corrigée, expliquée et sourcée.</p>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        {/* Quiz du jour : la pièce maîtresse */}
        <Link to="/jouer/quiz" className="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-[28px] bg-petrol p-6 text-on-petrol sm:p-8 lg:col-span-7 lg:row-span-2">
          <div>
            <p className="t-label text-on-petrol/90">Quiz quotidien · {today}</p>
            <h2 className="mt-2 font-serif text-[2.6rem] leading-[1] font-medium tracking-[-0.02em] sm:text-[3.4rem]" style={{ fontVariationSettings: "'opsz' 72" }}>
              Le quiz du jour
            </h2>
            <p className="mt-3 max-w-md text-on-petrol/90">Dix questions de culture générale, dont des événements « ce jour-là » tirés de l'éphéméride. Les mêmes pour tout le monde.</p>
          </div>
          <svg viewBox="0 0 200 120" className="pointer-events-none absolute -right-6 -bottom-6 w-64 opacity-25 sm:w-80" aria-hidden>
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={10} y={8 + k * 28} width={150 - k * 22} height={18} rx={9} fill="none" stroke="currentColor" strokeWidth="3" />
            ))}
          </svg>
          <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-paper px-5 py-2.5 font-semibold text-ink group-hover:bg-paper/90">
            Jouer <ArrowRight size={18} aria-hidden />
          </span>
        </Link>

        <Link to="/jouer/vrai-faux" className="group flex flex-col justify-between rounded-[28px] bg-sun p-6 text-[#171b1d] lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="t-h1">Vrai ou faux ?</h2>
              <p className="mt-2 text-[#3a3214]">Idées reçues, intuitions trompeuses : tranche, puis découvre pourquoi.</p>
            </div>
            <span className="font-serif text-[2.2rem] leading-none italic" aria-hidden>
              V/F
            </span>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[0.8125rem] [&_.t-meta]:text-[#3a3214]"><Score id="vrai-faux" max={10} /></span>
            <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
          </div>
        </Link>

        <Link to="/jouer/chronologie" className="group flex flex-col justify-between rounded-[28px] border-[1.5px] border-ink p-6 lg:col-span-5">
          <div>
            <h2 className="t-h1">La chronologie</h2>
            <p className="mt-2 text-ink-2">Remets cinq événements dans l'ordre, au doigt ou au clavier.</p>
          </div>
          <svg viewBox="0 0 300 30" className="mt-5 w-full" aria-hidden>
            <line x1="4" x2="296" y1="15" y2="15" stroke="currentColor" strokeWidth="2" />
            {[20, 70, 150, 200, 270].map((x, k) => (
              <circle key={x} cx={x} cy="15" r={k === 2 ? 8 : 5} fill={k === 2 ? 'var(--vermilion)' : 'var(--paper)'} stroke="currentColor" strokeWidth="2" />
            ))}
          </svg>
          <div className="mt-4 flex items-center justify-between">
            <Score id="chronologie" max={5} />
            <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
          </div>
        </Link>

        <Link to="/jouer/60-secondes" className="group flex items-center gap-5 rounded-[28px] bg-ink p-6 text-paper lg:col-span-6">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-vermilion font-serif text-[1.8rem] tabular-nums" aria-hidden>
            60
          </span>
          <div className="flex-1">
            <h2 className="t-h2">Le défi des 60 secondes</h2>
            <p className="mt-1 text-paper/75">Le plus de bonnes réponses possible avant la fin du chrono.</p>
            <span className="mt-2 block text-paper/70 [&_.t-meta]:text-paper/70"><Score id="60-secondes" /></span>
          </div>
          <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>

        <Link to="/jouer/voyage" className="group relative flex items-center gap-5 overflow-hidden rounded-[28px] bg-paper-2 p-6 lg:col-span-6">
          <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0" aria-hidden>
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <ellipse cx="40" cy="40" rx="15" ry="34" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="6" x2="74" y1="40" y2="40" stroke="currentColor" strokeWidth="2" />
            <circle cx="52" cy="28" r="6" fill="var(--vermilion)" />
          </svg>
          <div className="flex-1">
            <h2 className="t-h2">Le grand voyage</h2>
            <p className="mt-1 text-ink-2">Pays, capitales, repères : la géographie sur une vraie carte.</p>
            <span className="mt-2 block"><Score id="voyage" max={10} /></span>
          </div>
          <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>

      <section className="mt-12 flex flex-col gap-4 border-y border-rule py-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="rev-title">
        <div className="flex items-center gap-4">
          <RefreshCw size={28} className="text-petrol-ink" aria-hidden />
          <div>
            <h2 id="rev-title" className="t-h3">
              Révisions
            </h2>
            <p className="text-ink-2">
              {due ? `${due} question${due > 1 ? 's' : ''} à revoir aujourd'hui.` : 'Rien à revoir aujourd’hui.'} Les erreurs reviennent le lendemain, puis à 3, 7, 14 et 30 jours.
            </p>
          </div>
        </div>
        <Link to="/jouer/quiz?mode=revisions" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-ink/25 px-5 font-semibold hover:border-ink" key={dayKey()}>
          Réviser maintenant
        </Link>
      </section>
    </div>
  )
}
