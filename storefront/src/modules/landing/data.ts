import "server-only"

import { HttpTypes } from "@medusajs/types"

import { listCategories } from "@lib/data/categories"
import { getCollectionByHandle } from "@lib/data/collections"
import { getProductsList } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { FEATURED_COLLECTION_HANDLE, FEATURED_PRODUCT_LIMIT } from "./config"
import { CATEGORIES } from "./content"

/** The slice of a Medusa product the featured showcase needs. */
export type FeaturedProduct = {
  id: string
  handle: string
  title: string
  description: string | null
  thumbnail: string | null
  /** Formatted cheapest price in the visitor's region, or null if unpriced. */
  price: string | null
}

const summarise = (text: string | null | undefined) => {
  if (!text) return null
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  return plain || null
}

/**
 * Products for "Selected for Excellence", straight from the store: the
 * configured collection when there is one, otherwise the newest products.
 *
 * Errors resolve to an empty list rather than throwing, so a backend hiccup
 * shows the section's quiet empty state instead of breaking the homepage.
 */
export async function getFeaturedProducts(countryCode: string): Promise<FeaturedProduct[]> {
  try {
    const queryParams: HttpTypes.StoreProductListParams = {
      limit: FEATURED_PRODUCT_LIMIT,
      order: "-created_at",
    }

    if (FEATURED_COLLECTION_HANDLE) {
      const collection = await getCollectionByHandle(FEATURED_COLLECTION_HANDLE).catch(() => undefined)
      if (collection) queryParams.collection_id = [collection.id]
    }

    const {
      response: { products },
    } = await getProductsList({ countryCode, queryParams })

    return products
      .filter((product) => product.handle)
      .map((product) => ({
        id: product.id,
        handle: product.handle!,
        title: product.title,
        description: summarise(product.subtitle) ?? summarise(product.description),
        thumbnail: product.thumbnail ?? product.images?.[0]?.url ?? null,
        price: getProductPrice({ product }).cheapestPrice?.calculated_price ?? null,
      }))
  } catch {
    return []
  }
}

/**
 * Category data for the showcase panels and the footer.
 *
 * `hrefs` maps each landing category to its Medusa category page when one
 * with a matching handle exists, and to the store otherwise. So the panels
 * link somewhere real today and pick up their categories automatically once
 * they are created in Medusa admin.
 */
export async function getLandingCategories() {
  const categories = await listCategories().catch(() => [] as HttpTypes.StoreProductCategory[])
  const known = new Set(categories.map((category) => category.handle))

  const hrefs = Object.fromEntries(
    CATEGORIES.map((category) => [
      category.handle,
      known.has(category.handle) ? `/categories/${category.handle}` : "/store",
    ])
  )

  const footer = categories
    .filter((category) => !category.parent_category && !category.parent_category_id)
    .slice(0, 6)
    .map(({ id, name, handle }) => ({ id, name, handle }))

  return { hrefs, footer }
}
