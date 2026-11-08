import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1000) < 1024

test.beforeEach(async ({ page }) => {
  // Les images distantes (NASA) ne sont pas nécessaires aux tests.
  await page.route(/nasa\.gov/, (r) => r.abort())
})

test('accueil : promesse, une, sources et dates visibles', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: /le monde a encore des choses à t'apprendre/i })).toBeVisible()
  const lead = page.locator('#une-title ~ div article').first()
  await expect(lead.locator('time')).toBeVisible()
  const link = lead.getByRole('link').filter({ hasText: /\w/ }).nth(1)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', /noopener/)
  await expect(page.getByText(/Actualisé .* articles de \d+ médias/)).toBeVisible()
  await page.getByRole('link', { name: 'Comprendre en 5 minutes' }).click()
  await expect(page).toHaveURL(/#\/declic$/)
})

test('navigation principale', async ({ page }) => {
  await page.goto('./')
  const nav = isMobile(page) ? page.getByRole('navigation', { name: 'Navigation rapide' }) : page.getByRole('navigation', { name: 'Navigation principale' })
  const targets = isMobile(page)
    ? [['Actus', /#\/actus$/, 'Actualités'], ['Jouer', /#\/jouer$/, 'Jouer'], ['Apprendre', /#\/apprendre$/, 'Apprendre']]
    : [['Actualités', /#\/actus$/, 'Actualités'], ['Découvrir', /#\/decouvrir$/, 'La machine à curiosités'], ['Jouer', /#\/jouer$/, 'Jouer'], ['Apprendre', /#\/apprendre$/, 'Apprendre']]
  for (const [label, url, h1] of targets) {
    await nav.getByRole('link', { name: label as string, exact: true }).click()
    await expect(page).toHaveURL(url as RegExp)
    await expect(page.getByRole('heading', { level: 1, name: h1 as string })).toBeVisible()
  }
  await page.goto('./#/nimporte-quoi')
  await expect(page.getByRole('heading', { name: "Cette page n'existe pas." })).toBeVisible()
})

test('actualités : rubrique, recherche et filtre', async ({ page }) => {
  await page.goto('./#/actus/monde')
  await expect(page.getByRole('heading', { level: 1, name: 'Monde' })).toBeVisible()
  const cards = page.locator('#news-results article')
  await expect.poll(async () => cards.count()).toBeGreaterThan(3)
  const before = await cards.count()
  await page.getByLabel('Rechercher dans les titres').fill('Pologne')
  await expect.poll(async () => cards.count()).toBeLessThan(before)
  await expect(cards.first()).toContainText(/Pologne|Krakow|Cracovie/)
  await page.getByRole('button', { name: 'Effacer la recherche' }).click()
  await page.getByRole('button', { name: 'En français seulement' }).click()
  await expect(page.locator('#news-results').getByText('EN', { exact: true })).toHaveCount(0)
  await page.goto('./#/actus/rubrique-inconnue')
  await expect(page.getByRole('heading', { name: "Cette page n'existe pas." })).toBeVisible()
})

test('Déclic du jour : parcours complet, persistance et recommencement', async ({ page }) => {
  await page.goto('./#/declic')
  await expect(page.getByRole('heading', { name: 'Le monde en trois informations' })).toBeVisible()
  await expect(page.locator('main ol > li')).toHaveCount(3)
  await page.getByRole('button', { name: 'Continuer' }).click()
  // Écran 2 : découverte (question d'intuition ou bouton de révélation)
  await expect(page.getByRole('heading', { name: 'Une découverte surprenante' })).toBeVisible()
  const reveal = page.getByRole('button', { name: "Révéler l'explication" })
  if (await reveal.isVisible()) await reveal.click()
  else await page.getByRole('group').getByRole('button').first().click()
  await expect(page.getByText(/^Source/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()
  // Écran 3
  await expect(page.getByRole('heading', { name: 'Une question qui fait réfléchir' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled()
  await page.getByRole('group').getByRole('button').first().click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  // Écran 4 : trois questions de mémoire
  await expect(page.getByRole('heading', { name: 'Défi de mémoire' })).toBeVisible()
  const groups = page.getByRole('group')
  await expect(groups).toHaveCount(3)
  for (let k = 0; k < 3; k++) await groups.nth(k).getByRole('button').first().click()
  await page.getByRole('button', { name: 'Voir mon bilan' }).click()
  await expect(page.getByRole('heading', { name: 'Déclic !' })).toBeVisible()
  await expect(page.getByText(/\d\/4 bonnes réponses/)).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Déclic !' })).toBeVisible()
  await page.getByRole('button', { name: 'Recommencer le parcours' }).click()
  await expect(page.getByRole('heading', { name: 'Le monde en trois informations' })).toBeVisible()
})

test('quiz du jour au clavier', async ({ page }) => {
  await page.goto('./#/jouer/quiz')
  for (let k = 0; k < 10; k++) {
    await expect(page.getByRole('group').getByRole('button').first()).toBeEnabled()
    await page.keyboard.press('1')
    const next = page.getByRole('button', { name: k === 9 ? 'Voir mon score' : 'Question suivante' })
    await expect(next).toBeFocused()
    await page.keyboard.press('Enter')
  }
  await expect(page.getByRole('heading', { name: /\/10/ })).toBeVisible()
})

test('grand voyage : une partie complète sur la carte', async ({ page }) => {
  await page.goto('./#/jouer/voyage')
  await page.getByRole('button', { name: 'Partir pour 10 étapes' }).click()
  for (let k = 0; k < 10; k++) {
    // Un coup sur la carte (repère), un coup dans la liste accessible : les deux chemins sont testés.
    const target = page.getByRole('button', { name: 'Repère 1', exact: true })
    await (k % 2 ? target.last() : target.first()).click()
    await page.getByRole('button', { name: k === 9 ? 'Voir le résultat' : 'Étape suivante' }).click()
  }
  await expect(page.getByRole('heading', { name: /\/10/ })).toBeVisible()
})

test('machine à curiosités et fiches', async ({ page }) => {
  await page.goto('./#/decouvrir')
  await page.getByRole('button', { name: 'Surprends-moi' }).click()
  await expect(page).toHaveURL(/#\/decouvrir\/d-/)
  await expect(page.locator('#decouverte h2')).toBeVisible()
  await page.goto('./#/apprendre/f-saisons')
  await page.getByRole('button', { name: 'Et ensuite ?' }).click()
  await page.getByRole('button', { name: 'Et ensuite ?' }).click()
  await page.getByRole('button', { name: /inclinaison de l'axe/ }).click()
  await expect(page.getByText('Exactement.')).toBeVisible()
  await page.goto('./#/apprendre')
  await expect(page.getByText('1 fiche terminée sur')).toBeVisible()
})

test('mon espace : favoris, préférences et thème', async ({ page }) => {
  await page.goto('./#/actus')
  const fav = page.getByRole('button', { name: /Ajouter « .* » aux favoris/ }).first()
  await fav.click()
  await page.goto('./#/moi')
  await expect(page.getByRole('heading', { name: 'Mes favoris' })).toBeVisible()
  await expect(page.locator('section[aria-labelledby="fav-title"] li')).toHaveCount(1)
  await page.getByRole('button', { name: 'Sombre', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('diagnostic des sources', async ({ page }) => {
  await page.goto('./#/diagnostic')
  await expect(page.getByRole('heading', { name: 'État des sources' })).toBeVisible()
  await expect(page.getByRole('table').getByRole('row')).not.toHaveCount(0)
})

test('hors ligne : fiches et jeux restent disponibles', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload() // la page est désormais contrôlée par le service worker
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await page.goto('./#/actus') // met en cache les données
  await expect(page.locator('#news-results article').first()).toBeVisible()
  await context.setOffline(true)
  await page.goto('./#/apprendre/f-trou-noir')
  await page.reload()
  await expect(page.getByRole('heading', { name: "Qu'est-ce qu'un trou noir, au juste ?" })).toBeVisible()
  await page.goto('./#/jouer/vrai-faux')
  await expect(page.getByRole('button', { name: /^Vrai/ })).toBeVisible()
  await context.setOffline(false)
})

for (const path of ['', '#/actus', '#/jouer', '#/apprendre/f-pendule', '#/moi', '#/decouvrir/d-stroop']) {
  test(`accessibilité automatisée (axe) : /${path}`, async ({ page }) => {
    await page.goto(`./${path}`)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  })
}
