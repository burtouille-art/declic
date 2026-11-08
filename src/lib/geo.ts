import { COUNTRIES, type Country } from '../content'

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

type Matcher = { country: Country; re: RegExp; caseSensitive: boolean }

const MATCHERS: Matcher[] = COUNTRIES.flatMap((c) =>
  [c.name, ...c.aliases].map((n) => {
    const caseSensitive = n.length <= 3
    const pattern = `(^|[^\\p{L}\\p{N}])${esc(caseSensitive ? n : fold(n))}(?=$|[^\\p{L}\\p{N}])`
    return { country: c, re: new RegExp(pattern, caseSensitive ? 'u' : 'iu'), caseSensitive }
  }),
)

/**
 * Pays explicitement nommés dans un texte (nom ou alias, frontières de mots).
 * Volontairement simple et vérifiable : aucune inférence, seulement des noms cités.
 */
export function countriesIn(text: string): Country[] {
  const folded = fold(text)
  const found = new Map<string, Country>()
  for (const m of MATCHERS) {
    if (found.has(m.country.id)) continue
    if (m.re.test(m.caseSensitive ? text : folded)) found.set(m.country.id, m.country)
  }
  return [...found.values()]
}
