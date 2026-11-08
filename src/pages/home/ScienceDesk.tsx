import { ArrowRight, FlaskConical } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArticleLink, Meta, StoryRow } from '../../components/news/Story'
import { Skeleton } from '../../components/ui/bits'
import type { Article } from '../../lib/news'

const Pendulum = lazy(() => import('../../components/viz/Pendulum').then((m) => ({ default: m.Pendulum })))

/** Section scientifique : une image spatiale libre de droits en vedette, les titres, une mini-expérience. */
export function ScienceDesk({ articles }: { articles: Article[] }) {
  const [imgOk, setImgOk] = useState(true)
  const hero = articles.find((a) => a.image)
  const list = articles.filter((a) => a !== hero).slice(0, 4)
  if (!articles.length) return null
  return (
    <section className="wrap mt-16 lg:mt-24" aria-labelledby="sci-title">
      <div className="flex items-end justify-between gap-4 border-b border-ink pb-3">
        <h2 id="sci-title" className="t-h1">
          Sciences & espace
        </h2>
        <Link to="/actus/sciences" className="hidden t-label hover:text-vermilion-ink sm:inline-flex sm:items-center sm:gap-1">
          Toute la rubrique <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-12">
        {hero && hero.image && imgOk && (
          <article className="headline-link relative lg:col-span-7">
            <div className="relative overflow-hidden bg-ink">
              <img
                src={hero.image.url}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgOk(false)}
                className="aspect-[16/10] w-full object-cover opacity-95"
              />
              <span className="absolute right-2 bottom-2 rounded-sm bg-ink/70 px-1.5 py-0.5 text-[0.6875rem] text-paper">Photo : {hero.image.credit}</span>
            </div>
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
        <div className={hero && imgOk ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <div className="divide-y divide-rule">
            {list.map((a) => (
              <StoryRow key={a.id} article={a} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10 grid items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="flex items-center gap-2 t-label text-petrol-ink">
            <FlaskConical size={17} aria-hidden /> Mini-expérience
          </p>
          <p className="mt-2 t-h2">Un pendule se moque-t-il de son poids ?</p>
          <p className="mt-2 text-ink-2">Change la longueur, la masse ou la planète, et regarde ce qui modifie vraiment le rythme.</p>
          <Link to="/apprendre/f-pendule" className="mt-3 inline-flex items-center gap-1 t-label hover:text-vermilion-ink">
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
