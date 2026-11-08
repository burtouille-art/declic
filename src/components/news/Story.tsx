import { ArrowUpRight, Layers } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { formatDateTime, relativeTime } from '../../lib/format'
import type { Article, Cluster } from '../../lib/news'
import { actions } from '../../lib/store'
import { CategoryTag, FavoriteButton } from '../ui/bits'

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

export function Meta({ article, showCategory = true, trailing }: { article: Article; showCategory?: boolean; trailing?: ReactNode }) {
  const cat = article.categories[0]
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {showCategory && cat && <CategoryTag id={cat} />}
      <span className="t-meta">
        <span className="font-semibold text-ink-2">{article.sourceName}</span>
        {' · '}
        <time dateTime={article.publishedAt} title={formatDateTime(article.publishedAt)}>
          {relativeTime(article.publishedAt)}
        </time>
      </span>
      {article.lang === 'en' && (
        <span className="rounded-sm border border-ink/25 px-1 text-[0.6875rem] font-semibold text-ink-2" title="Article en anglais">
          EN
        </span>
      )}
      {article.kind === 'analysis' && <span className="t-meta italic">Analyse</span>}
      {trailing && <span className="-my-2 ml-auto">{trailing}</span>}
    </div>
  )
}

function Photo({ article, className = '' }: { article: Article; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!article.image || failed) return null
  return (
    <figure className={className}>
      <img
        src={article.image.url}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="aspect-[3/2] w-full bg-paper-2 object-cover"
      />
      <figcaption className="t-meta mt-1.5">Photo : {article.image.credit}</figcaption>
    </figure>
  )
}

/** Article principal : grand titre, chapô du média. */
export function LeadStory({ article, cluster, onCompare }: { article: Article; cluster?: Cluster; onCompare?: () => void }) {
  return (
    <article className="headline-link relative">
      {article.image && <Photo article={article} className="mb-5" />}
      <Meta article={article} trailing={<FavoriteButton item={articleSaved(article)} className="-mr-2" />} />
      <h3 className="mt-3 t-h2 text-balance lg:t-h1">
        <ArticleLink article={article} className="headline stretched">
          {article.title}
        </ArticleLink>
      </h3>
      {article.summary && <p className="mt-4 t-lede measure text-ink-2">{article.summary}</p>}
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[0.875rem] font-semibold text-vermilion-ink">
          Lire sur {article.sourceName} <ArrowUpRight size={15} aria-hidden />
        </span>
        {cluster && onCompare && (
          <button type="button" onClick={onCompare} className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1.5 text-[0.8125rem] font-semibold hover:bg-paper-3">
            <Layers size={14} aria-hidden /> {cluster.sourceCount} médias en parlent
          </button>
        )}
      </div>
    </article>
  )
}

/** Ligne compacte pour les listes (titres secondaires). */
export function StoryRow({ article, cluster, onCompare, showCategory = true, size = 'md' }: { article: Article; cluster?: Cluster; onCompare?: () => void; showCategory?: boolean; size?: 'md' | 'lg' }) {
  return (
    <article className="headline-link relative py-4">
      <Meta article={article} showCategory={showCategory} trailing={<FavoriteButton item={articleSaved(article)} className="-mr-2 h-9 w-9" />} />
      <h3 className={`mt-1.5 ${size === 'lg' ? 't-h2' : 't-h3'} text-pretty`}>
        <ArticleLink article={article} className="headline stretched">
          {article.title}
        </ArticleLink>
      </h3>
      {cluster && onCompare && (
        <div className="relative z-10 mt-2">
          <button type="button" onClick={onCompare} className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-2.5 py-1 text-[0.75rem] font-semibold hover:bg-paper-3">
            <Layers size={13} aria-hidden /> {cluster.sourceCount} médias
          </button>
        </div>
      )}
    </article>
  )
}

/** Carte de grille, avec chapô et éventuelle photo libre de droits. */
export function StoryCard({ article, cluster, onCompare }: { article: Article; cluster?: Cluster; onCompare?: () => void }) {
  return (
    <article className="headline-link relative flex flex-col border-t border-ink pt-3">
      {article.image && <Photo article={article} className="mb-3" />}
      <Meta article={article} trailing={<FavoriteButton item={articleSaved(article)} className="-mr-2 h-9 w-9" />} />
      <h3 className="mt-2 t-h3 text-pretty">
        <ArticleLink article={article} className="headline stretched">
          {article.title}
        </ArticleLink>
      </h3>
      {article.summary && <p className="mt-2 line-clamp-4 text-[0.9375rem] leading-relaxed text-ink-2">{article.summary}</p>}
      {cluster && onCompare && (
        <div className="relative z-10 mt-auto pt-3">
          <button type="button" onClick={onCompare} className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-2.5 py-1 text-[0.75rem] font-semibold hover:bg-paper-3">
            <Layers size={13} aria-hidden /> {cluster.sourceCount} médias
          </button>
        </div>
      )}
    </article>
  )
}
