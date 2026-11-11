import { ArrowRight, FlaskConical } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArticlePhoto } from '../../components/news/ArticlePhoto'
import { ArticleLink, Meta, StoryRow } from '../../components/news/Story'
import { SectionHeading, SectionLink, Skeleton } from '../../components/ui/bits'
import type { Article } from '../../lib/news'

const Pendulum = lazy(() => import('../../components/viz/Pendulum').then((m) => ({ default: m.Pendulum })))

/** Section scientifique : une grande photo (NASA, droits vérifiés) avec sa légende dessous, les titres, une mini-expérience. */
export function ScienceDesk({ hero, list, allowed }: { hero?: Article; list: Article[]; allowed: Set<string> }) {
  const [imgOk, setImgOk] = useState(true)
  const withHero = hero && hero.image && imgOk
  // Si la grande photo échoue, son article rejoint la liste (sans trou).
  const rows = withHero || !hero ? list : [hero, ...list].slice(0, 4)
  return (
    <section className="wrap mt-14 lg:mt-24" aria-labelledby="sci-title">
      <SectionHeading id="sci-title" title="Sciences & espace" action={<SectionLink to="/actus/sciences">Toute la rubrique</SectionLink>} />
      <div className="mt-5 grid gap-x-10 gap-y-6 lg:mt-6 lg:grid-cols-12">
        {withHero && hero.image && (
          <article className="headline-link relative lg:col-span-7">
            <ArticlePhoto image={hero.image} variant="hero" onFail={() => setImgOk(false)} />
            <div className="mt-4">
              <Meta article={hero} />
              <h3 className="mt-2 t-h2 text-pretty">
                <ArticleLink article={hero} className="headline stretched">
                  {hero.title}
                </ArticleLink>
              </h3>
              {hero.summary && <p className="mt-2 line-clamp-3 text-[0.9375rem] text-ink-2">{hero.summary}</p>}
            </div>
          </article>
        )}
        <div className={withHero ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <div className={`divide-y divide-rule ${withHero ? 'border-t border-rule lg:border-t-0' : ''}`}>
            {rows.map((a) => (
              <StoryRow key={a.id} article={a} showPhoto={allowed.has(a.id)} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10 grid items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="flex items-center gap-2 t-label text-petrol-ink">
            <FlaskConical size={17} aria-hidden /> Mini-expérience
          </p>
          <p className="mt-2 t-h3">Un pendule se moque-t-il de son poids ?</p>
          <p className="mt-2 text-ink-2">Change la longueur, la masse ou la planète, et regarde ce qui modifie vraiment le rythme.</p>
          <Link to="/apprendre/f-pendule" className="mt-1 inline-flex min-h-11 items-center gap-1 t-label hover:text-vermilion-ink">
            Lire la fiche <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="lg:col-span-8">
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <Pendulum />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
