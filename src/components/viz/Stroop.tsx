import { useRef, useState } from 'react'
import { shuffle } from '../../lib/random'
import { Button } from '../ui/Button'

const COLORS = [
  { name: 'ROUGE', css: '#d23b22' },
  { name: 'BLEU', css: '#2456c9' },
  { name: 'VERT', css: '#1d8a4a' },
  { name: 'JAUNE', css: '#b38600' },
] as const

type Trial = { word: number; ink: number }

function makeTrials(congruent: boolean): Trial[] {
  return shuffle(
    Array.from({ length: 8 }, (_, k) => {
      const ink = k % 4
      const word = congruent ? ink : (ink + 1 + (k % 3)) % 4
      return { word, ink }
    }),
  )
}

/**
 * Mini-expérience de Stroop : deux séries de 8 essais, on clique la couleur de l'ENCRE.
 * On mesure le temps moyen de réponse dans chaque condition.
 */
export function Stroop() {
  const [phase, setPhase] = useState<'intro' | 'congruent' | 'pause' | 'incongruent' | 'done'>('intro')
  const [trials, setTrials] = useState<Trial[]>([])
  const [k, setK] = useState(0)
  const [errors, setErrors] = useState(0)
  const times = useRef<{ congruent: number[]; incongruent: number[] }>({ congruent: [], incongruent: [] })
  const t0 = useRef(0)

  const begin = (cond: 'congruent' | 'incongruent') => {
    setTrials(makeTrials(cond === 'congruent'))
    setK(0)
    setPhase(cond)
    t0.current = performance.now()
  }
  const answer = (c: number) => {
    if (phase !== 'congruent' && phase !== 'incongruent') return
    const trial = trials[k]
    if (!trial) return
    if (c !== trial.ink) {
      setErrors((e) => e + 1)
      return
    }
    times.current[phase].push(performance.now() - t0.current)
    t0.current = performance.now()
    if (k + 1 < trials.length) setK(k + 1)
    else setPhase(phase === 'congruent' ? 'pause' : 'done')
  }
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)
  const trial = trials[k]

  return (
    <div className="rounded-[22px] bg-paper-2 p-4 sm:p-6">
      {phase === 'intro' && (
        <div>
          <p className="t-h3">À toi de tester</p>
          <p className="mt-2 text-ink-2">Clique la couleur de l'encre, le plus vite possible, sans tenir compte du mot écrit. Deux séries de huit mots.</p>
          <Button className="mt-4" onClick={() => begin('congruent')}>
            Commencer la série 1
          </Button>
        </div>
      )}
      {(phase === 'congruent' || phase === 'incongruent') && trial && (
        <div>
          <p className="t-meta">
            Série {phase === 'congruent' ? 1 : 2} · mot {k + 1} sur {trials.length}
          </p>
          <p className="my-6 text-center font-sans text-[2.6rem] font-extrabold tracking-wide select-none" style={{ color: COLORS[trial.ink]!.css }} aria-label={`Le mot ${COLORS[trial.word]!.name.toLowerCase()} écrit à l'encre ${COLORS[trial.ink]!.name.toLowerCase()}`}>
            {COLORS[trial.word]!.name}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COLORS.map((c, i) => (
              <button key={c.name} type="button" onClick={() => answer(i)} className="flex h-12 items-center justify-center gap-2 rounded-full border border-ink/20 bg-paper font-semibold hover:border-ink">
                <span className="h-4 w-4 rounded-full" style={{ background: c.css }} aria-hidden />
                {c.name.charAt(0) + c.name.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}
      {phase === 'pause' && (
        <div>
          <p className="t-h3">Série 1 terminée</p>
          <p className="mt-2 text-ink-2">Dans la série 2, le mot et la couleur ne correspondent plus. Même consigne : la couleur de l'encre.</p>
          <Button className="mt-4" onClick={() => begin('incongruent')}>
            Lancer la série 2
          </Button>
        </div>
      )}
      {phase === 'done' && (
        <div aria-live="polite">
          <p className="t-h3">Tes résultats</p>
          <dl className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <dt className="t-meta">Mot et couleur identiques</dt>
              <dd className="font-serif text-[2rem] tabular-nums">{(avg(times.current.congruent) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s</dd>
            </div>
            <div>
              <dt className="t-meta">Mot et couleur différents</dt>
              <dd className="font-serif text-[2rem] tabular-nums">{(avg(times.current.incongruent) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s</dd>
            </div>
          </dl>
          <p className="mt-3 text-ink-2">
            {avg(times.current.incongruent) > avg(times.current.congruent)
              ? 'Tu as été plus lent quand le mot contredisait la couleur : c’est l’effet Stroop.'
              : "Pas d'effet visible cette fois-ci : sur huit essais, le hasard compte beaucoup. Les études portent sur des centaines d'essais."}{' '}
            Erreurs corrigées : {errors}.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              times.current = { congruent: [], incongruent: [] }
              setErrors(0)
              setPhase('intro')
            }}
          >
            Recommencer
          </Button>
        </div>
      )}
    </div>
  )
}
