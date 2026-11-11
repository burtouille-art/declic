import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Article } from '../../lib/news'
import { ArticlePhoto } from './ArticlePhoto'
import { photoShape, pickPhotos, type ArticleImage } from './photo'

const img = (o: Partial<ArticleImage> = {}): ArticleImage => ({ url: './data/img/0123456789abcdef.jpg', credit: 'Jean Dupont', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg', width: 960, height: 1125, illustration: true, subject: 'Gadi Eisenkot', ...o })
const art = (id: string, image: ArticleImage | null, kind: Article['kind'] = 'news'): Article => ({
  id,
  title: `Titre ${id}`,
  url: `https://example.org/${id}`,
  sourceId: 's',
  sourceName: 'Média',
  lang: 'fr',
  kind,
  publishedAt: '2026-11-08T18:00:00Z',
  summary: null,
  categories: ['monde'],
  image,
  clusterId: null,
})

describe('photoShape', () => {
  it('le type de sujet prime sur le ratio', () => {
    expect(photoShape(img({ subjectKind: 'place', width: 600, height: 1000 }))).toBe('wide')
    expect(photoShape(img({ subjectKind: 'person', width: 1000, height: 600 }))).toBe('portrait')
  })
  it('à défaut, le ratio ; sans dimensions, une illustration est un portrait, une photo NASA une grande photo', () => {
    expect(photoShape(img({ width: 960, height: 640 }))).toBe('wide')
    expect(photoShape(img({ width: 960, height: 1125 }))).toBe('portrait')
    expect(photoShape(img({ width: null, height: null }))).toBe('portrait')
    expect(photoShape(img({ width: null, height: null, illustration: false }))).toBe('wide')
  })
})

describe('pickPhotos', () => {
  it('écarte une photo déjà montrée (même url) ou un même sujet (casse, accents), et les tribunes', () => {
    const a = art('a', img())
    const b = art('b', img()) // même url
    const c = art('c', img({ url: './data/img/fedcba9876543210.jpg', subject: 'GADI EISENKÖT' })) // même sujet
    const d = art('d', img({ url: './data/img/1111111111111111.jpg', subject: 'Cracovie' }))
    const e = art('e', img({ url: './data/img/2222222222222222.jpg', subject: 'Paris' }), 'opinion')
    const f = art('f', null)
    expect([...pickPhotos([a, b, c, d, e, f])]).toEqual(['a', 'd'])
    expect([...pickPhotos([d, a], 1)]).toEqual(['d'])
  })
})

describe('ArticlePhoto', () => {
  it('vignette : le crédit s’ouvre au clavier et se ferme avec Échap', async () => {
    const user = userEvent.setup()
    render(<ArticlePhoto image={img()} variant="thumb" />)
    const btn = screen.getByRole('button', { name: 'Crédit de la photo : Gadi Eisenkot' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await user.tab()
    expect(btn).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('note')).toHaveTextContent(/Illustration : Gadi Eisenkot.*Jean Dupont.*CC BY-SA 4.0.*Wikimedia Commons/)
    expect(screen.getByRole('note')).toHaveTextContent(/pas l’événement/)
    await user.keyboard('{Escape}')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).toHaveFocus()
  })
  it('un portrait demandé en grand devient un médaillon, avec un texte alternatif « Illustration »', () => {
    const { container } = render(<ArticlePhoto image={img()} variant="hero" />)
    expect(container.querySelector('.aspect-\\[4\\/5\\]')).not.toBeNull()
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Illustration : Gadi Eisenkot')
  })
})
