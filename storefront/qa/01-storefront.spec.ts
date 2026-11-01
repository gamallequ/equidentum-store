import { test, expect } from "@playwright/test"
import { qaEnv, url } from "./helpers"

test.describe("Storefront shell", () => {
  test("the root path redirects into the configured region", async ({ page }) => {
    await page.goto("/")

    // A region the seed does not cover used to land here anyway, silently
    // priced in euros. The default must be a country an actual region covers.
    await expect(page).toHaveURL(new RegExp(`/${qaEnv.region}(/|$)`))
  })

  /**
   * The cache id is the whole basis of cache invalidation in this storefront.
   * Every tagged read is scoped with it, and when it is missing getCacheDirectives
   * falls back to no-store, which silently turns caching off and brings back the
   * cart-repaint bug. Nothing else would fail loudly, so it is asserted directly
   * rather than left to reappear as flake.
   */
  test("each visitor gets their own cache id", async ({
    page,
    context,
    browser,
  }) => {
    await page.goto(url())

    const cacheCookie = (await context.cookies()).find(
      (cookie) => cookie.name === "_medusa_cache_id"
    )

    expect(
      cacheCookie?.value,
      "middleware must issue a _medusa_cache_id cookie"
    ).toBeTruthy()

    // A second visitor must not share it. If they did, one shopper adding to
    // their cart would purge every shopper's cached cart.
    const other = await browser.newContext()
    try {
      const otherPage = await other.newPage()
      await otherPage.goto(url())

      const otherCookie = (await other.cookies()).find(
        (cookie) => cookie.name === "_medusa_cache_id"
      )

      expect(otherCookie?.value).toBeTruthy()
      expect(otherCookie!.value).not.toEqual(cacheCookie!.value)
    } finally {
      await other.close()
    }
  })

  test("the store name is used, not the template's own name", async ({ page }) => {
    await page.goto(url())

    await expect(page.getByTestId("nav-store-link")).toHaveText(qaEnv.storeName)
    await expect(page).toHaveTitle(new RegExp(qaEnv.storeName, "i"))

    const footer = page.locator("footer")
    await expect(footer.getByRole("link", { name: qaEnv.storeName })).toBeVisible()
    await expect(footer).toContainText(
      `© ${new Date().getFullYear()} ${qaEnv.storeName}. All rights reserved.`
    )
  })

  test("no page still calls the store 'Medusa Store'", async ({ page }) => {
    for (const path of ["", "store", "account", "cart"]) {
      await page.goto(url(path))
      await expect(page.locator("body")).not.toContainText("Medusa Store")
    }
  })

  test("the footer links to collections and categories", async ({ page }) => {
    await page.goto(url())

    const categories = page.getByTestId("footer-categories")
    await expect(categories).toBeVisible()
    await expect(categories.getByTestId("category-link").first()).toBeVisible()
  })

  test("the main navigation reaches the store, account and cart", async ({ page }) => {
    await page.goto(url())

    await page.getByTestId("nav-store-link").click()
    await expect(page).toHaveURL(new RegExp(`/${qaEnv.region}/?$`))

    await page.getByTestId("nav-account-link").click()
    await expect(page).toHaveURL(/\/account/)

    await page.getByTestId("nav-cart-link").click()
    await expect(page).toHaveURL(/\/cart/)
  })

  test("the hero greets shoppers and leads into the store", async ({ page }) => {
    await page.goto(url())

    const hero = page.getByTestId("hero")
    await expect(hero).toBeVisible()
    await expect(
      hero.getByRole("heading", { level: 1, name: /beyond the ordinary/i })
    ).toBeVisible()

    // A storefront homepage should have exactly one h1, and it should not be a
    // link label.
    await expect(page.locator("h1")).toHaveCount(1)

    await page.getByTestId("hero-shop-button").click()
    await expect(page).toHaveURL(new RegExp(`/${qaEnv.region}/store`))
    await expect(page.getByTestId("store-page-title")).toBeVisible()
  })

  test("the hero photograph loads", async ({ page }) => {
    await page.goto(url())

    // A hero with a broken photograph is worse than no photograph at all.
    const images = page.getByTestId("hero").locator("img")
    for (const img of await images.all()) {
      if (!(await img.isVisible())) continue
      await expect
        .poll(async () =>
          img.evaluate((el: HTMLImageElement) => el.naturalWidth)
        )
        .toBeGreaterThan(0)
    }
  })

  test("the homepage does not advertise how it was deployed", async ({ page }) => {
    await page.goto(url())

    // Shoppers should not be told which host the store runs on, and the
    // storefront should not narrate its own deployment.
    const body = await page.locator("body").innerText()
    expect(body).not.toMatch(/railway/i)
    expect(body).not.toMatch(/successfully deployed/i)
  })

  test("the search link is shown when search is enabled", async ({ page }) => {
    test.skip(!qaEnv.searchEnabled, "search feature flag is off")

    await page.goto(url())
    await expect(page.getByTestId("nav-search-link")).toBeVisible()
  })
})
