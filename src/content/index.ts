/**
 * Point d'accès unique aux contenus éditoriaux, validés par schéma au chargement.
 * Un contenu mal formé fait échouer les tests (src/content/content.test.ts).
 */
import { z } from 'zod'
import { COUNTRIES as C } from './countries'
import { DISCOVERIES as D } from './discoveries'
import { EVENTS as E } from './events'
import { FICHES as F, PATHS } from './fiches'
import { QUESTIONS as Q } from './questions'
import { REFLECTIONS as R } from './reflections'
import { STATEMENTS as S } from './statements'
import { countrySchema, discoverySchema, eventSchema, ficheSchema, questionSchema, reflectionSchema, statementSchema } from './types'

export const QUESTIONS = z.array(questionSchema).parse(Q)
export const STATEMENTS = z.array(statementSchema).parse(S)
export const EVENTS = z.array(eventSchema).parse(E)
export const COUNTRIES = z.array(countrySchema).parse(C)
export const DISCOVERIES = z.array(discoverySchema).parse(D)
export const FICHES = z.array(ficheSchema).parse(F)
export const REFLECTIONS = z.array(reflectionSchema).parse(R)
export { PATHS }

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))
export const STATEMENT_BY_ID = new Map(STATEMENTS.map((s) => [s.id, s]))
export const FICHE_BY_ID = new Map(FICHES.map((f) => [f.id, f]))
export const DISCOVERY_BY_ID = new Map(DISCOVERIES.map((d) => [d.id, d]))
export const COUNTRY_BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]))

export * from './types'
