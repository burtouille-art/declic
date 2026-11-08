import { z } from 'zod'

/** Toute connaissance affichée renvoie vers une source identifiable. */
export const sourceSchema = z.object({ label: z.string().min(2), url: z.string().url().startsWith('https://') })
export type Source = z.infer<typeof sourceSchema>

export const THEMES = ['sciences', 'espace', 'histoire', 'geographie', 'culture', 'corps', 'nature', 'technologie', 'langue'] as const
export type Theme = (typeof THEMES)[number]

export const questionSchema = z.object({
  id: z.string().regex(/^q-[a-z0-9-]+$/),
  theme: z.enum(THEMES),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  prompt: z.string().min(8),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().min(20),
  source: sourceSchema,
})
export type Question = z.infer<typeof questionSchema>

export const statementSchema = z.object({
  id: z.string().regex(/^tf-[a-z0-9-]+$/),
  theme: z.enum(THEMES),
  statement: z.string().min(10),
  answer: z.boolean(),
  explanation: z.string().min(20),
  source: sourceSchema,
})
export type Statement = z.infer<typeof statementSchema>

export const eventSchema = z.object({
  id: z.string().regex(/^ev-[a-z0-9-]+$/),
  year: z.number().int(),
  label: z.string().min(5),
  detail: z.string().min(10),
  era: z.enum(['antiquite', 'moyen-age', 'moderne', 'xixe', 'contemporain']),
  source: sourceSchema,
})
export type HistoryEvent = z.infer<typeof eventSchema>

export const countrySchema = z.object({
  id: z.string().regex(/^\d{3}$/), // code ISO 3166-1 numérique (identifiant de world-atlas)
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  capital: z.string().nullable(),
  continent: z.enum(['europe', 'afrique', 'ameriques', 'asie', 'oceanie']),
})
export type Country = z.infer<typeof countrySchema>

export const recallSchema = z.object({
  prompt: z.string(),
  options: z.array(z.string()).length(3),
  answer: z.number().int().min(0).max(2),
})
export type Recall = z.infer<typeof recallSchema>

export const discoverySchema = z.object({
  id: z.string().regex(/^d-[a-z0-9-]+$/),
  kind: z.enum(['phenomene', 'histoire', 'cerveau', 'invention', 'donnee', 'culture']),
  title: z.string(),
  hook: z.string(),
  body: z.string().min(80),
  interaction: z.enum(['stroop', 'blindspot', 'population', 'co2', 'pendulum', 'none']).default('none'),
  /** Une question posée AVANT de révéler l'explication (apprentissage actif). */
  teaser: z.object({ prompt: z.string(), options: z.array(z.string()).min(2).max(4), answer: z.number().int() }).optional(),
  recall: recallSchema,
  rubriques: z.array(z.string()).default([]),
  source: sourceSchema,
  more: sourceSchema,
})
export type Discovery = z.infer<typeof discoverySchema>

export const ficheSchema = z.object({
  id: z.string().regex(/^f-[a-z0-9-]+$/),
  theme: z.enum(['univers', 'corps-cerveau', 'terre-climat', 'histoire', 'technologie', 'societe']),
  title: z.string().endsWith('?'),
  intro: z.string(),
  steps: z.array(z.object({ heading: z.string(), text: z.string() })).min(2).max(4),
  check: z.object({ prompt: z.string(), options: z.array(z.string()).min(2).max(4), answer: z.number().int(), explanation: z.string() }),
  visual: z.enum(['pendulum', 'co2', 'population', 'timeline', 'blindspot', 'stroop', 'none']).default('none'),
  rubriques: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  sources: z.array(sourceSchema).min(1),
})
export type Fiche = z.infer<typeof ficheSchema>

export const reflectionSchema = z.object({
  id: z.string().regex(/^r-[a-z0-9-]+$/),
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(4),
  answer: z.number().int(),
  explanation: z.string().min(40),
  recall: recallSchema,
  source: sourceSchema,
})
export type Reflection = z.infer<typeof reflectionSchema>

export const wiki = (title: string, label?: string): Source => ({
  label: label ?? `Wikipédia — ${title.replace(/_/g, ' ')}`,
  url: `https://fr.wikipedia.org/wiki/${encodeURI(title)}`,
})
export const wikiEn = (title: string, label?: string): Source => ({
  label: label ?? `Wikipedia (en) — ${title.replace(/_/g, ' ')}`,
  url: `https://en.wikipedia.org/wiki/${encodeURI(title)}`,
})
