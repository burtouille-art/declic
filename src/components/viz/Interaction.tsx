import { CO2, POPULATION } from '../../content/datasets'
import { BlindSpot } from './BlindSpot'
import { LineChart } from './LineChart'
import { Pendulum } from './Pendulum'
import { Stroop } from './Stroop'

/** Aiguillage vers les mini-expériences (chargé à la demande). */
export default function Interaction({ kind }: { kind: string }) {
  switch (kind) {
    case 'co2':
      return <LineChart dataset={CO2} />
    case 'population':
      return <LineChart dataset={POPULATION} />
    case 'pendulum':
      return <Pendulum />
    case 'stroop':
      return <Stroop />
    case 'blindspot':
      return <BlindSpot />
    default:
      return null
  }
}
