import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import { getRegion } from "@lib/data/regions"
import { getProductByHandle } from "@lib/data/products"
import { getStoreName } from "@lib/util/env"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
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
  const { handle, countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id)

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | ${getStoreName()}`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | ${getStoreName()}`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle, countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await getProductByHandle(handle, region.id)
  if (!pricedProduct) {
    notFound()
  }

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={countryCode}
    />
  )
}
