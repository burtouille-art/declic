import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('stockage local', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })
  it('récupère ce qui est valide dans des données partiellement corrompues', async () => {
    localStorage.setItem('declic:v1', JSON.stringify({ version: 1, discovered: ['d-x'], favorites: 'pas un tableau', prefs: { theme: 'dark', categories: ['monde'], lang: 'fr', onboarded: true } }))
    const { getState } = await import('./store')
    expect(getState().discovered).toEqual(['d-x'])
    expect(getState().favorites).toEqual([])
    expect(getState().prefs.theme).toBe('dark')
  })
  it('survit à un JSON illisible', async () => {
    localStorage.setItem('declic:v1', '{oups')
    const { getState } = await import('./store')
    expect(getState().favorites).toEqual([])
  })
  it('ajoute et retire un favori, et persiste', async () => {
    const { actions, getState } = await import('./store')
    actions.toggleFavorite({ id: 'a:1', type: 'article', title: 'T' })
    expect(getState().favorites).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('declic:v1')!).favorites).toHaveLength(1)
    actions.toggleFavorite({ id: 'a:1', type: 'article', title: 'T' })
    expect(getState().favorites).toHaveLength(0)
  })
})
