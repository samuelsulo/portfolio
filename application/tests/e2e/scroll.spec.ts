import { expect, test, type Page } from '@playwright/test'

/**
 * Scrolling between sections and pages (see `scrollBehavior` in
 * src/router/index.ts). Sections slide in by 16px (`v-reveal`) while the
 * router has already computed the target, so a section can land up to 16px off
 * the top of the viewport: SECTION_TOLERANCE accepts that, and nothing more.
 */
const SECTION_TOLERANCE = 24

const sectionTop = (page: Page, id: string) =>
  page.evaluate((target) => document.getElementById(target)!.getBoundingClientRect().top, id)

/** Waits for a smooth scroll to finish and returns the final position. */
async function settledScrollY(page: Page): Promise<number> {
  let previous = -1
  await expect
    .poll(async () => {
      const current = await page.evaluate(() => Math.round(window.scrollY))
      const settled = current === previous
      previous = current
      return settled
    })
    .toBe(true)
  return previous
}

async function openFirstWork(page: Page) {
  const open = page.locator('.project-card__open').first()
  await open.scrollIntoViewIfNeeded()
  await open.click()
  await page.waitForURL(/\/work\//)
  await expect(page.locator('.work__back').first()).toBeVisible()
}

test.describe('scrolling', () => {
  for (const id of ['about', 'projects', 'stack', 'contact']) {
    test(`the menu scrolls to #${id}`, async ({ page }) => {
      await page.goto('/')
      await page.locator(`header a[href$="#${id}"]`).first().click()
      await settledScrollY(page)
      expect(Math.abs(await sectionTop(page, id))).toBeLessThanOrEqual(SECTION_TOLERANCE)
    })
  }

  test('opening /#projects directly lands on the section', async ({ page }) => {
    await page.goto('/#projects')
    // The content is fetched at startup: the section exists once the app is mounted.
    await page.locator('#projects').waitFor()
    await settledScrollY(page)
    expect(Math.abs(await sectionTop(page, 'projects'))).toBeLessThanOrEqual(SECTION_TOLERANCE)
  })

  test('a work page opens at the top', async ({ page }) => {
    await page.goto('/#projects')
    await page.locator('#projects').waitFor()
    await settledScrollY(page)
    await openFirstWork(page)
    expect(await settledScrollY(page)).toBe(0)
  })

  test('the back link of a work returns to the projects section', async ({ page }) => {
    await page.goto('/')
    await openFirstWork(page)
    await page.locator('.work__back').first().click()
    await page.waitForURL(/#projects/)
    await settledScrollY(page)
    expect(Math.abs(await sectionTop(page, 'projects'))).toBeLessThanOrEqual(SECTION_TOLERANCE)
  })

  test('the browser back button restores the scroll position', async ({ page }) => {
    await page.goto('/')
    await page.locator('.project-card__open').first().scrollIntoViewIfNeeded()
    const before = await settledScrollY(page)
    expect(before).toBeGreaterThan(0)

    await openFirstWork(page)
    await settledScrollY(page)
    await page.goBack()
    await page.waitForURL((url) => !url.pathname.startsWith('/work/'))
    expect(Math.abs((await settledScrollY(page)) - before)).toBeLessThanOrEqual(2)
  })
})
