const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const weekdayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function relativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const diff = (date.getTime() - now.getTime()) / 1000
  const abs = Math.abs(diff)
  if (Number.isNaN(abs)) return ''
  // Une date légèrement dans le futur (horloges décalées) est traitée comme « à l'instant ».
  if (abs < 60 || (diff > 0 && diff < 86_400)) return "à l'instant"
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86_400 * 7) return rtf.format(Math.round(diff / 86_400), 'day')
  return dateFmt.format(date)
}

export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const formatToday = (d: Date = new Date()) => {
  const s = weekdayFmt.format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Temps de lecture estimé (230 mots/min, minimum 1). */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 230))
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
