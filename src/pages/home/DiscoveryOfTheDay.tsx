import { Shuffle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DiscoveryCard } from '../../components/discover/DiscoveryCard'
import { dailyDiscovery } from '../../lib/daily'

export function DiscoveryOfTheDay() {
  const d = dailyDiscovery()
  return (
    <section className="mt-16 bg-sun text-[#171b1d] lg:mt-24" aria-labelledby="disc-title">
      <div className="wrap grid gap-8 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
        <div className="lg:col-span-4">
          <h2 id="disc-title" className="font-serif text-[2.6rem] leading-[0.95] font-medium tracking-[-0.025em] sm:text-[3.4rem]" style={{ fontVariationSettings: "'opsz' 72" }}>
            Une découverte inattendue
          </h2>
          <p className="mt-4 max-w-xs text-[1rem] text-[#3a3214]">Chaque jour, un fait vérifié qui bouscule une idée reçue. Devine d'abord, lis ensuite.</p>
          <Link to="/decouvrir" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#171b1d] px-5 text-[0.9375rem] font-semibold text-[#f7f5ef] hover:bg-[#171b1d]/85">
            <Shuffle size={17} aria-hidden /> La machine à curiosités
          </Link>
        </div>
        <div className="rounded-[22px] bg-paper p-5 text-ink shadow-lift sm:p-8 lg:col-span-8">
          <DiscoveryCard d={d} compact />
        </div>
      </div>
    </section>
  )
}
