import { useMemo, useState } from 'react'
import { GameFrame, GameResult, type RecapItem } from '../components/game/GameFrame'
import { Button } from '../components/ui/Button'
import { Choices } from '../components/ui/Choices'
import { WorldMap, type Fill } from '../components/viz/WorldMap'
import { COUNTRIES } from '../content'
import { buildVoyageRounds, type Region, type VoyageMode, type VoyageRound } from '../lib/gameLogic'
import { actions, useAppState } from '../lib/store'

const MODES: { id: VoyageMode; label: string; help: string }[] = [
  { id: 'trouver', label: 'Trouve-le sur la carte', help: 'Un pays est nommé : touche le bon repère numéroté sur la carte (ou tape son numéro).' },
  { id: 'pays', label: 'Quel est ce pays ?', help: 'Un pays est colorié sur la carte : retrouve son nom.' },
  { id: 'capitale', label: 'Capitales', help: 'Un pays est colorié : choisis sa capitale.' },
]
type Box = [[number, number], [number, number]]
const REGIONS: { id: Region; label: string; box?: Box }[] = [
  { id: 'monde', label: 'Le monde' },
  { id: 'europe', label: 'Europe', box: [[-24, 35], [45, 70]] },
  { id: 'afrique', label: 'Afrique', box: [[-19, -35], [52, 37]] },
  { id: 'ameriques', label: 'Amériques', box: [[-125, -55], [-34, 60]] },
  { id: 'asie', label: 'Asie et Océanie', box: [[26, -46], [178, 55]] },
]

export default function VoyageGame() {
  const [mode, setMode] = useState<VoyageMode>('trouver')
  const [region, setRegion] = useState<Region>('europe')
  const [game, setGame] = useState<number | null>(null)
  const rounds = useMemo(() => (game === null ? [] : buildVoyageRounds(mode, region, game)), [mode, region, game])

  return (
    <GameFrame title="Le grand voyage" subtitle="Situer les pays, retrouver les capitales : la géographie sur une vraie carte.">
      {game === null ? (
        <div className="space-y-6">
          <fieldset>
            <legend className="t-label">Type de défi</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} className={`rounded-[18px] border-[1.5px] p-4 text-left ${mode === m.id ? 'border-ink bg-ink text-paper' : 'border-ink/15 hover:border-ink'}`}>
                  <span className="block font-semibold">{m.label}</span>
                  <span className={`mt-1 block text-[0.8125rem] ${mode === m.id ? 'text-paper/80' : 'text-ink-2'}`}>{m.help}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="t-label">Région</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button key={r.id} type="button" aria-pressed={region === r.id} onClick={() => setRegion(r.id)} className={`h-10 rounded-full border px-4 font-semibold ${region === r.id ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>
          <Button size="lg" variant="accent" onClick={() => setGame(Math.floor(Math.random() * 1e9))}>
            Partir pour 10 étapes
          </Button>
          <p className="t-meta">
            Fond de carte : Natural Earth 1:110m (domaine public), via le paquet world-atlas. Capitales :{' '}
            <a className="link-ed" href="https://fr.wikipedia.org/wiki/Liste_des_capitales_du_monde" target="_blank" rel="noopener noreferrer">
              liste des capitales du monde
            </a>{' '}
            ; les pays à capitale double ou contestée sont exclus des questions de capitale.
          </p>
        </div>
      ) : (
        <Run key={game} rounds={rounds} region={region} onReplay={() => setGame(Math.floor(Math.random() * 1e9))} onSettings={() => setGame(null)} />
      )}
    </GameFrame>
  )
}

function Run({ rounds, region, onReplay, onSettings }: { rounds: VoyageRound[]; region: Region; onReplay: () => void; onSettings: () => void }) {
  const [i, setI] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [recap, setRecap] = useState<RecapItem[]>([])
  const [done, setDone] = useState(false)
  const best = useAppState((s) => s.scores['voyage']?.best)
  const r = rounds[i]
  const fitIds = useMemo(() => (region === 'monde' ? undefined : COUNTRIES.filter((c) => c.continent === region || (region === 'asie' && c.continent === 'oceanie')).map((c) => c.id)), [region])

  if (done || !r) {
    const score = recap.filter((x) => x.ok).length
    return (
      <GameResult
        score={score}
        max={rounds.length}
        best={best}
        message={score >= 8 ? 'Un vrai globe-trotter.' : 'Chaque voyage laisse des repères : retente la même région pour les fixer.'}
        recap={recap}
        onReplay={onReplay}
        replayLabel="Nouveau voyage"
        extra={
          <Button variant="outline" size="lg" onClick={onSettings}>
            Changer de région
          </Button>
        }
      />
    )
  }

  const correctIndex = r.choices.findIndex((c) => c.id === r.target.id)
  const select = (k: number) => {
    if (sel !== null) return
    setSel(k)
    const ok = k === correctIndex
    if (ok) actions.addCountryFound(r.target.id)
    setRecap((x) => [...x, { prompt: r.mode === 'capitale' ? `Capitale : ${r.target.name}` : r.target.name, ok, detail: r.target.capital ? `Capitale : ${r.target.capital}` : undefined }])
  }
  const next = () => {
    if (i + 1 >= rounds.length) {
      actions.recordScore('voyage', recap.filter((x) => x.ok).length, rounds.length)
      setDone(true)
    } else {
      setI(i + 1)
      setSel(null)
    }
  }

  const fills: Record<string, Fill> = {}
  if (r.mode !== 'trouver') fills[r.target.id] = sel === null ? 'highlight' : sel === correctIndex ? 'ok' : 'ko'
  else if (sel !== null) {
    fills[r.target.id] = 'ok'
    const chosen = r.choices[sel]
    if (chosen && chosen.id !== r.target.id) fills[chosen.id] = 'ko'
  }
  const prompt = r.mode === 'trouver' ? `Où se trouve : ${r.target.name} ?` : r.mode === 'pays' ? 'Quel est le pays en couleur ?' : `Quelle est la capitale de ce pays ?`

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label="Étapes du voyage" aria-valuemin={0} aria-valuemax={rounds.length} aria-valuenow={i}>
          <div className="h-full rounded-full bg-vermilion transition-[width] duration-500" style={{ width: `${(i / rounds.length) * 100}%` }} />
        </div>
        <span className="t-meta tabular-nums">
          Étape {i + 1}/{rounds.length}
        </span>
      </div>
      <h2 className="mt-5 t-h2">{prompt}</h2>
      <div className="mt-4">
        <WorldMap
          label={r.mode === 'trouver' ? 'Carte avec quatre repères numérotés' : 'Carte : un pays est mis en évidence'}
          fitIds={fitIds}
          fitBox={REGIONS.find((x) => x.id === region)?.box}
          marker={r.mode !== 'trouver' ? r.target.id : undefined}
          fills={fills}
          pins={r.mode === 'trouver' ? r.choices.map((c, k) => ({ id: c.id, label: `Repère ${k + 1}` })) : []}
          onPin={(id) => select(r.choices.findIndex((c) => c.id === id))}
          pinState={sel !== null ? Object.fromEntries(r.choices.map((c, k) => [c.id, c.id === r.target.id ? 'ok' : k === sel ? 'ko' : 'idle'])) : {}}
          height={region === 'monde' ? 480 : 560}
        />
      </div>
      <div className="mt-5">
        {r.mode === 'trouver' ? (
          <Choices options={r.choices.map((_, k) => `Repère ${k + 1}`)} selected={sel} correct={correctIndex} onSelect={select} legend={prompt} compact />
        ) : (
          <Choices options={r.choices.map((c) => (r.mode === 'capitale' ? (c.capital ?? '') : c.name))} selected={sel} correct={correctIndex} onSelect={select} legend={prompt} compact />
        )}
      </div>
      {sel !== null && (
        <div className={`mt-5 rounded-[20px] border-l-4 p-5 ${sel === correctIndex ? 'border-ok bg-ok-bg' : 'border-ko bg-ko-bg'}`} aria-live="polite">
          <p className="t-h3">
            {sel === correctIndex ? 'Exact !' : 'Raté.'} {r.mode === 'capitale' ? `${r.target.capital} est la capitale de ${r.target.name}.` : `C'était ${r.target.name}${r.target.capital ? `, capitale ${r.target.capital}` : ''}.`}
          </p>
          <Button className="mt-3" onClick={next} autoFocus>
            {i + 1 >= rounds.length ? 'Voir le résultat' : 'Étape suivante'}
          </Button>
        </div>
      )}
    </div>
  )
}
