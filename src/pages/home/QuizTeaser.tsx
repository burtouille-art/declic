import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Choices, shuffleOptions } from '../../components/ui/Choices'
import { dailyQuiz } from '../../lib/daily'
import type { OnThisDay } from '../../lib/news'
import { dayKey, hashString, mulberry32 } from '../../lib/random'
import { useAppState } from '../../lib/store'

/** Le quiz du jour s'ouvre directement sur sa première question, jouable sur place. */
export function QuizTeaser({ otd }: { otd: OnThisDay | null }) {
  const quiz = useMemo(() => dailyQuiz(new Date(), otd), [otd])
  const first = quiz[0]
  const q = useMemo(() => (first ? shuffleOptions(first.options, first.answer, mulberry32(hashString(first.id + dayKey()))) : null), [first])
  const [sel, setSel] = useState<number | null>(null)
  const best = useAppState((s) => s.scores['quiz-du-jour'])
  if (!first || !q) return null
  return (
    <section className="wrap mt-16 lg:mt-24" aria-labelledby="quiz-title">
      <div className="grid gap-8 rounded-[28px] bg-petrol p-6 text-on-petrol sm:p-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <h2 id="quiz-title" className="t-h1">
            Le quiz du jour
          </h2>
          <p className="mt-3 text-[1.0625rem] text-on-petrol/90">Dix questions, une correction expliquée et sourcée à chaque réponse. Le même quiz pour tout le monde, aujourd'hui.</p>
          {best && <p className="mt-3 t-label text-on-petrol/90">Ton meilleur score : {best.best}/10</p>}
          <Link to="/jouer/quiz" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-paper px-6 font-semibold text-ink hover:bg-paper/90">
            {sel === null ? 'Faire les 10 questions' : 'Continuer le quiz'} <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <div className="lg:col-span-7">
          <p className="t-label text-on-petrol/90">Question 1 sur 10</p>
          <p className="mt-2 font-serif text-[1.55rem] leading-snug font-medium" style={{ fontVariationSettings: "'opsz' 30" }}>
            {first.prompt}
          </p>
          <div className="mt-5">
            <Choices options={q.options} selected={sel} correct={q.answer} onSelect={setSel} legend={first.prompt} hotkeys={false} tone="onDark" compact />
          </div>
          {sel !== null && (
            <div className="mt-4" aria-live="polite">
              <p className="t-label">{sel === q.answer ? 'Exact !' : 'Raté, mais tu le sauras maintenant.'}</p>
              <p className="mt-1 text-[0.9375rem] text-on-petrol/90">{first.explanation}</p>
              <a href={first.source.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[0.8125rem] text-on-petrol/90 underline underline-offset-2">
                Source : {first.source.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
