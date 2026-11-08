/** Sélections quotidiennes reproductibles (même date = même contenu pour tous). */
import { DISCOVERIES, QUESTIONS, REFLECTIONS, STATEMENTS, type Discovery, type Question, type Reflection } from '../content'
import type { NewsQuestion, NewsQuiz, OnThisDay, OtdEvent, OtdQuestion } from './news'
import { dailyPick, dailySlice, dayKey } from './random'

export type QuizItem = {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
  source: { label: string; url: string }
  theme: string
  origin: 'banque' | 'ephemeride' | 'actu'
  /** Question d'actualité : le titre à trous et l'article d'origine (correction). */
  actu?: Pick<NewsQuestion, 'type' | 'text' | 'solution' | 'article' | 'coverage'>
}

export const fromQuestion = (q: Question): QuizItem => ({ ...q, origin: 'banque' })
export const fromOtd = (q: OtdQuestion): QuizItem => ({ ...q, theme: 'histoire', origin: 'ephemeride' })

const ACTU_LABEL: Record<NewsQuestion['type'], string> = { pays: 'Le pays', qui: 'Le nom', nombre: 'Le chiffre', angle: 'Le titre' }

export const fromNews = (q: NewsQuestion): QuizItem => ({
  id: q.id,
  prompt: q.prompt,
  options: q.options,
  answer: q.answer,
  explanation: `${ACTU_LABEL[q.type]} : ${q.solution}.`,
  source: { label: q.article.sourceName, url: q.article.url },
  theme: q.article.category,
  origin: 'actu',
  actu: { type: q.type, text: q.text, solution: q.solution, article: q.article, coverage: q.coverage },
})

/** Nombre minimal de questions d'actualité pour proposer le quiz de l'actu. */
export const MIN_ACTU = 5

/** Quiz de l'actu : questions construites à partir des titres réels des dernières 48 h. */
export function actuQuiz(quiz: NewsQuiz | null | undefined): QuizItem[] {
  const qs = (quiz?.questions ?? []).map(fromNews)
  return qs.length >= MIN_ACTU ? qs.slice(0, 10) : []
}

export function otdForDate(otd: OnThisDay | null | undefined, date = new Date()): { events: OtdEvent[]; questions: OtdQuestion[] } | null {
  if (!otd) return null
  const key = dayKey(date).slice(5) // MM-JJ
  return otd.days[key] ?? null
}

/**
 * Quiz du jour : 10 questions. Jusqu'à 2 viennent de l'éphéméride Wikipédia du jour
 * (données structurées : année + événement), le reste de la banque vérifiée,
 * par rotation sans répétition.
 */
export function dailyQuiz(date = new Date(), otd?: OnThisDay | null): QuizItem[] {
  const fromEph = (otdForDate(otd, date)?.questions ?? []).slice(0, 2).map(fromOtd)
  const bank = dailySlice(QUESTIONS, 10 - fromEph.length, date, 'quiz').map(fromQuestion)
  // Les questions d'éphéméride sont placées en 3e et 7e position pour rythmer.
  const out = [...bank]
  if (fromEph[0]) out.splice(2, 0, fromEph[0])
  if (fromEph[1]) out.splice(6, 0, fromEph[1])
  return out.slice(0, 10)
}

export const dailyDiscovery = (date = new Date()): Discovery => dailyPick(DISCOVERIES, date, 'decouverte') as Discovery
export const dailyReflection = (date = new Date()): Reflection => dailyPick(REFLECTIONS, date, 'reflexion') as Reflection
export const dailyStatements = (date = new Date(), n = 10) => dailySlice(STATEMENTS, n, date, 'vrai-faux')
