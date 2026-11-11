import { Check, X } from 'lucide-react'
import { useId, useLayoutEffect, useRef } from 'react'

type Props = {
  options: string[]
  /** index choisi, ou null tant que l'utilisateur n'a pas répondu */
  selected: number | null
  /** index correct, révélé quand selected !== null */
  correct: number
  onSelect: (index: number) => void
  legend: string
  /** raccourcis 1..4 au clavier (désactiver s'il y a plusieurs listes à l'écran) */
  hotkeys?: boolean
  compact?: boolean
  tone?: 'paper' | 'onDark'
}

/**
 * Question à choix multiples accessible : un groupe de boutons, retour visuel
 * ET textuel (icône + libellé), raccourcis clavier 1 à 4.
 */
export function Choices({ options, selected, correct, onSelect, legend, hotkeys = true, compact = false, tone = 'paper' }: Props) {
  const id = useId()
  const answered = selected !== null
  const groupRef = useRef<HTMLDivElement>(null)

  // useLayoutEffect : les raccourcis sont actifs dès que les choix sont visibles.
  useLayoutEffect(() => {
    if (!hotkeys || answered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.altKey || e.ctrlKey || e.metaKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) {
        e.preventDefault()
        onSelect(n - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotkeys, answered, options.length, onSelect])

  return (
    <div ref={groupRef} role="group" aria-labelledby={`${id}-legend`}>
      <p id={`${id}-legend`} className="sr-only">
        {legend}
      </p>
      <ul className={`grid gap-2.5 ${compact ? '' : 'sm:gap-3'}`}>
        {options.map((opt, i) => {
          const isCorrect = i === correct
          const isChosen = i === selected
          let state = 'idle'
          if (answered && isCorrect) state = 'correct'
          else if (answered && isChosen) state = 'wrong'
          else if (answered) state = 'muted'
          const styles: Record<string, string> =
            tone === 'onDark'
              ? {
                  idle: 'border-on-petrol/35 text-on-petrol hover:border-on-petrol hover:bg-on-petrol/10',
                  correct: 'border-on-petrol bg-on-petrol text-petrol-ink',
                  wrong: 'border-vermilion bg-vermilion text-ink-fixed',
                  muted: 'border-on-petrol/20 text-on-petrol/60',
                }
              : {
                  idle: 'border-line-ui bg-paper hover:border-ink hover:bg-paper-2',
                  correct: 'border-ok bg-ok-bg text-ink',
                  wrong: 'border-ko bg-ko-bg text-ink',
                  muted: 'border-rule text-ink-2 opacity-60',
                }
          return (
            <li key={`${i}-${opt}`}>
              <button
                type="button"
                disabled={answered}
                aria-describedby={answered && (isCorrect || isChosen) ? `${id}-st-${i}` : undefined}
                onClick={() => onSelect(i)}
                className={`group flex w-full items-center gap-3 rounded-2xl border-[1.5px] text-left transition-colors disabled:cursor-default ${compact ? 'min-h-12 px-3.5 py-2.5' : 'min-h-14 px-4 py-3'} ${styles[state]}`}
              >
                <span
                  aria-hidden
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.8125rem] font-semibold ${
                    state === 'idle' ? (tone === 'onDark' ? 'border-on-petrol/40' : 'border-line-ui') : 'border-transparent'
                  }`}
                >
                  {state === 'correct' ? <Check size={18} strokeWidth={2.5} /> : state === 'wrong' ? <X size={18} strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="text-[1rem] leading-snug font-medium">{opt}</span>
                {answered && (isCorrect || isChosen) && (
                  <span id={`${id}-st-${i}`} className="ml-auto shrink-0 text-[0.8125rem] font-semibold">
                    {isCorrect ? 'Bonne réponse' : 'Ta réponse'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Mélange les options en gardant la trace de la bonne réponse (déterministe si une graine est fournie). */
export function shuffleOptions(options: string[], answer: number, rng: () => number = Math.random) {
  const idx = options.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j] as number, idx[i] as number]
  }
  return { options: idx.map((i) => options[i] as string), answer: idx.indexOf(answer) }
}
