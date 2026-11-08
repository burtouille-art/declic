import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Choices } from '../components/ui/Choices'
import ChronologyGame from './ChronologyGame'
import QuizGame from './QuizGame'
import TrueFalseGame from './TrueFalseGame'

vi.mock('../lib/news', async (orig) => ({ ...(await orig<typeof import('../lib/news')>()), useOnThisDay: () => ({ data: null, error: null, loading: false, reload: () => {} }) }))

const wrap = (ui: React.ReactNode, path = '/') => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

describe('Choices', () => {
  it('signale la bonne et la mauvaise réponse, au clic et au clavier', async () => {
    const onSelect = vi.fn()
    const { rerender } = render(<Choices options={['A', 'B', 'C']} selected={null} correct={1} onSelect={onSelect} legend="Q" />)
    fireEvent.keyDown(window, { key: '3' })
    expect(onSelect).toHaveBeenCalledWith(2)
    rerender(<Choices options={['A', 'B', 'C']} selected={2} correct={1} onSelect={onSelect} legend="Q" />)
    expect(screen.getByText('Bonne réponse')).toBeInTheDocument()
    expect(screen.getByText('Ta réponse')).toBeInTheDocument()
    expect(screen.getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })
})

describe('Quiz du jour', () => {
  it('se joue jusqu’au score final', async () => {
    const user = userEvent.setup()
    wrap(<QuizGame />, '/jouer/quiz')
    for (let k = 0; k < 10; k++) {
      const group = screen.getByRole('group')
      await user.click(within(group).getAllByRole('button')[0]!)
      await user.click(screen.getByRole('button', { name: k === 9 ? 'Voir mon score' : 'Question suivante' }))
    }
    expect(screen.getByRole('heading', { name: /\/10/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Refaire le quiz du jour/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quitter' })).toHaveAttribute('href', '/jouer')
  })
})

describe('Vrai ou faux', () => {
  it('affiche la correction et termine la série', async () => {
    const user = userEvent.setup()
    wrap(<TrueFalseGame />)
    for (let k = 0; k < 10; k++) {
      await user.click(screen.getByRole('button', { name: /^Vrai/ }))
      expect(screen.getByText(/Bien vu\.|Raté !/)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: k === 9 ? 'Voir mon score' : 'Affirmation suivante' }))
    }
    expect(screen.getByRole('button', { name: 'Nouvelle série' })).toBeInTheDocument()
  })
})

describe('Chronologie', () => {
  it('se réordonne au clavier et se valide', async () => {
    const user = userEvent.setup()
    wrap(<ChronologyGame />)
    const items = () => screen.getAllByRole('listitem')
    const label = (li: HTMLElement) => li.querySelector('p')!.textContent
    const firstLabel = label(items()[0]!)
    await user.click(within(items()[0]!).getByRole('button', { name: /Descendre/ }))
    expect(label(items()[1]!)).toBe(firstLabel)
    await user.click(screen.getByRole('button', { name: "Valider l'ordre" }))
    expect(screen.getByText(/à la bonne place|Ordre parfait/)).toBeInTheDocument()
    await act(async () => {})
  })
})
