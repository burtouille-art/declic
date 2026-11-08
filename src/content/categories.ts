import type { CategoryId } from '../lib/store'

export type Tone = 'vermilion' | 'petrol' | 'sun' | 'ink'

export type CategoryMeta = { id: CategoryId; label: string; blurb: string; tone: Tone }

export const CATEGORIES: CategoryMeta[] = [
  { id: 'monde', label: 'Monde', blurb: "Ce qui se joue ailleurs et nous concerne ici.", tone: 'vermilion' },
  { id: 'france', label: 'France', blurb: 'Politique, institutions, vie publique.', tone: 'vermilion' },
  { id: 'societe', label: 'Société', blurb: 'Éducation, justice, modes de vie.', tone: 'vermilion' },
  { id: 'economie', label: 'Économie', blurb: 'Entreprises, emploi, prix, conjoncture.', tone: 'ink' },
  { id: 'sciences', label: 'Sciences', blurb: 'Découvertes, recherches, controverses.', tone: 'petrol' },
  { id: 'espace', label: 'Espace', blurb: 'Missions, observations, images du cosmos.', tone: 'petrol' },
  { id: 'environnement', label: 'Environnement', blurb: 'Climat, biodiversité, énergie.', tone: 'petrol' },
  { id: 'sante', label: 'Santé', blurb: 'Médecine, recherche, santé publique.', tone: 'petrol' },
  { id: 'technologie', label: 'Technologie', blurb: 'Numérique, objets, cybersécurité.', tone: 'ink' },
  { id: 'ia', label: 'IA', blurb: "L'intelligence artificielle, ses usages et ses débats.", tone: 'ink' },
  { id: 'histoire', label: 'Histoire', blurb: 'Le passé éclaire le présent.', tone: 'sun' },
  { id: 'culture', label: 'Culture', blurb: 'Livres, écrans, scènes, patrimoine.', tone: 'sun' },
  { id: 'sport', label: 'Sport', blurb: 'Résultats, compétitions, portraits.', tone: 'sun' },
  { id: 'insolite', label: 'Insolite', blurb: "L'actualité qui fait sourire ou lever un sourcil.", tone: 'sun' },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, CategoryMeta>

export const toneClasses: Record<Tone, { text: string; dot: string; bg: string }> = {
  vermilion: { text: 'text-vermilion-ink', dot: 'bg-vermilion', bg: 'bg-vermilion' },
  petrol: { text: 'text-petrol-ink', dot: 'bg-petrol', bg: 'bg-petrol' },
  sun: { text: 'text-sun-ink', dot: 'bg-sun', bg: 'bg-sun' },
  ink: { text: 'text-ink-2', dot: 'bg-ink', bg: 'bg-ink' },
}
