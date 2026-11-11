import { ArrowUpRight, Layers } from 'lucide-react'
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { formatDateTime, relativeTime } from '../../lib/format'
import { countriesIn } from '../../lib/geo'
import type { Article, Cluster } from '../../lib/news'
import { actions } from '../../lib/store'
import { CategoryTag, FavoriteButton } from '../ui/bits'
import { ArticlePhoto, PhotoCredit } from './ArticlePhoto'
import { clusterAnalyses, clusterItems, PerspectiveList } from './Perspectives'
import { photoAllowed, photoShape } from './photo'

export { PhotoCredit } from './ArticlePhoto'

const LocatorMap = lazy(() => import('../viz/LocatorMap'))

export function articleSaved(a: Article) {
  return { id: `a:${a.id}`, type: 'article' as const, title: a.title, url: a.url, meta: a.sourceName }
}

function onOpen(a: Article) {
  actions.addHistory(articleSaved(a))
}

/** Lien sortant vers le média d'origine : nouvel onglet, sans transmettre d'opener. */
export function ArticleLink({ article, children, className = '' }: { article: Article; children: ReactNode; className?: string }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(article)} onAuxClick={() => onOpen(article)} className={className}>
      {children}
      <span className="sr-only"> — lire sur {article.sourceName} (nouvel onglet)</span>
    </a>
  )
}

/**
 * Ligne de métadonnées : ■ Rubrique  Média · il y a 4 h · EN — sur une seule ligne.
 * Le pays d'édition est gardé dans l'article principal, masqué sur mobile dans les listes.
 */
export function Meta({ article, showCategory = true, country = 'sm' }: { article: Article; showCategory?: boolean; country?: 'always' | 'sm' }) {
  const cat = article.categories[0]
  const foreign = article.sourceCountry && article.sourceCountry !== 'France'
  return (
    <div className="flex min-w-0 items-center gap-x-2">
      {showCategory && cat && <CategoryTag id={cat} className="shrink-0" />}
      <span className="min-w-0 truncate t-meta">
        <span className="font-semibold whitespace-nowrap text-ink-2">{article.sourceName}</span>
        {foreign && <span className={country === 'sm' ? 'hidden sm:inline' : ''}> ({article.sourceCountry})</span>}
        {' · '}
        <time dateTime={article.publishedAt} title={formatDateTime(article.publishedAt)}>
          {relativeTime(article.publishedAt)}
        </time>
        {article.kind === 'analysis' && <span className="italic"> · Analyse</span>}
        {article.kind === 'opinion' && <span className="italic"> · Tribune ou débat</span>}
      </span>
      {article.lang === 'en' && (
        <span className="shrink-0 rounded-[3px] border border-line-ui px-1 text-[0.6875rem] font-semibold text-ink-2" title="Article en anglais">
          EN
        </span>
      )}
    </div>
  )
}

/** Métadonnées + cœur, le cœur hors du flux : il ne passe jamais à la ligne. */
function MetaRow({ article, showCategory = true, country = 'sm' }: { article: Article; showCategory?: boolean; country?: 'always' | 'sm' }) {
  return (
    <div className="relative pr-10">
      <Meta article={article} showCategory={showCategory} country={country} />
      <span className="absolute top-1/2 -right-2 z-10 -translate-y-1/2">
        <FavoriteButton item={articleSaved(article)} className="h-9 w-9" />
      </span>
    </div>
  )
}

function CompareButton({ cluster, onCompare, size = 'md' }: { cluster: Cluster; onCompare: () => void; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      onClick={onCompare}
      className={`relative z-10 inline-flex items-center gap-1.5 rounded-full bg-paper-2 font-semibold before:absolute before:-inset-y-1 before:content-[''] hover:bg-paper-3 ${size === 'md' ? 'h-9 px-3.5 text-[0.8125rem]' : 'h-8 px-3 text-[0.75rem]'}`}
    >
      <Layers size={size === 'md' ? 14 : 13} aria-hidden /> {cluster.sourceCount} médias{size === 'md' ? ' en parlent' : ''}
    </button>
  )
}

/**
 * Article principal, trois variantes :
 * A. grande photo (lieu, NASA) → photo, légende, titre t-lead ;
 * B. portrait → titre t-display, chapô à côté d'un médaillon 4:5, légende ;
 * C. sans photo → titre t-display, chapô, carte de situation si un pays est cité.
 */
export function LeadStory({
  article,
  cluster,
  onCompare,
  locator = true,
  byId,
  showPhoto = true,
  priority = true,
}: {
  article: Article
  cluster?: Cluster
  onCompare?: () => void
  locator?: boolean
  byId?: Map<string, Article>
  showPhoto?: boolean
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const others = useMemo(() => (cluster && byId ? clusterItems(cluster, byId, article.id) : []), [cluster, byId, article.id])
  const image = showPhoto && !failed && photoAllowed(article) ? article.image : null
  const shape = image ? photoShape(image) : null
  // Pas de photo : une carte de situation quand un pays est explicitement cité.
  const places = useMemo(() => (locator && !image ? countriesIn(`${article.title} ${article.summary ?? ''}`).slice(0, 3) : []), [article, locator, image])
  const fail = () => setFailed(true)

  const title = (cls: string) => (
    <h3 className={`${cls} text-balance`}>
      <ArticleLink article={article} className="headline stretched">
        {article.title}
      </ArticleLink>
    </h3>
  )
  const summary = article.summary ? <p className="t-lede measure text-ink-2">{article.summary}</p> : null

  return (
    <article className="headline-link relative">
      {image && shape === 'wide' && (
        <>
          <ArticlePhoto image={image} variant="hero" priority={priority} onFail={fail} className="mb-4" />
          <MetaRow article={article} country="always" />
          {title('mt-2.5 t-lead')}
          {summary && <div className="mt-3">{summary}</div>}
        </>
      )}
      {image && shape === 'portrait' && (
        <>
          <MetaRow article={article} country="always" />
          {summary ? (
            <>
              {title('mt-3 t-display')}
              <div className="mt-4 grid grid-cols-[1fr_112px] items-start gap-4 sm:grid-cols-[1fr_168px] lg:grid-cols-[1fr_200px]">
                {summary}
                <ArticlePhoto image={image} variant="medallion" priority={priority} onFail={fail} />
              </div>
            </>
          ) : (
            <div className="mt-3 grid grid-cols-[1fr_112px] items-start gap-4 sm:grid-cols-[1fr_168px] lg:grid-cols-[1fr_200px]">
              {title('t-display')}
              <ArticlePhoto image={image} variant="medallion" priority={priority} onFail={fail} />
            </div>
          )}
          <PhotoCredit image={image} className="mt-2" />
        </>
      )}
      {!image && (
        <>
          <MetaRow article={article} country="always" />
          {title('mt-3 t-display')}
          {summary && <div className="mt-4">{summary}</div>}
        </>
      )}
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-1 t-label text-vermilion-ink">
          Lire sur {article.sourceName} <ArrowUpRight size={15} aria-hidden />
        </span>
        {cluster && onCompare && <CompareButton cluster={cluster} onCompare={onCompare} />}
      </div>
      {others.length > 0 && cluster && byId && (
        <div className="relative z-10 mt-6">
          <p className="t-label text-ink-2">Ailleurs, le même sujet</p>
          <div className="mt-1.5 lg:hidden">
            <PerspectiveList compact items={others.slice(0, 2)} analyses={clusterAnalyses(cluster, byId)} />
          </div>
          <div className="mt-1.5 hidden lg:block">
            <PerspectiveList compact items={others.slice(0, 3)} analyses={clusterAnalyses(cluster, byId)} />
          </div>
        </div>
      )}
      {places.length > 0 && (
        <div className="relative z-10 mt-6">
          <Suspense fallback={<div className="skeleton aspect-[960/330] rounded-[18px]" aria-hidden />}>
            <LocatorMap ids={places.map((p) => p.id)} names={places.map((p) => p.name)} height={300} />
          </Suspense>
        </div>
      )}
    </article>
  )
}

/**
 * Ligne de liste : métadonnées (cœur à droite, hors du flux), puis titre | vignette carrée.
 * `summary` ajoute le chapô du média (page Actualités).
 */
export function StoryRow({
  article,
  cluster,
  onCompare,
  showCategory = true,
  showPhoto = false,
  summary = false,
}: {
  article: Article
  cluster?: Cluster
  onCompare?: () => void
  showCategory?: boolean
  showPhoto?: boolean
  summary?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const image = showPhoto && !failed && photoAllowed(article) ? article.image : null
  return (
    <article className="headline-link relative py-4">
      <MetaRow article={article} showCategory={showCategory} />
      <div className={`mt-2 ${image ? 'grid grid-cols-[1fr_auto] items-start gap-4' : ''}`}>
        <div className="min-w-0">
          <h3 className="t-h3 text-pretty">
            <ArticleLink article={article} className="headline stretched">
              {article.title}
            </ArticleLink>
          </h3>
          {summary && article.summary && <p className="mt-1.5 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-2">{article.summary}</p>}
          {cluster && onCompare && (
            <div className="mt-2.5">
              <CompareButton cluster={cluster} onCompare={onCompare} size="sm" />
            </div>
          )}
        </div>
        {image && <ArticlePhoto image={image} variant="thumb" onFail={() => setFailed(true)} />}
      </div>
    </article>
  )
}
