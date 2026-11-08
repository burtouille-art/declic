import { Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DiscoveryCard } from '../components/discover/DiscoveryCard'
import { ArticleLink, Meta } from '../components/news/Story'
import { ErrorState, Skeleton } from '../components/ui/bits'
import { DISCOVERIES, STATEMENTS } from '../content'
import { topStories, useNews } from '../lib/news'
import { pickRandom } from '../lib/random'
import { useAppState } from '../lib/store'

/** Mode « Je n'ai que 2 minutes » : trois titres, une découverte courte, une affirmation à trancher. */
export default function QuickPage() {
  const news = useNews()
  const discovered = useAppState((s) => s.discovered)
  const three = useMemo(() => (news.data ? topStories(news.data, 3, { lang: 'fr' }) : []), [news.data])
  const [d] = useState(() => {
    const short = DISCOVERIES.filter((x) => x.body.length < 520 && x.interaction === 'none')
    return pickRandom(short.filter((x) => !discovered.includes(x.id))) ?? pickRandom(short) ?? DISCOVERIES[0]!
  })
  const [st] = useState(() => pickRandom(STATEMENTS)!)
  const [tf, setTf] = useState<boolean | null>(null)

  return (
    <div className="wrap max-w-3xl pt-6 lg:pt-10">
      <p className="inline-flex items-center gap-2 t-label text-vermilion-ink">
        <Timer size={17} aria-hidden /> Environ 2 minutes de lecture
      </p>
      <h1 className="mt-2 t-display">Juste l'essentiel.</h1>

      <section className="mt-8" aria-labelledby="q-news">
        <h2 id="q-news" className="t-label">
          Trois titres
        </h2>
        {news.loading && !news.data && <Skeleton className="mt-3 h-40 w-full" />}
        {news.error && !news.data && <ErrorState title="Actualité indisponible." message={news.error} onRetry={news.reload} />}
        <ol className="mt-2 divide-y divide-rule border-y border-ink">
          {three.map((a) => (
            <li key={a.id} className="headline-link relative py-4">
              <Meta article={a} />
              <p className="mt-1 t-h3">
                <ArticleLink article={a} className="headline stretched">
                  {a.title}
                </ArticleLink>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-[24px] bg-sun/40 p-5 sm:p-7" aria-label="Une découverte">
        <DiscoveryCard d={d} compact />
      </section>

      <section className="mt-10" aria-labelledby="q-tf">
        <h2 id="q-tf" className="t-label">
          Vrai ou faux ?
        </h2>
        <p className="mt-2 font-serif text-[1.5rem] leading-snug">{st.statement}</p>
        <div className="mt-4 flex gap-3">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" disabled={tf !== null} onClick={() => setTf(v)} aria-pressed={tf === v} className={`h-12 flex-1 rounded-full border-2 font-semibold ${tf === null ? 'border-ink/20 hover:border-ink' : v === st.answer ? 'border-ok bg-ok-bg' : tf === v ? 'border-ko bg-ko-bg' : 'border-ink/10 text-ink-3'}`}>
              {v ? 'Vrai' : 'Faux'}
            </button>
          ))}
        </div>
        {tf !== null && (
          <p className="mt-4" aria-live="polite">
            <strong>{tf === st.answer ? 'Bien vu.' : 'Raté.'}</strong> {st.explanation}{' '}
            <a href={st.source.url} target="_blank" rel="noopener noreferrer" className="link-ed t-meta">
              Source
            </a>
          </p>
        )}
      </section>

      <p className="mt-12 text-ink-2">
        Encore un peu de temps ?{' '}
        <Link to="/declic" className="link-ed font-semibold text-ink">
          Fais le Déclic du jour en 5 minutes
        </Link>
        .
      </p>
    </div>
  )
}
