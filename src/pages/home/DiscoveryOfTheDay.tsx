import { Shuffle } from 'lucide-react'
import { DiscoveryCard } from '../../components/discover/DiscoveryCard'
import { ButtonLink } from '../../components/ui/Button'
import { SectionHeading } from '../../components/ui/bits'
import { dailyDiscovery } from '../../lib/daily'

/** Une découverte par jour : plus d'aplat jaune, un filet jaune à gauche de la carte (même traitement en sombre). */
export function DiscoveryOfTheDay() {
  const d = dailyDiscovery()
  return (
    <section className="wrap mt-14 lg:mt-24" aria-labelledby="disc-title">
      <SectionHeading id="disc-title" title="Une découverte inattendue" />
      <div className="mt-5 grid gap-x-10 gap-y-6 lg:mt-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="measure text-ink-2">Chaque jour, un fait vérifié qui bouscule une idée reçue. Devine d'abord, lis ensuite.</p>
          <ButtonLink to="/decouvrir" variant="outline" className="mt-4" icon={<Shuffle size={17} aria-hidden />}>
            La machine à curiosités
          </ButtonLink>
        </div>
        <div className="border-l-4 border-sun bg-paper py-1 pl-5 sm:pl-7 lg:col-span-8">
          <DiscoveryCard d={d} compact />
        </div>
      </div>
    </section>
  )
}
