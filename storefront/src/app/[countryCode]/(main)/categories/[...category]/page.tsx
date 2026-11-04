import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import { StoreProductCategory } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getStoreName } from "@lib/util/env"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

/**
 * Rendered on request rather than prerendered at build time. Prerendering
 * fetched every page from the backend during `next build`, so the storefront
 * deploy failed whenever the backend was briefly unreachable, as it is while
 * it redeploys from the same push. The catalog fetches are still cached
 * (force-cache with tags), so a page costs a backend call only on its first
 * visit or after the catalog changes. `dynamic` replaces generateStaticParams,
 * which it is ignored alongside; see the collections page for why an empty
 * generateStaticParams is not an option.
 */
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params

  try {
    const { product_categories } = await getCategoryByHandle(category)

    const title = product_categories
      .map((category: StoreProductCategory) => category.name)
      .join(" | ")

    const description =
      product_categories[product_categories.length - 1].description ??
      `${title} category.`

    return {
      title: `${title} | ${getStoreName()}`,
      description,
      alternates: {
        canonical: `${category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category, countryCode } = await params
  const { sortBy, page } = await searchParams

  const { product_categories } = await getCategoryByHandle(category)

  if (!product_categories) {
    notFound()
  }

  return (
    <CategoryTemplate
      categories={product_categories}
      sortBy={sortBy}
      page={page}
      countryCode={countryCode}
    />
  )
}
