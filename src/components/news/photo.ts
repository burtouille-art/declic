import type { Article } from '../../lib/news'

export type ArticleImage = NonNullable<Article['image']>
export type PhotoShape = 'portrait' | 'wide'

/**
 * Forme d'une photo : un portrait devient un médaillon, un lieu ou une image NASA une grande photo.
 * Le type de sujet fourni par le pipeline prime (une tour photographiée en hauteur reste un lieu) ;
 * à défaut, le ratio ; à défaut, une illustration sans dimensions est traitée prudemment en portrait.
 */
export function photoShape(img: ArticleImage): PhotoShape {
  if (img.subjectKind === 'person') return 'portrait'
  if (img.subjectKind === 'place') return 'wide'
  if (img.width && img.height) return img.height / img.width >= 1.05 ? 'portrait' : 'wide'
  return img.illustration ? 'portrait' : 'wide'
}

/** Clé de comparaison d'un sujet : sans accents, sans casse, espaces normalisés. */
const subjectKey = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/** Une tribune ne reçoit jamais de photo : un portrait à côté d'une opinion ressemble à une signature. */
export const photoAllowed = (a: Article) => !!a.image && a.kind !== 'opinion'

/**
 * Ids des articles autorisés à montrer leur photo, dans l'ordre d'affichage de la page.
 * Écarte une photo déjà montrée (même url) ou un sujet déjà montré (même sujet, sans casse ni accents).
 * Calcul pur : appelable pendant le rendu (StrictMode rend deux fois).
 */
export function pickPhotos(ordered: Article[], max = Infinity): Set<string> {
  const out = new Set<string>()
  const urls = new Set<string>()
  const subjects = new Set<string>()
  for (const a of ordered) {
    if (out.size >= max) break
    if (!photoAllowed(a) || out.has(a.id)) continue
    const img = a.image!
    const subj = img.subject ? subjectKey(img.subject) : null
    if (urls.has(img.url) || (subj && subjects.has(subj))) continue
    urls.add(img.url)
    if (subj) subjects.add(subj)
    out.add(a.id)
  }
  return out
}
