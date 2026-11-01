import { Suspense } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import { getStoreName, isSearchEnabled } from "@lib/util/env"
import BrandStatement from "../components/brand-statement"
import CategoryShowcase from "../components/category-showcase"
import FeaturedCollection from "../components/featured-collection"
import FinalCta from "../components/final-cta"
import Hero from "../components/hero"
import HorseStory from "../components/horse-story"
import LandingFooter from "../components/landing-footer"
import LandingNav from "../components/landing-nav"
import { LANDING_COLORS } from "../components/primitives"
import SmoothScroll from "../components/smooth-scroll"
import WhyEquidentum from "../components/why-equidentum"
import { getFeaturedProducts, getLandingCategories } from "../data"

/**
 * The Equidentum landing page, served as the store homepage.
 *
 * Content and photography live in content.ts, links in config.ts, and the
 * products are read from Medusa in data.ts. Each section is its own client
 * component with its own scroll choreography, inside a shared Lenis shell.
 */
export default async function LandingTemplate({ countryCode }: { countryCode: string }) {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(countryCode),
    getLandingCategories(),
  ])
  const storeName = getStoreName()

  return (
    <SmoothScroll initialBackground={LANDING_COLORS.charcoal}>
      <LandingNav
        storeName={storeName}
        searchEnabled={isSearchEnabled()}
        cart={
          <Suspense
            fallback={
              <LocalizedClientLink href="/cart" data-testid="nav-cart-link">
                Cart (0)
              </LocalizedClientLink>
            }
          >
            <CartButton />
          </Suspense>
        }
      />
      <div>
        <Hero />
        <BrandStatement />
        <CategoryShowcase hrefs={categories.hrefs} />
        <FeaturedCollection products={products} />
        <HorseStory />
        <WhyEquidentum />
        <FinalCta />
      </div>
      <LandingFooter storeName={storeName} categories={categories.footer} />
    </SmoothScroll>
  )
}
