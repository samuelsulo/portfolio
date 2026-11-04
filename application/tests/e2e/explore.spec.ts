import { expect, test, type Page } from '@playwright/test'

/**
 * The 3D view (see src/views/ExploreView.vue): its engine must only be
 * downloaded when the visitor asks for it, and the figure has to be able to
 * walk up to an object and open it.
 */
/** Opens the 3D view and waits until the engine is downloaded and running (the app mounts after the content is fetched). */
async function openExplore(page: Page) {
  await page.goto('/3d')
  await expect(page.locator('canvas.explore__canvas')).toBeVisible()
  await expect(page.locator('.explore__loading')).toHaveCount(0)
}

/** Opens the menu with M and jumps to a room from its list. */
async function goToRoom(page: Page, name: string) {
  await page.keyboard.press('m')
  await page.locator('.explore__chip', { hasText: name }).click()
}

test.describe('3D view', () => {
  test('does not download the 3D engine until the visitor opens it', async ({ page }) => {
    const scripts: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url())
    })

    await page.goto('/')
    await expect(page.locator('#hero')).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(scripts.some((url) => /explorer-/.test(url))).toBe(false)

    await page.locator('header a.navbar__view').click()
    await expect(page).toHaveURL(/\/3d$/)
    await expect(page.locator('canvas.explore__canvas')).toBeVisible()
    await expect.poll(() => scripts.some((url) => /explorer-/.test(url))).toBe(true)
  })

  test('walks to an object and opens it', async ({ page }) => {
    await openExplore(page)

    await page.keyboard.down('ArrowUp')
    await expect(page.locator('.explore__prompt')).toBeVisible({ timeout: 10_000 })
    await page.keyboard.up('ArrowUp')

    await page.keyboard.press('e')
    // The first thing on the way is the about section, which opens over the scene.
    await expect(page.locator('.app-modal')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.app-modal')).toHaveCount(0)
  })

  test('moves between the rooms through the portals and the room list', async ({ page }) => {
    await openExplore(page)
    await expect(page.locator('.explore__room')).toHaveText(/hub/i)

    // The room list jumps to a room, where the portal back is right in front.
    await goToRoom(page, 'Work gallery')
    await expect(page.locator('.explore__room')).toHaveText(/work gallery/i)
    await expect(page.locator('.explore__prompt')).toContainText('Hub')

    await page.keyboard.press('e')
    await expect(page.locator('.explore__room')).toHaveText(/hub/i)
  })

  test('resumes where the visitor was after leaving the page', async ({ page }) => {
    await openExplore(page)
    await goToRoom(page, 'Stack room')
    await expect(page.locator('.explore__room')).toHaveText(/stack room/i)

    // Opening a work, the contact or the classic view leaves the page.
    await page.keyboard.press('m')
    await page.locator('.explore__exit').click()
    await expect(page.locator('#hero')).toBeVisible()
    await page.locator('header a.navbar__view').click()

    await expect(page.locator('.explore__loading')).toHaveCount(0)
    await expect(page.locator('.explore__room')).toHaveText(/stack room/i)
  })

  test('opens the dance menu with B and picks a dance', async ({ page }) => {
    await openExplore(page)
    await page.keyboard.press('b')
    await expect(page.locator('.explore__wheel')).toBeVisible()
    await page.keyboard.press('3')
    await expect(page.locator('.explore__wheel')).toHaveCount(0)

    // The figure keeps dancing until the visitor moves, and the menu can be dismissed.
    await page.keyboard.press('b')
    await expect(page.locator('.explore__wheel')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.explore__wheel')).toHaveCount(0)
  })

  test('captures the mouse on a click and releases it for the menus', async ({ page }) => {
    await openExplore(page)
    const isLocked = () => page.evaluate(() => document.pointerLockElement?.tagName === 'CANVAS')

    await page.locator('canvas.explore__canvas').click()
    await expect.poll(isLocked).toBe(true)
    await expect(page.locator('.explore__look')).toHaveCount(0)

    // The dance menu needs the cursor, so it gives the mouse back.
    await page.keyboard.press('b')
    await expect.poll(isLocked).toBe(false)
    await expect(page.locator('.explore__wheel')).toBeVisible()
  })

  test('shows a work over the scene without leaving it', async ({ page }) => {
    await page.goto('/3d?open=work:idea-bar')
    await expect(page.locator('.app-modal')).toBeVisible()
    await expect(page).toHaveURL(/\/3d\?open=/)
    await expect(page.locator('.app-modal')).toContainText('Bar I.D.E.A.')

    // Nothing is played under the sheet: B does not open the dance menu.
    await page.keyboard.press('b')
    await expect(page.locator('.explore__wheel')).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(page.locator('.app-modal')).toHaveCount(0)
    await expect(page).toHaveURL(/\/3d$/)
  })

  test('fills the screen with the sheet on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto('/3d?open=work:idea-bar')
    const card = page.locator('.app-modal')
    await expect(card).toBeVisible()
    const box = await card.boundingBox()
    expect(box?.width).toBe(390)
    expect(box?.height).toBe(780)

    // On a wide screen it stays a card over the scene.
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect.poll(async () => (await card.boundingBox())?.width).toBeLessThan(1280)
  })

  test('shows the pages of the CV over the scene', async ({ page }) => {
    await page.goto('/3d?open=cv:en')
    await expect(page.locator('.cv-viewer__page')).toHaveCount(2)
  })

  test('fills the screen and has a menu with the rooms and the way back to the classic view', async ({
    page,
  }) => {
    await openExplore(page)
    await expect(page.locator('header.navbar')).toHaveCount(0)
    await expect(page.locator('footer')).toHaveCount(0)

    // M and the button both open the menu, M and Escape close it.
    await page.keyboard.press('m')
    await expect(page.locator('.explore__menu')).toBeVisible()
    await page.keyboard.press('m')
    await expect(page.locator('.explore__menu')).toHaveCount(0)
    await page.locator('.explore__menu-button').click()
    await expect(page.locator('.explore__menu')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.explore__menu')).toHaveCount(0)

    await page.keyboard.press('m')
    await page.locator('.explore__exit').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('#hero')).toBeVisible()
  })
})
