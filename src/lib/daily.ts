/** Sélections quotidiennes reproductibles (même date = même contenu pour tous). */
import { DISCOVERIES, QUESTIONS, REFLECTIONS, STATEMENTS, type Discovery, type Question, type Reflection } from '../content'
import type { OnThisDay, OtdEvent, OtdQuestion } from './news'
import { dailyPick, dailySlice, dayKey } from './random'

export type QuizItem = {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
  source: { label: string; url: string }
  theme: string
  origin: 'banque' | 'ephemeride'
}

export const fromQuestion = (q: Question): QuizItem => ({ ...q, origin: 'banque' })
export const fromOtd = (q: OtdQuestion): QuizItem => ({ ...q, theme: 'histoire', origin: 'ephemeride' })

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
