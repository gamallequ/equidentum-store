import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { revalidateStorefront } from '../lib/revalidate-storefront'

// Matches the shared tags the storefront puts on catalog reads in
// storefront/src/lib/data/cookies.ts. Purging all three on any catalog edit is
// deliberate: a product change also changes category and collection listings.
const CATALOG_TAGS = ['catalog-products', 'catalog-categories', 'catalog-collections']

export default async function catalogChangedHandler({ event }: SubscriberArgs<any>) {
  await revalidateStorefront(CATALOG_TAGS, event.name)
}

export const config: SubscriberConfig = {
  event: [
    'product.created',
    'product.updated',
    'product.deleted',
    'product-variant.updated',
    'product-variant.deleted',
    'product-category.created',
    'product-category.updated',
    'product-category.deleted',
    'product-collection.created',
    'product-collection.updated',
    'product-collection.deleted',
  ],
}
