import { expect, test, type Page } from '@playwright/test'

/**
 * What is downloaded, and when: nothing is fetched before it is needed or likely to be
 * (the other language, the data and images of the works, the logos of the stack).
 */
function recordRequests(page: Page) {
  const urls: string[] = []
  page.on('request', (request) => urls.push(new URL(request.url()).pathname))
  return urls
}

test.describe('loading', () => {
  test('fetches only the language of the visitor, and no work, at startup', async ({ page }) => {
    const urls = recordRequests(page)
    await page.goto('/')
    await expect(page.locator('#hero')).toBeVisible()
    await page.waitForLoadState('networkidle')

    expect(urls.filter((url) => url.startsWith('/content/locales/'))).toHaveLength(1)
    expect(urls.some((url) => url.startsWith('/content/data/cases/'))).toBe(false)
    expect(urls.some((url) => url.startsWith('/images/cases/'))).toBe(false)
  })

  test('fetches the other language when it is chosen', async ({ page }) => {
    const urls = recordRequests(page)
    await page.goto('/')
    await expect(page.locator('#hero')).toBeVisible()
    const before = urls.filter((url) => url.startsWith('/content/locales/')).length

    // The language switcher shows both languages: choose the one that is not active.
    await page.locator('header .language-switcher__option[aria-pressed="false"]').first().click()
    await expect
      .poll(() => urls.filter((url) => url.startsWith('/content/locales/')).length)
      .toBe(before + 1)
  })

  test('fetches the logos of the stack only when the section is about to be seen', async ({
    page,
  }) => {
    const urls = recordRequests(page)
    await page.goto('/')
    await expect(page.locator('#hero')).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(urls.some((url) => url.startsWith('/images/stack/'))).toBe(false)

    await page.locator('#stack').scrollIntoViewIfNeeded()
    await expect.poll(() => urls.some((url) => url.startsWith('/images/stack/'))).toBe(true)
    // All the logos come in one file, not one request each.
    await page.waitForLoadState('networkidle')
    expect(urls.filter((url) => url.startsWith('/images/stack/'))).toEqual([
      '/images/stack/sprite.svg',
    ])
  })

  test('starts fetching a work as soon as the visitor shows interest in it', async ({ page }) => {
    const urls = recordRequests(page)
    await page.goto('/')
    await expect(page.locator('#hero')).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(urls.some((url) => url.startsWith('/content/data/cases/'))).toBe(false)

    const card = page.locator('.project-card').first()
    await card.scrollIntoViewIfNeeded()
    await card.hover()
    await expect
      .poll(() => urls.filter((url) => url.startsWith('/content/data/cases/')).length)
      .toBe(1)
    // Only the one work, not all of them.
    expect(urls.filter((url) => url.startsWith('/content/data/cases/'))).toHaveLength(1)
  })

  test('fetches the CV of the other language only when the player walks up to it', async ({
    page,
  }) => {
    const urls = recordRequests(page)
    await page.goto('/3d')
    await expect(page.locator('canvas.explore__canvas')).toBeVisible()
    await expect(page.locator('.explore__loading')).toHaveCount(0)
    await page.keyboard.press('m')
    await page.locator('.explore__chip', { hasText: 'CV' }).click()
    await expect(page.locator('.explore__room')).toHaveText(/cv/i)
    await page.waitForLoadState('networkidle')

    // The browser reads in English: that CV is on the wall, the Italian one is not fetched yet.
    expect(urls.some((url) => url.endsWith('samuelsulo-cv-en-1.jpg'))).toBe(true)
    expect(urls.some((url) => url.endsWith('samuelsulo-cv-it-1.jpg'))).toBe(false)
  })

  test('fetches the stack logos of the 3D room as one sprite', async ({ page }) => {
    const urls = recordRequests(page)
    await page.goto('/3d')
    await expect(page.locator('canvas.explore__canvas')).toBeVisible()
    await expect(page.locator('.explore__loading')).toHaveCount(0)
    await page.keyboard.press('m')
    await page.locator('.explore__chip', { hasText: 'Stack room' }).click()
    await expect(page.locator('.explore__room')).toHaveText(/stack room/i)
    await expect.poll(() => urls.some((url) => url === '/images/stack/sprite.svg')).toBe(true)
    await page.waitForLoadState('networkidle')
    expect(urls.filter((url) => url.startsWith('/images/stack/'))).toEqual([
      '/images/stack/sprite.svg',
    ])
  })
})
