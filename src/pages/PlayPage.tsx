import { ArrowRight, RefreshCw } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass } from '../components/ui/Button'
import { actuQuiz } from '../lib/daily'
import { useNewsQuiz } from '../lib/news'
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

/** Carte de jeu unifiée : même structure pour tous, la couleur seulement dans le pictogramme. */
function GameCard({ to, title, text, score, children, className = '' }: { to: string; title: string; text: string; score: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`group flex items-start gap-4 rounded-[20px] border border-rule bg-paper p-5 transition-colors hover:border-ink sm:gap-5 sm:p-6 lg:rounded-[28px] ${className}`}>
      <span className="shrink-0">{children}</span>
      <div className="min-w-0 flex-1">
        <h2 className="t-h2">{title}</h2>
        <p className="mt-1 text-ink-2">{text}</p>
        <span className="mt-2 block">{score}</span>
      </div>
      <ArrowRight className="mt-2 hidden shrink-0 transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
    </Link>
  )
}

export default function PlayPage() {
  const newsQuiz = useNewsQuiz()
  const actu = useMemo(() => actuQuiz(newsQuiz.data), [newsQuiz.data])
  const isActu = actu.length > 0
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
        {/* Le quiz (de l'actu quand les titres le permettent) : la pièce maîtresse, seule carte pétrole */}
        <Link to="/jouer/quiz" className="group flex min-h-64 flex-col justify-between rounded-[20px] bg-petrol p-6 text-on-petrol sm:p-8 lg:col-span-7 lg:row-span-2 lg:rounded-[28px]">
          <div>
            <p className="t-label text-on-petrol/90">Quiz quotidien · {today}</p>
            <h2 className="mt-2 t-h1">{isActu ? 'Le quiz de l’actu' : 'Le quiz du jour'}</h2>
            <p className="mt-3 max-w-md text-on-petrol/90">
              {isActu ? `${actu.length} vrais titres des dernières 48 heures, avec un mot qui manque.` : "Dix questions de culture générale, dont des événements « ce jour-là » tirés de l'éphéméride. Les mêmes pour tout le monde."}
            </p>
          </div>
          <span className={buttonClass('onPetrol', 'md', 'mt-6 w-fit')}>
            Jouer <ArrowRight size={17} aria-hidden />
          </span>
        </Link>

        <GameCard to="/jouer/vrai-faux" title="Vrai ou faux ?" text="Idées reçues, intuitions trompeuses : tranche, puis découvre pourquoi." score={<Score id="vrai-faux" max={10} />} className="lg:col-span-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sun font-serif text-[1.2rem] text-ink-fixed italic">V/F</span>
        </GameCard>
        <GameCard to="/jouer/chronologie" title="La chronologie" text="Remets cinq événements dans l'ordre, au doigt ou au clavier." score={<Score id="chronologie" max={5} />} className="lg:col-span-5">
          <svg viewBox="0 0 56 56" className="h-14 w-14 text-vermilion" aria-hidden>
            <line x1="4" x2="52" y1="28" y2="28" stroke="currentColor" strokeWidth="2.5" />
            {[10, 22, 34, 46].map((x, k) => (
              <circle key={x} cx={x} cy="28" r={k === 2 ? 6 : 4} fill={k === 2 ? 'currentColor' : 'var(--paper)'} stroke="currentColor" strokeWidth="2.5" />
            ))}
          </svg>
        </GameCard>
        <GameCard to="/jouer/60-secondes" title="Le défi des 60 secondes" text="Le plus de bonnes réponses possible avant la fin du chrono." score={<Score id="60-secondes" />} className="lg:col-span-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-ink font-serif text-[1.3rem] tabular-nums">60</span>
        </GameCard>
        <GameCard to="/jouer/voyage" title="Le grand voyage" text="Pays, capitales, repères : la géographie sur une vraie carte." score={<Score id="voyage" max={10} />} className="lg:col-span-6">
          <svg viewBox="0 0 80 80" className="h-14 w-14 text-petrol-ink" aria-hidden>
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="3" />
            <ellipse cx="40" cy="40" rx="15" ry="34" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <line x1="6" x2="74" y1="40" y2="40" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="52" cy="28" r="6" fill="var(--vermilion)" />
          </svg>
        </GameCard>
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
        <Link to="/jouer/quiz?mode=revisions" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-line-ui px-5 font-semibold hover:border-ink" key={dayKey()}>
          Réviser maintenant
        </Link>
      </section>
    </div>
  )
}
