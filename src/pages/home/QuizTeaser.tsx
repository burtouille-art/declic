import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ActuCorrection } from '../../components/game/ActuCorrection'
import { Choices, shuffleOptions } from '../../components/ui/Choices'
import { actuQuiz, dailyQuiz } from '../../lib/daily'
import { useNewsQuiz, type OnThisDay } from '../../lib/news'
import { dayKey, hashString, mulberry32 } from '../../lib/random'
import { useAppState } from '../../lib/store'

/** Le quiz de l'actu s'ouvre directement sur sa première question, jouable sur place. */
export function QuizTeaser({ otd }: { otd: OnThisDay | null }) {
  const newsQuiz = useNewsQuiz()
  const actu = useMemo(() => actuQuiz(newsQuiz.data), [newsQuiz.data])
  const quiz = useMemo(() => (actu.length ? actu : dailyQuiz(new Date(), otd)), [actu, otd])
  const isActu = actu.length > 0
  // En vitrine, de préférence un titre à trous (plus parlant qu'une question de comparaison).
  const first = quiz.find((x) => x.actu?.text) ?? quiz[0]
  const q = useMemo(() => (first ? shuffleOptions(first.options, first.answer, mulberry32(hashString(first.id + dayKey()))) : null), [first])
  const [sel, setSel] = useState<number | null>(null)
  const best = useAppState((s) => s.scores[isActu ? 'quiz-actu' : 'quiz-du-jour'])
  if (newsQuiz.loading && !newsQuiz.data && !newsQuiz.error) return null
  if (!first || !q) return null
  const [before, after] = first.actu?.text?.split('……') ?? []
  return (
    <section className="wrap mt-16 lg:mt-20" aria-labelledby="quiz-title">
      <div className="grid gap-8 rounded-[28px] bg-petrol p-6 text-on-petrol sm:p-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <h2 id="quiz-title" className="t-h1">
            {isActu ? 'Le quiz de l’actu' : 'Le quiz du jour'}
          </h2>
          <p className="mt-3 text-[1.0625rem] text-on-petrol/90">
            {isActu
              ? `${quiz.length} vrais titres des dernières 48 heures, avec un mot qui manque. À chaque réponse : l’article d’origine et ce qu’en disent d’autres médias.`
              : 'Dix questions, une correction expliquée et sourcée à chaque réponse.'}
          </p>
          {best && <p className="mt-3 t-label text-on-petrol/90">Ton meilleur score : {best.best}/{best.total ?? quiz.length}</p>}
          <Link to="/jouer/quiz" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-paper px-6 font-semibold text-ink hover:bg-paper/90">
            {sel === null ? `Faire les ${quiz.length} questions` : 'Continuer le quiz'} <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <div className="lg:col-span-7">
          <p className="t-label text-on-petrol/90">
            {first.actu?.text ? first.prompt : `Question 1 sur ${quiz.length}`}
          </p>
          <p className="mt-2 font-serif text-[1.5rem] leading-snug font-medium text-pretty" style={{ fontVariationSettings: "'opsz' 30" }}>
            {first.actu?.text && after !== undefined ? (
              <>
                {before}
                <span className="mx-0.5 inline-block min-w-[3.5ch] border-b-[3px] border-vermilion" aria-hidden>
                  {' '}
                </span>
                <span className="sr-only">(mot manquant)</span>
                {after}
              </>
            ) : (
              first.prompt
            )}
          </p>
          <div className="mt-5">
            <Choices options={q.options} selected={sel} correct={q.answer} onSelect={setSel} legend={first.actu?.text ? `${first.prompt} ${first.actu.text.replace('……', 'mot manquant')}` : first.prompt} hotkeys={false} tone="onDark" compact />
          </div>
          {sel !== null && (
            <div className="mt-4" aria-live="polite">
              <p className="t-label">{sel === q.answer ? 'Exact !' : 'Raté, mais tu le sauras maintenant.'}</p>
              {first.actu ? (
                <ActuCorrection item={first} tone="onDark" />
              ) : (
                <>
                  <p className="mt-1 text-[0.9375rem] text-on-petrol/90">{first.explanation}</p>
                  <a href={first.source.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[0.8125rem] text-on-petrol/90 underline underline-offset-2">
                    Source : {first.source.label}
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
